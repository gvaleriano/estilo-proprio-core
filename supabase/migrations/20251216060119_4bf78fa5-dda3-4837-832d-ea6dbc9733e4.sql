-- Drop existing overly permissive policies on sales table
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;

-- Create role-based RLS policies for sales

-- Admins can view all sales
CREATE POLICY "Admins can view all sales" 
ON public.sales 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Sellers can view their own sales
CREATE POLICY "Sellers can view own sales" 
ON public.sales 
FOR SELECT 
USING (seller_id = auth.uid());

-- Authenticated users can create sales (with seller_id = their uid)
CREATE POLICY "Users can create own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (seller_id = auth.uid() OR seller_id IS NULL);

-- Admins can update any sale
CREATE POLICY "Admins can update all sales" 
ON public.sales 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Sellers can update their own sales
CREATE POLICY "Sellers can update own sales" 
ON public.sales 
FOR UPDATE 
USING (seller_id = auth.uid());