-- Add order activity logs table
CREATE TABLE IF NOT EXISTS public.order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'checked_in' or 'completed'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tech_id UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT
);

-- Enable RLS on order_logs
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_logs
CREATE POLICY "Techs can view their own order logs"
  ON public.order_logs
  FOR SELECT
  USING (auth.uid() = tech_id);

CREATE POLICY "Techs can create order logs"
  ON public.order_logs
  FOR INSERT
  WITH CHECK (auth.uid() = tech_id);

CREATE POLICY "Admins can view all order logs"
  ON public.order_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all order logs"
  ON public.order_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_order_logs_order_id ON public.order_logs(order_id);
CREATE INDEX idx_order_logs_timestamp ON public.order_logs(timestamp DESC);