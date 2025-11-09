import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { logOrderActivity } from '@/lib/orderLogs';

interface Order {
  id: string;
  order_id: string;
  quantity: number;
  status: string;
  notes: string | null;
  created_at: string;
  double_dip: boolean;
}

interface OrderListProps {
  onStatusChange?: () => void;
}

export default function OrderList({ onStatusChange }: OrderListProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
      subscribeToOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tech_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('tech-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tech_id=eq.${user?.id}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const oldStatus = order?.status;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      // Log completion activity
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        await logOrderActivity(orderId, 'completed', user!.id);
      }
      
      toast.success('Status updated');
      if (onStatusChange) {
        onStatusChange();
      }
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No orders yet</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className={order.double_dip ? 'border-orange-500 border-2' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Order #{order.order_id}</p>
                  {order.double_dip && (
                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Double Dip - Not Counted
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="min-w-[150px]">
                <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
