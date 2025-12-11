-- Update the function to also set status to 'available' when stock > 0
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
  new_status product_status;
BEGIN
  -- Determine status based on stock quantity
  IF p_stock_quantity IS NOT NULL AND p_stock_quantity > 0 THEN
    new_status := 'available';
  ELSE
    -- Keep existing status if stock not being updated or is 0
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
$$;