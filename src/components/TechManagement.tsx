import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Tech {
  id: string;
  tech_id: string;
  email: string;
  full_name: string;
}

export default function TechManagement() {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTech, setEditingTech] = useState<Tech | null>(null);
  const [formData, setFormData] = useState({
    tech_id: '',
    email: '',
    full_name: '',
    password: '',
  });

  useEffect(() => {
    loadTechs();
  }, []);

  const loadTechs = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      toast.error('Failed to load techs');
    } else {
      setTechs(data || []);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setFormData({ tech_id: '', email: '', full_name: '', password: '' });
    setEditingTech(null);
    setShowDialog(true);
  };

  const handleEdit = (tech: Tech) => {
    setFormData({ tech_id: tech.tech_id, email: tech.email, full_name: tech.full_name, password: '' });
    setEditingTech(tech);
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingTech) {
        const updates: any = {
          tech_id: formData.tech_id,
          email: formData.email,
          full_name: formData.full_name,
        };

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', editingTech.id);

        if (error) throw error;

        if (formData.password) {
          const { error: funcError } = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'update',
              userId: editingTech.id,
              password: formData.password,
            },
          });
          if (funcError) throw funcError;
        }

        toast.success('Tech updated');
      } else {
        const { error } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'create',
            email: formData.email,
            password: formData.password,
            tech_id: formData.tech_id,
            full_name: formData.full_name,
          },
        });

        if (error) throw error;
        toast.success('Tech added');
      }

      setShowDialog(false);
      loadTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (tech: Tech) => {
    if (!confirm(`Are you sure you want to delete ${tech.full_name}?`)) return;

    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId: tech.id,
        },
      });

      if (error) throw error;
      toast.success('Tech deleted');
      loadTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div>Loading techs...</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Tech
      </Button>

      {techs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No techs yet</CardContent></Card>
      ) : (
        techs.map((tech) => (
          <Card key={tech.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{tech.full_name}</p>
                  <p className="text-sm text-muted-foreground">Tech ID: {tech.tech_id}</p>
                  <p className="text-sm text-muted-foreground">Email: {tech.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(tech)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(tech)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTech ? 'Edit Tech' : 'Add Tech'}</DialogTitle>
            <DialogDescription>
              {editingTech ? 'Update tech details' : 'Create a new tech account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tech ID</Label>
              <Input value={formData.tech_id} onChange={(e) => setFormData({ ...formData, tech_id: e.target.value })} />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label>Password {editingTech && '(leave blank to keep current)'}</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
