import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import OrderForm from '@/components/OrderForm';
import OrderList from '@/components/OrderList';
import { LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function TechDashboard() {
  const { user, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [techName, setTechName] = useState('');
  const [completedToday, setCompletedToday] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadTechName();
      loadCompletedCount();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTechName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .single();
    
    if (data) {
      setTechName(data.full_name || 'Tech');
    }
  };

  const loadCompletedCount = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tech_id', user?.id)
      .eq('status', 'completed')
      .eq('double_dip', false) // Exclude double dips from count
      .gte('updated_at', today.toISOString());
    
    setCompletedToday(count || 0);
  };

  const handleOrderAdded = () => {
    setShowForm(false);
    loadCompletedCount();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{techName}</h1>
              <p className="text-sm text-muted-foreground">
                {format(currentTime, 'EEEE, MMMM d, yyyy • h:mm:ss a')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="px-4 py-2">
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-foreground">{completedToday}</p>
              </Card>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>Add New Order</Button>
          ) : (
            <OrderForm 
              onSuccess={handleOrderAdded} 
              onCancel={() => setShowForm(false)} 
            />
          )}
        </div>

        <OrderList onStatusChange={loadCompletedCount} />
      </main>
    </div>
  );
}
