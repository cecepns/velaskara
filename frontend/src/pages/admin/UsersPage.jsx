import React, { useState, useEffect } from 'react';
import { Plus, Users, Mail, User, Shield, X, Loader2, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function UsersPage() {
  const [usersList, setUsersList] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);

  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    role: 'auditor', // admin, auditor, manager
    outlet_id: ''
  });

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST);
      setUsersList(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data user');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();

    async function fetchOutlets() {
      try {
        const res = await request.get(API_ENDPOINTS.OUTLETS.LIST);
        setOutlets(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchOutlets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setFormValues({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      outlet_id: u.outlet_id || ''
    });
    setIsModalOpen(true);
  };

  const executeDeleteUser = async (id) => {
    try {
      const res = await request.delete(API_ENDPOINTS.USERS.DELETE(id));
      if (res.success) {
        toast.success('User berhasil dihapus!');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus user');
      console.error(err);
    }
  };

  const handleDeleteUser = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5 p-1 max-w-sm">
        <p className="text-xs font-bold text-gray-800 leading-relaxed">
          Apakah Anda yakin ingin menghapus user ini? Akun karyawan yang dihapus tidak dapat dipulihkan.
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
              await executeDeleteUser(id);
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim() || !formValues.email.trim()) {
      toast.error('Nama dan Email harus diisi');
      return;
    }
    if (!editingUserId && !formValues.password.trim()) {
      toast.error('Password harus diisi untuk user baru');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formValues,
        outlet_id: formValues.role === 'manager' && formValues.outlet_id ? parseInt(formValues.outlet_id) : null
      };

      if (editingUserId && !formValues.password.trim()) {
        delete payload.password;
      }

      if (editingUserId) {
        await request.put(API_ENDPOINTS.USERS.UPDATE(editingUserId), payload);
        toast.success('User berhasil diperbarui!');
      } else {
        await request.post(API_ENDPOINTS.USERS.CREATE, payload);
        toast.success('User berhasil ditambahkan!');
      }
      
      setIsModalOpen(false);
      setEditingUserId(null);
      setFormValues({ name: '', email: '', password: '', role: 'auditor', outlet_id: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-display">Kelola User</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Buat kredensial login untuk Admin, Auditor, dan Manager Outlet</p>
        </div>
        <button
          onClick={() => {
            setEditingUserId(null);
            setFormValues({ name: '', email: '', password: '', role: 'auditor', outlet_id: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-coffee-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-950 shadow-md transition-all text-sm shrink-0"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-white border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Terhubung Outlet</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => {
                  const outlet = outlets.find(o => o.id === u.outlet_id);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-coffee-50 text-coffee-800 flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full uppercase ${u.role === 'admin'
                            ? 'bg-red-50 text-red-700'
                            : u.role === 'auditor'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-semibold">
                        {u.role === 'manager' && outlet ? (
                          <span className="bg-coffee-50 text-coffee-850 px-2 py-1 rounded-xl">
                            {outlet.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-950 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-1 text-red-750 hover:text-red-955 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border transform transition-all">
            <div className="h-14 bg-gray-50 border-b flex items-center justify-between px-6">
              <span className="font-extrabold text-sm text-gray-800 uppercase font-display">
                {editingUserId ? 'Edit User Karyawan' : 'Tambah User Karyawan'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-650">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Budi Santoso"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  placeholder="budi@velaskara.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Password
                  {editingUserId && <span className="text-[10px] text-gray-400 font-normal">(Biarkan kosong jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formValues.password}
                  onChange={handleInputChange}
                  placeholder={editingUserId ? "Biarkan kosong..." : "••••••••"}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Role Karyawan</label>
                <select
                  name="role"
                  value={formValues.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                >
                  <option value="admin">Super Admin</option>
                  <option value="auditor">Auditor / Mystery Shopper</option>
                  <option value="manager">Manager Outlet</option>
                </select>
              </div>

              {formValues.role === 'manager' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Hubungkan Ke Outlet</label>
                  <select
                    name="outlet_id"
                    value={formValues.outlet_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                  >
                    <option value="">Pilih outlet...</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
                    <Loader2 className="animate-spin" size={14} />
                  ) : editingUserId ? (
                    'Perbarui User'
                  ) : (
                    'Simpan User'
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
