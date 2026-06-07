import React, { useState, useEffect } from 'react';
import { Plus, Store, Mail, MapPin, X, Loader2, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

const EMPTY_FORM = { name: '', address: '', manager_email: '' };

export default function OutletsPage() {
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOutletId, setEditingOutletId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);

  async function fetchOutlets() {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.OUTLETS.LIST);
      setOutlets(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data outlet');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOutlets();
  }, []);

  const openCreateModal = () => {
    setEditingOutletId(null);
    setFormValues(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOutletId(null);
    setFormValues(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (outlet) => {
    setEditingOutletId(outlet.id);
    setFormValues({
      name: outlet.name || '',
      address: outlet.address || '',
      manager_email: outlet.manager_email || '',
    });
    setIsModalOpen(true);
  };

  const executeDeleteOutlet = async (id) => {
    try {
      const res = await request.delete(API_ENDPOINTS.OUTLETS.DELETE(id));
      if (res.success) {
        toast.success('Outlet berhasil dihapus!');
        fetchOutlets();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus outlet');
    }
  };

  const handleDeleteOutlet = (outlet) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5 p-1 max-w-sm">
        <p className="text-xs font-bold text-gray-800 leading-relaxed">
          Apakah Anda yakin ingin menghapus outlet <span className="text-coffee-800">{outlet.name}</span>? Data outlet yang dihapus tidak dapat dipulihkan.
        </p>
        <div className="flex justify-end gap-2 text-[10px]">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDeleteOutlet(outlet.id);
            }}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-sm"
          >
            Hapus
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim() || !formValues.manager_email.trim()) {
      toast.error('Nama outlet dan email manager harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (editingOutletId) {
        await request.put(API_ENDPOINTS.OUTLETS.UPDATE(editingOutletId), formValues);
        toast.success('Outlet berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.OUTLETS.CREATE, formValues);
        toast.success('Outlet berhasil ditambahkan!');
      }

      closeModal();
      fetchOutlets();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan outlet');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-display">Daftar Outlet</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Kelola lokasi outlet Velaskara Kopay dan email manager penanggung jawab</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-coffee-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-950 shadow-md transition-all text-sm shrink-0"
        >
          <Plus size={18} />
          Tambah Outlet
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-white border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : outlets.length === 0 ? (
        <div className="bg-white border rounded-3xl p-12 text-center text-gray-400">
          <Store size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-gray-600">Belum ada outlet terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map((o) => (
            <div key={o.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="bg-coffee-50 p-3 rounded-2xl text-coffee-800 shrink-0">
                    <Store size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-gray-800 font-display truncate">{o.name}</h3>
                    <span className="text-xs text-gray-400 font-medium">ID Cabang: {o.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditClick(o)}
                    className="p-2 text-gray-400 hover:text-coffee-800 hover:bg-coffee-50 rounded-xl transition-all"
                    title="Edit outlet"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteOutlet(o)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Hapus outlet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">Manager: {o.manager_email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{o.address || 'Alamat belum diatur'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border transform transition-all">
            <div className="h-14 bg-gray-50 border-b flex items-center justify-between px-6">
              <span className="font-extrabold text-sm text-gray-800 uppercase font-display">
                {editingOutletId ? 'Edit Outlet' : 'Tambah Outlet Baru'}
              </span>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Nama Outlet</label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Velaskara Kuta"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Email Manager Penanggung Jawab</label>
                <input
                  type="email"
                  name="manager_email"
                  value={formValues.manager_email}
                  onChange={handleInputChange}
                  placeholder="manager.kuta@velaskara.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Alamat Lengkap</label>
                <textarea
                  name="address"
                  rows={3}
                  value={formValues.address}
                  onChange={handleInputChange}
                  placeholder="Tulis alamat cabang..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-coffee-800 text-white rounded-xl text-sm font-bold hover:bg-coffee-950 transition-all disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : editingOutletId ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
