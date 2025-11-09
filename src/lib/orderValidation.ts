import { supabase } from '@/integrations/supabase/client';

export async function checkDuplicateOrder(orderId: string, techId: string): Promise<{
  isDuplicate: boolean;
  previousOrder?: {
    id: string;
    created_at: string;
    status: string;
  };
}> {
  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if this order_id was already added by this tech before today
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status')
    .eq('order_id', orderId)
    .eq('tech_id', techId)
    .lt('created_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error checking duplicate:', error);
    return { isDuplicate: false };
  }

  if (data && data.length > 0) {
    const previousOrder = data[0];
    // Only flag as duplicate if the previous order was completed or in-progress
    // If it was incomplete/on-hold, allow re-adding
    const isDuplicate = previousOrder.status !== 'incomplete' && previousOrder.status !== 'on-hold';
    
    return {
      isDuplicate,
      previousOrder,
    };
  }

  return { isDuplicate: false };
}
