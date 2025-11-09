-- Add double_dip flag to orders table
ALTER TABLE public.orders
ADD COLUMN double_dip BOOLEAN NOT NULL DEFAULT false;

-- Add incomplete status support (already exists as 'on-hold' but let's add 'incomplete' as explicit status)
-- Note: status is already a text field, so no schema change needed for that

-- Add index for faster duplicate checking
CREATE INDEX idx_orders_order_id_tech_id ON public.orders(order_id, tech_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);