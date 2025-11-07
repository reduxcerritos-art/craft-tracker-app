import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Order {
  id: string;
  order_id: string;
  quantity: number;
  status: string;
  notes: string | null;
  created_at: string;
  tech_id: string;
  profiles: {
    full_name: string;
    tech_id: string;
  };
}

interface Tech {
  id: string;
  full_name: string;
  tech_id: string;
}

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    quantity: '',
    notes: '',
    tech_id: '',
    status: 'pending',
  });

  useEffect(() => {
    loadOrders();
    loadTechs();
    subscribeToOrders();
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles!orders_tech_id_fkey(full_name, tech_id)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders((data as any) || []);
    }
    setLoading(false);
  };

  const loadTechs = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, tech_id')
      .order('full_name');

    if (data) {
      setTechs(data);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
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
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
    }
  };

  const handleEdit = (order: Order) => {
    setFormData({
      order_id: order.order_id,
      quantity: order.quantity.toString(),
      notes: order.notes || '',
      tech_id: order.tech_id,
      status: order.status,
    });
    setEditingOrder(order);
  };

  const handleAdd = () => {
    setFormData({
      order_id: '',
      quantity: '',
      notes: '',
      tech_id: techs[0]?.id || '',
      status: 'pending',
    });
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update({
            order_id: formData.order_id,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || null,
            tech_id: formData.tech_id,
            status: formData.status,
          } as any)
          .eq('id', editingOrder.id);

        if (error) throw error;
        toast.success('Order updated');
        setEditingOrder(null);
      } else {
        const { error } = await supabase
          .from('orders')
          .insert({
            order_id: formData.order_id,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || null,
            tech_id: formData.tech_id,
            status: formData.status,
            item_name: 'Item',
          } as any);

        if (error) throw error;
        toast.success('Order added');
        setShowAddDialog(false);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted');
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Order
      </Button>

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No orders yet</CardContent></Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">Order #{order.order_id}</p>
                  <p className="text-sm text-muted-foreground">
                    Tech: {order.profiles.full_name} ({order.profiles.tech_id})
                  </p>
                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                  {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(order)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(order.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!editingOrder || showAddDialog} onOpenChange={() => { setEditingOrder(null); setShowAddDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Order' : 'Add Order'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? 'Update order details' : 'Create a new order'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order ID</Label>
              <Input value={formData.order_id} onChange={(e) => setFormData({ ...formData, order_id: e.target.value })} />
            </div>
            <div>
              <Label>Tech</Label>
              <Select value={formData.tech_id} onValueChange={(value) => setFormData({ ...formData, tech_id: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {techs.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.tech_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => { setEditingOrder(null); setShowAddDialog(false); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
