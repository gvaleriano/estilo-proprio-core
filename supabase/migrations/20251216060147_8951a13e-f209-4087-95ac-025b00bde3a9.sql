-- Fix event_invitations RLS policies
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Authenticated users can delete invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON public.event_invitations;

-- Admins can manage all invitations
CREATE POLICY "Admins can view all invitations" 
ON public.event_invitations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations" 
ON public.event_invitations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations" 
ON public.event_invitations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Fix clients RLS policies
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- Admins can fully manage clients
CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients" 
ON public.clients 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients" 
ON public.clients 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Sellers can view clients associated with their sales
CREATE POLICY "Sellers can view clients from their sales" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.client_id = clients.id 
    AND sales.seller_id = auth.uid()
  )
);