import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Settings, X, Loader2, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form values
  const [formValues, setFormValues] = useState({
    category_id: '',
    name: '',
    weight: 'standard' // 'critical', 'standard', 'informational'
  });

  // Debounce search input (300ms minimal)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Criteria & Categories
  async function fetchCriteria() {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CRITERIA.LIST, {
        page,
        limit,
        search: searchQuery
      });
      if (res.success) {
        setCriteria(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error('Gagal mengambil kriteria');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCriteria();
  }, [page, limit, searchQuery]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await request.get(API_ENDPOINTS.CRITERIA.CATEGORIES);
        if (res.success) {
          setCategories(res.data || []);
          setFormValues(prev => ({
            ...prev,
            category_id: res.data?.[0]?.id || ''
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormValues({
      category_id: categories[0]?.id || '',
      name: '',
      weight: 'standard'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormValues({
      category_id: item.category_id,
      name: item.name,
      weight: item.weight
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim()) {
      toast.error('Nama kriteria tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await request.post(API_ENDPOINTS.CRITERIA.CREATE, formValues);
        toast.success('Kriteria berhasil ditambahkan!');
      } else {
        await request.put(API_ENDPOINTS.CRITERIA.UPDATE(editingId), formValues);
        toast.success('Kriteria berhasil diupdate!');
      }
      setIsModalOpen(false);
      fetchCriteria();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan kriteria');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      await request.delete(API_ENDPOINTS.CRITERIA.DELETE(id));
      toast.success('Kriteria berhasil dihapus (diarsipkan)');
      fetchCriteria();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kriteria');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5 p-1 max-w-sm">
        <p className="text-xs font-bold text-gray-800 leading-relaxed">
          Apakah Anda yakin ingin menghapus kriteria ini? Data audit lama tidak akan hilang, namun kriteria tidak akan tampil di audit baru.
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
              await executeDelete(id);
            }}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-sm"
          >
            Hapus
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center'
    });
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-display">Kriteria Penilaian</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kriteria checklist audit, kategori, dan bobot nilai kepatuhan</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-coffee-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-950 shadow-md transition-all text-sm shrink-0"
        >
          <Plus size={18} />
          Tambah Kriteria
        </button>
      </div>

      {/* Control board */}
      <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari kriteria atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500">Tampilkan:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-gray-300 rounded-xl text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coffee-600"
          >
            <option value={10}>10 Baris</option>
            <option value={25}>25 Baris</option>
            <option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : criteria.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400">
          <Settings size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-gray-600">Tidak ada kriteria ditemukan</p>
          <p className="text-xs text-gray-400 mt-1">Coba tambahkan kriteria baru</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kriteria Checklist</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kekritisan</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bobot Poin</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {criteria.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-coffee-800 bg-coffee-50 px-2.5 py-1 rounded-xl">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-semibold max-w-xs md:max-w-md truncate">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full uppercase ${item.weight === 'critical'
                          ? 'bg-red-50 text-red-700'
                          : item.weight === 'standard'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                        {item.weight}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-extrabold">
                      {item.weight_value} Poin
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-coffee-800 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination control */}
      {!isLoading && criteria.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 px-2">
          <span className="text-xs font-semibold text-gray-500">
            Menampilkan data ke {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} dari {pagination.total} data
          </span>

          <div className="flex items-center space-x-1.5 justify-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === pNum
                    ? 'bg-coffee-800 text-white shadow-md'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {pNum}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Criteria Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all">
            <div className="h-14 bg-gray-50 border-b flex items-center justify-between px-6">
              <span className="font-extrabold text-sm text-gray-800 uppercase font-display">
                {modalMode === 'create' ? 'Tambah Kriteria Penilaian' : 'Edit Kriteria Penilaian'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Kategori</label>
                <select
                  name="category_id"
                  value={formValues.category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Nama Checklist Kriteria</label>
                <textarea
                  name="name"
                  rows={3}
                  value={formValues.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Barista menanyakan nama pelanggan dengan ramah..."
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Tingkat Kekritisan (Bobot Poin)</label>
                <select
                  name="weight"
                  value={formValues.weight}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                >
                  <option value="critical">Critical (5 Poin - Produk & Layanan)</option>
                  <option value="standard">Standard (2 Poin - Kebersihan & Estetika)</option>
                  <option value="informational">Informational (0 Poin - Data Pendukung)</option>
                </select>
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
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Kriteria'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
