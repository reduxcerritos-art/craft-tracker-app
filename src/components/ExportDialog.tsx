import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExportDialogProps {
  onClose: () => void;
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const query = supabase
        .from('orders')
        .select('*, profiles!orders_tech_id_fkey(tech_id, full_name)');

      if (startDate) {
        query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        query.lte('created_at', end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No orders found for the selected date range');
        return;
      }

      const grouped = data.reduce((acc: any, order: any) => {
        const techName = order.profiles?.full_name || 'Unknown';
        if (!acc[techName]) {
          acc[techName] = [];
        }
        acc[techName].push(order);
        return acc;
      }, {});

      let csv = '';
      
      Object.keys(grouped).sort().forEach((techName) => {
        csv += `\n${techName}\n`;
        csv += 'Order ID,Quantity,Status,Notes,Date\n';
        
        grouped[techName].forEach((order: any) => {
          const date = format(new Date(order.created_at), 'yyyy-MM-dd HH:mm');
          const notes = (order.notes || '').replace(/"/g, '""');
          csv += `"${order.order_id}",${order.quantity},"${order.status}","${notes}","${date}"\n`;
        });
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast.success('Orders exported successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogDescription>
            Select date range to export orders grouped by technician
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={loading}>
              {loading ? 'Exporting...' : 'Export'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
