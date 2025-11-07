import { useState, useRef, KeyboardEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface OrderRow {
  id: string;
  orderId: string;
  quantity: string;
  notes: string;
}

export default function BulkOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<OrderRow[]>([
    { id: '1', orderId: '', quantity: '', notes: '' },
  ]);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addRow = () => {
    const newId = (parseInt(rows[rows.length - 1].id) + 1).toString();
    setRows([...rows, { id: newId, orderId: '', quantity: '', notes: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('Must have at least one row');
      return;
    }
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof OrderRow, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowId: string, field: keyof OrderRow) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      const currentRowIndex = rows.findIndex(row => row.id === rowId);
      const fields: (keyof OrderRow)[] = ['orderId', 'quantity', 'notes'];
      const currentFieldIndex = fields.indexOf(field);
      
      // Move to next field in same row
      if (currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1];
        const nextRef = inputRefs.current[`${rowId}-${nextField}`];
        nextRef?.focus();
      } else {
        // Move to first field of next row or create new row
        if (currentRowIndex === rows.length - 1) {
          addRow();
          setTimeout(() => {
            const newRowId = (parseInt(rowId) + 1).toString();
            const firstRef = inputRefs.current[`${newRowId}-orderId`];
            firstRef?.focus();
          }, 0);
        } else {
          const nextRowId = rows[currentRowIndex + 1].id;
          const firstRef = inputRefs.current[`${nextRowId}-orderId`];
          firstRef?.focus();
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Filter out empty rows
    const validRows = rows.filter(row => row.orderId.trim() && row.quantity.trim());
    
    if (validRows.length === 0) {
      toast.error('Please add at least one order');
      return;
    }

    // Validate quantities
    const invalidQuantity = validRows.find(row => isNaN(parseInt(row.quantity)) || parseInt(row.quantity) <= 0);
    if (invalidQuantity) {
      toast.error('All quantities must be positive numbers');
      return;
    }

    setLoading(true);

    try {
      const ordersToInsert = validRows.map(row => ({
        order_id: row.orderId.trim(),
        quantity: parseInt(row.quantity),
        notes: row.notes.trim() || null,
        tech_id: user!.id,
        item_name: 'Item', // Default value as per schema
      }));

      const { error } = await supabase
        .from('orders')
        .insert(ordersToInsert);

      if (error) throw error;

      toast.success(`${ordersToInsert.length} order${ordersToInsert.length > 1 ? 's' : ''} added successfully`);
      setRows([{ id: '1', orderId: '', quantity: '', notes: '' }]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Bulk Order Entry</h2>
      
      <div className="mb-4">
        <div className="grid grid-cols-[2fr,1fr,2fr,auto] gap-2 mb-2 font-semibold text-sm">
          <div>Order ID</div>
          <div>Quantity</div>
          <div>Notes</div>
          <div className="w-10"></div>
        </div>
        
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[2fr,1fr,2fr,auto] gap-2">
              <Input
                ref={el => inputRefs.current[`${row.id}-orderId`] = el}
                value={row.orderId}
                onChange={(e) => updateRow(row.id, 'orderId', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, row.id, 'orderId')}
                placeholder="Scan or type Order ID"
              />
              <Input
                ref={el => inputRefs.current[`${row.id}-quantity`] = el}
                type="number"
                value={row.quantity}
                onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, row.id, 'quantity')}
                placeholder="Qty"
                min="1"
              />
              <Input
                ref={el => inputRefs.current[`${row.id}-notes`] = el}
                value={row.notes}
                onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, row.id, 'notes')}
                placeholder="Notes (optional)"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addRow}>
          Add Row
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : `Submit All (${rows.filter(r => r.orderId.trim()).length})`}
        </Button>
      </div>
    </Card>
  );
}
