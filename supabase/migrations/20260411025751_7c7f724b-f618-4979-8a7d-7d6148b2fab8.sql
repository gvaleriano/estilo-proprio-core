
-- 1. Fix update_product RPC: add admin check
CREATE OR REPLACE FUNCTION public.update_product(p_id uuid, p_sku text DEFAULT NULL, p_title text DEFAULT NULL, p_description text DEFAULT NULL, p_category text DEFAULT NULL, p_size text DEFAULT NULL, p_brand text DEFAULT NULL, p_price numeric DEFAULT NULL, p_consigned boolean DEFAULT NULL, p_consignor_id uuid DEFAULT NULL, p_consignment_percentage numeric DEFAULT NULL, p_stock_quantity integer DEFAULT NULL, p_images text[] DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  new_status product_status;
BEGIN
  -- Authorization check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar produtos';
  END IF;

  IF p_stock_quantity IS NOT NULL AND p_stock_quantity > 0 THEN
    new_status := 'available';
  ELSE
    SELECT status INTO new_status FROM products WHERE id = p_id;
  END IF;

  UPDATE products
  SET 
    sku = COALESCE(p_sku, sku),
    title = COALESCE(p_title, title),
    description = p_description,
    category = p_category,
    size = p_size,
    brand = p_brand,
    price = COALESCE(p_price, price),
    consigned = COALESCE(p_consigned, consigned),
    consignor_id = p_consignor_id,
    consignment_percentage = p_consignment_percentage,
    stock_quantity = COALESCE(p_stock_quantity, stock_quantity),
    images = COALESCE(p_images, images),
    status = new_status,
    updated_at = now()
  WHERE id = p_id;
  
  SELECT row_to_json(p.*) INTO result
  FROM products p
  WHERE p.id = p_id;
  
  RETURN result;
END;
$function$;

-- 2. Fix products UPDATE policy: restrict to admins
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- 3. Fix events policies: restrict write ops to admins
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Admins can create events"
  ON public.events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 4. Fix cash_flow INSERT policy: restrict to admins  
DROP POLICY IF EXISTS "Authenticated users can create cash flow entries" ON public.cash_flow;
CREATE POLICY "Admins can create cash flow entries"
  ON public.cash_flow FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Fix generate_client_initials search_path (already immutable, just needs search_path)
CREATE OR REPLACE FUNCTION public.generate_client_initials(client_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  parts text[];
  first_name text;
  last_name text;
  result text;
BEGIN
  parts := string_to_array(trim(client_name), ' ');
  
  IF array_length(parts, 1) IS NULL OR array_length(parts, 1) < 2 THEN
    result := upper(left(trim(client_name), 3));
  ELSE
    first_name := parts[1];
    last_name := parts[array_length(parts, 1)];
    result := upper(left(first_name, 1) || left(last_name, 2));
  END IF;
  
  RETURN result;
END;
$function$;
