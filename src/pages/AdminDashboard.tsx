import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminOrderManagement from '@/components/AdminOrderManagement';
import TechManagement from '@/components/TechManagement';
import ProfileManagement from '@/components/ProfileManagement';
import ExportDialog from '@/components/ExportDialog';
import GoogleSheetsSettings from '@/components/GoogleSheetsSettings';
import { LogOut, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [showExport, setShowExport] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadUserName = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserName(data.full_name || 'Admin');
        }
      }
    };
    loadUserName();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-foreground">{userName}</p>
                <p className="text-sm text-muted-foreground">{format(currentTime, 'PPpp')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExport(true)}>
                <Download className="w-4 h-4 mr-2" />
                Export Orders
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="techs">Manage Techs</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <AdminOrderManagement />
          </TabsContent>
          
          <TabsContent value="techs">
            <TechManagement />
          </TabsContent>

          <TabsContent value="sheets">
            <GoogleSheetsSettings />
          </TabsContent>
          
          <TabsContent value="profile">
            <ProfileManagement />
          </TabsContent>
        </Tabs>
      </main>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}
