import React, { useState, useEffect } from 'react';
import { Plus, Store, Mail, MapPin, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function OutletsPage() {
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({ name: '', address: '', manager_email: '' });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim() || !formValues.manager_email.trim()) {
      toast.error('Nama outlet dan email manager harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      await request.post(API_ENDPOINTS.OUTLETS.CREATE, formValues);
      toast.success('Outlet berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormValues({ name: '', address: '', manager_email: '' });
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
          onClick={() => setIsModalOpen(true)}
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
              <div className="flex items-center space-x-3">
                <div className="bg-coffee-50 p-3 rounded-2xl text-coffee-800">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-800 font-display">{o.name}</h3>
                  <span className="text-xs text-gray-400 font-medium">ID Cabang: {o.id}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span>Manager: {o.manager_email}</span>
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

      {/* Add Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border transform transition-all">
            <div className="h-14 bg-gray-50 border-b flex items-center justify-between px-6">
              <span className="font-extrabold text-sm text-gray-800 uppercase font-display">Tambah Outlet Baru</span>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-coffee-800 text-white rounded-xl text-sm font-bold hover:bg-coffee-950 transition-all"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
