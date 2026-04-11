
-- Fix products INSERT: restrict to admins
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;
CREATE POLICY "Admins can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix stock_movements INSERT: restrict to admins
DROP POLICY IF EXISTS "Authenticated users can create stock movements" ON public.stock_movements;
CREATE POLICY "Admins can create stock movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
