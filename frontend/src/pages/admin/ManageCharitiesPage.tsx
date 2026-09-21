import { useState, useEffect } from 'react';
import { Heart, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { charitiesService } from '../../services/api';
import { adminService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Charity } from '../../types';

export default function ManageCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const data = await charitiesService.getCharities();
    setCharities(data);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchCharities() {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError('Failed to load charities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCharities();
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    setFormWebsite('');
    setFormImageUrl('');
    setShowModal(true);
  };

  const openEdit = (charity: Charity) => {
    setEditingId(charity.id);
    setFormName(charity.name);
    setFormDesc(charity.description);
    setFormWebsite(charity.website || '');
    setFormImageUrl(charity.imageUrl || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDesc.trim()) return;
    try {
      setSaving(true);
      setError(null);
      if (editingId) {
        await adminService.updateCharity(editingId, {
          name: formName,
          description: formDesc,
          website: formWebsite,
          imageUrl: formImageUrl,
        });
        setSuccess('Charity updated');
      } else {
        await adminService.createCharity({
          name: formName,
          description: formDesc,
          website: formWebsite,
          imageUrl: formImageUrl,
        });
        setSuccess('Charity created');
      }
      setShowModal(false);
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(editingId ? 'Failed to update charity' : 'Failed to create charity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will deactivate the charity.`)) return;
    try {
      setError(null);
      await adminService.deleteCharity(id);
      setSuccess('Charity deactivated');
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to delete charity');
    }
  };

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Manage Charities</h1>
          <p className="text-text-muted mt-1">View and manage partner charities</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Charity
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charities.map((charity) => (
          <Card key={charity.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 mr-2">
                  {charity.imageUrl ? (
                    <img
                      src={charity.imageUrl}
                      alt={charity.name}
                      className="w-full h-24 object-contain mb-4 rounded-md bg-gray-50 p-2"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-pale flex items-center justify-center mb-4">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                {charity.website && (
                  <a
                    href={charity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-text shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <h3 className="font-display font-bold text-text mb-2">{charity.name}</h3>
              <p className="text-sm text-text-muted mb-4 line-clamp-2">{charity.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-text-muted">Total Raised</div>
                  <div className="font-bold text-primary">{formatCurrency(charity.totalRaised)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(charity)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(charity.id, charity.name)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Charity' : 'Add Charity'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Charity name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="What does this charity do?"
              rows={3}
              className="w-full px-3 py-2.5 border border-border rounded-md bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Website (optional)</label>
            <Input
              value={formWebsite}
              onChange={(e) => setFormWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Image URL (optional)</label>
            <Input
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="https://example.com/charity-logo.jpg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Charity'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
