-- Create google_sheets_config table for storing sheet URLs per role
CREATE TABLE public.google_sheets_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  sheet_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage Google Sheets config
CREATE POLICY "Admins can manage google sheets config"
ON public.google_sheets_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_google_sheets_config_updated_at
BEFORE UPDATE ON public.google_sheets_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 10 test orders with various statuses
INSERT INTO public.orders (tech_id, order_id, item_name, quantity, status, notes, double_dip) 
SELECT 
  (SELECT id FROM public.profiles LIMIT 1),
  'ORD-' || LPAD((1000 + generate_series)::text, 4, '0'),
  CASE (generate_series % 5)
    WHEN 0 THEN 'Laptop Repair'
    WHEN 1 THEN 'Monitor Installation'
    WHEN 2 THEN 'Network Setup'
    WHEN 3 THEN 'Printer Maintenance'
    ELSE 'Cable Installation'
  END,
  (generate_series % 3) + 1,
  CASE (generate_series % 3)
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'checked_in'
    ELSE 'completed'
  END,
  'Test order ' || generate_series,
  (generate_series % 4) = 0
FROM generate_series(1, 10);