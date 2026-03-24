
-- Update consigned products for Andrea Schoeder (ASC) with sequential numbering
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM products
  WHERE consigned = true AND consignor_id = 'df25a715-6dff-43ae-b6c2-cfaa4d4f64b6'
)
UPDATE products p
SET sku = 'ASC-' || LPAD(n.rn::text, 3, '0')
FROM numbered n
WHERE p.id = n.id;

-- Update non-consigned products AND consigned without consignor with EPB prefix
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM products
  WHERE consigned = false OR (consigned = true AND consignor_id IS NULL)
)
UPDATE products p
SET sku = 'EPB-' || LPAD(n.rn::text, 3, '0')
FROM numbered n
WHERE p.id = n.id;
