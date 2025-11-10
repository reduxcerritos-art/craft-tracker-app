import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminOrderManagement from '@/components/AdminOrderManagement';
import TechManagement from '@/components/TechManagement';
import ProfileManagement from '@/components/ProfileManagement';
import ExportDialog from '@/components/ExportDialog';
import { LogOut, Download } from 'lucide-react';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
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
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <AdminOrderManagement />
          </TabsContent>
          
          <TabsContent value="techs">
            <TechManagement />
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
