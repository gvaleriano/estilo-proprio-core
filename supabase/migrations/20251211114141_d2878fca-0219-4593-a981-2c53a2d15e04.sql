-- Create a function to update products via RPC (to avoid PATCH issues)
CREATE OR REPLACE FUNCTION public.update_product(
  p_id uuid,
  p_sku text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_size text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_consigned boolean DEFAULT NULL,
  p_consignor_id uuid DEFAULT NULL,
  p_consignment_percentage numeric DEFAULT NULL,
  p_stock_quantity integer DEFAULT NULL,
  p_images text[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
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
    updated_at = now()
  WHERE id = p_id;
  
  SELECT row_to_json(p.*) INTO result
  FROM products p
  WHERE p.id = p_id;
  
  RETURN result;
END;
$$;