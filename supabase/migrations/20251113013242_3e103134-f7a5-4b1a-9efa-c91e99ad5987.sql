-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create event_invitations table to track which clients were invited
CREATE TABLE public.event_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Authenticated users can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON public.events FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete events"
  ON public.events FOR DELETE
  USING (true);

-- Policies for event_invitations
CREATE POLICY "Authenticated users can view invitations"
  ON public.event_invitations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invitations"
  ON public.event_invitations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invitations"
  ON public.event_invitations FOR DELETE
  USING (true);