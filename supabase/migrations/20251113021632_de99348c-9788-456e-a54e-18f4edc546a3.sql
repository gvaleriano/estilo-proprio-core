-- Add consignment percentage column to products table
ALTER TABLE public.products 
ADD COLUMN consignment_percentage numeric CHECK (consignment_percentage >= 0 AND consignment_percentage <= 100);