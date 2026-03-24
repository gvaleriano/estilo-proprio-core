
-- Add initials column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS initials text;

-- Function to generate client initials from name
CREATE OR REPLACE FUNCTION public.generate_client_initials(client_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
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
$$;

-- Update existing clients with initials
UPDATE public.clients 
SET initials = public.generate_client_initials(name)
WHERE initials IS NULL;

-- Trigger to auto-generate initials on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_client_initials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.initials := public.generate_client_initials(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_initials ON public.clients;
CREATE TRIGGER trigger_auto_generate_initials
  BEFORE INSERT OR UPDATE OF name ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_client_initials();
