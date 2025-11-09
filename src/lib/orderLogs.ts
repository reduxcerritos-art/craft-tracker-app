import { supabase } from '@/integrations/supabase/client';

export async function logOrderActivity(
  orderId: string,
  action: 'checked_in' | 'completed',
  techId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('order_logs')
    .insert({
      order_id: orderId,
      action,
      tech_id: techId,
      notes: notes || null,
    } as any);

  if (error) {
    console.error('Failed to log order activity:', error);
  }
}

export function getRoleDisplayName(role: string | null): string {
  switch (role) {
    case 'tech':
      return 'Assembly Tech';
    case 'qa_tech':
      return 'QA Tech';
    case 'packer':
      return 'Packing Team';
    case 'admin':
      return 'Admin';
    default:
      return 'User';
  }
}
