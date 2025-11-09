import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { checkDuplicateOrder } from '@/lib/orderValidation';
import { logOrderActivity } from '@/lib/orderLogs';
import { AlertTriangle, Edit2 } from 'lucide-react';

interface OrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editOrder?: {
    id: string;
    order_id: string;
    quantity: number;
    status: string;
    notes: string | null;
  };
}

export default function OrderForm({ onSuccess, onCancel, editOrder }: OrderFormProps) {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(editOrder?.order_id || '');
  const [quantity, setQuantity] = useState(editOrder?.quantity.toString() || '');
  const [notes, setNotes] = useState(editOrder?.notes || '');
  const [loading, setLoading] = useState(false);
  const [isEditingOrderId, setIsEditingOrderId] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editOrder) {
        const { error } = await supabase
          .from('orders')
          .update({
            order_id: orderId,
            quantity: parseInt(quantity),
            notes: notes || null,
          } as any)
          .eq('id', editOrder.id);

        if (error) throw error;
        toast.success('Order updated successfully');
      } else {
        // Check for duplicate order (double dipping)
        const { isDuplicate, previousOrder } = await checkDuplicateOrder(orderId, user!.id);
        
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert({
            order_id: orderId,
            quantity: parseInt(quantity),
            notes: notes || null,
            tech_id: user?.id,
            status: 'pending',
            item_name: 'Item',
            double_dip: isDuplicate,
          } as any)
          .select()
          .single();

        if (error) throw error;
        
        // Log check-in activity
        if (newOrder) {
          await logOrderActivity(newOrder.id, 'checked_in', user!.id);
        }
        
        if (isDuplicate) {
          toast.warning(
            `⚠️ Double Dip Detected! This order was already processed on ${new Date(previousOrder!.created_at).toLocaleDateString()}. It will not count toward today's quota.`,
            { duration: 6000 }
          );
        } else {
          toast.success('Order added successfully');
        }
      }

      onSuccess();
      setOrderId('');
      setQuantity('');
      setNotes('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editOrder ? 'Edit Order' : 'Add New Order'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="orderId">Order ID</Label>
              {editOrder && !isEditingOrderId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingOrderId(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              disabled={editOrder && !isEditingOrderId}
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editOrder ? 'Update' : 'Add Order'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
