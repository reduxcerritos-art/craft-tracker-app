import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, ExternalLink } from 'lucide-react';

interface SheetConfig {
  role: string;
  sheet_url: string;
}

export default function GoogleSheetsSettings() {
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [techSheetUrl, setTechSheetUrl] = useState('');
  const [adminSheetUrl, setAdminSheetUrl] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const { data, error } = await supabase
      .from('google_sheets_config')
      .select('*');

    if (error) {
      toast.error('Failed to load Google Sheets config');
    } else {
      setConfigs(data || []);
      const techConfig = data?.find(c => c.role === 'tech');
      const adminConfig = data?.find(c => c.role === 'admin');
      
      if (techConfig) setTechSheetUrl(techConfig.sheet_url);
      if (adminConfig) setAdminSheetUrl(adminConfig.sheet_url);
    }
    setLoading(false);
  };

  const handleSave = async (role: string, url: string) => {
    if (!url) {
      toast.error('Please enter a Google Sheets URL');
      return;
    }

    try {
      const existing = configs.find(c => c.role === role);
      
      if (existing) {
        const { error } = await supabase
          .from('google_sheets_config')
          .update({ sheet_url: url })
          .eq('role', role);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('google_sheets_config')
          .insert({ role, sheet_url: url });
        
        if (error) throw error;
      }

      toast.success(`Google Sheet URL saved for ${role}`);
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const testConnection = async (role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { action: 'test', role },
      });

      if (error) throw error;
      toast.success('Connection test successful!');
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading Google Sheets settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
          <CardDescription>
            Configure Google Sheets URLs for each role. Orders will be automatically synced to the respective sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="tech-sheet">Tech Role Sheet URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tech-sheet"
                  value={techSheetUrl}
                  onChange={(e) => setTechSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <Button onClick={() => handleSave('tech', techSheetUrl)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              {techSheetUrl && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(techSheetUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Sheet
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testConnection('tech')}>
                    Test Connection
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="admin-sheet">Admin Role Sheet URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="admin-sheet"
                  value={adminSheetUrl}
                  onChange={(e) => setAdminSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <Button onClick={() => handleSave('admin', adminSheetUrl)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              {adminSheetUrl && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(adminSheetUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Sheet
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testConnection('admin')}>
                    Test Connection
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Card className="bg-muted">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Setup Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create a Google Cloud project and enable Google Sheets API</li>
                <li>Create a service account and download the JSON credentials</li>
                <li>Share your Google Sheets with the service account email (with edit permissions)</li>
                <li>Add the service account credentials as a secret named GOOGLE_SHEETS_CREDENTIALS</li>
                <li>Copy the sheet URLs and paste them above</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
