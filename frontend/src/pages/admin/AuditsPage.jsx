import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Calendar, Store, Clock, Award, FileText, ChevronLeft, ChevronRight, Edit, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useLanguage } from '../../context/LanguageContext';

export default function AuditsPage({ user }) {
  const { t } = useLanguage();
  const [audits, setAudits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Access modal state
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [managers, setManagers] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const handleOpenAccessModal = async (audit) => {
    setSelectedAudit(audit);
    setIsAccessModalOpen(true);
    try {
      const res = await request.get(API_ENDPOINTS.AUDITS.ACCESS(audit.id));
      if (res.success) {
        setManagers(res.data || []);
        setSelectedManagers(res.data.filter(m => m.has_access).map(m => m.id));
      }
    } catch (err) {
      toast.error('Gagal mengambil data akses manager');
      console.error(err);
    }
  };

  const handleToggleManagerAccess = (managerId) => {
    setSelectedManagers(prev =>
      prev.includes(managerId)
        ? prev.filter(id => id !== managerId)
        : [...prev, managerId]
    );
  };

  const handleSaveAccess = async () => {
    setIsSavingAccess(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUDITS.ACCESS(selectedAudit.id), {
        manager_ids: selectedManagers
      });
      if (res.success) {
        toast.success(t('audits.access_success'));
        setIsAccessModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan akses manager');
      console.error(err);
    } finally {
      setIsSavingAccess(false);
    }
  };

  // Debounce search input (300ms minimal)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(search);
      setPage(1); // Reset page to 1 on new search
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch audits whenever page, limit, or searchQuery changes
  useEffect(() => {
    async function fetchAudits() {
      setIsLoading(true);
      try {
        const res = await request.get(API_ENDPOINTS.AUDITS.LIST, {
          page,
          limit,
          search: searchQuery
        });
        if (res.success) {
          setAudits(res.data || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      } catch (err) {
        toast.error('Gagal mengambil data audit');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAudits();
  }, [page, limit, searchQuery]);

  const executeDeleteAudit = async (id) => {
    try {
      const res = await request.delete(API_ENDPOINTS.AUDITS.DELETE(id));
      if (res.success) {
        toast.success('Laporan audit berhasil dihapus!');
        setAudits(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus laporan audit');
      console.error(err);
    }
  };

  const handleDeleteAudit = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5 p-1 max-w-sm">
        <p className="text-xs font-bold text-gray-800 leading-relaxed">
          Apakah Anda yakin ingin menghapus laporan audit ini? Semua data kriteria dan jawaban terkait akan dihapus secara permanen.
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
              await executeDeleteAudit(id);
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
          <h1 className="text-3xl font-extrabold text-gray-900 font-display">{t('audits.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'manager'
              ? t('audits.subtitle_manager')
              : t('audits.subtitle_admin')}
          </p>
        </div>

        {user?.role !== 'manager' && (
          <Link
            to="/audits/new"
            className="inline-flex items-center gap-2 bg-coffee-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-950 shadow-md transition-all text-sm shrink-0"
          >
            <Plus size={18} />
            {t('audits.new_audit')}
          </Link>
        )}
      </div>

      {/* Filter and search panel */}
      <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder={t('audits.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm transition-all"
          />
        </div>

        {/* Limit Selector */}
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

      {/* Audits Table / Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-gray-600">Tidak ada data audit ditemukan</p>
          <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian Anda</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('audits.outlet')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('audits.date_shift')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('audits.auditor')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('audits.compliance_score')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('audits.signature_status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => {
                  const isFailed = audit.compliance_percentage < 70;
                  const isSigned = !!audit.signature_data;
                  const isPaid = !!audit.is_paid;

                  return (
                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="bg-coffee-50 p-2 rounded-lg text-coffee-800">
                            <Store size={18} />
                          </div>
                          <span className="font-bold text-gray-800">{audit.outlet_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800">
                          {new Date(audit.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Clock size={12} />
                          <span>Shift {audit.shift}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {audit.auditor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-gray-900">
                            {parseFloat(audit.compliance_percentage).toFixed(1)}%
                          </span>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${!isFailed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {!isFailed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${isSigned ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {isSigned ? t('audits.signed') : t('audits.unsigned')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/report/${audit.access_token}`}
                            className="inline-flex items-center gap-1 text-coffee-700 hover:text-coffee-950 font-bold bg-coffee-50 hover:bg-coffee-100 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <FileText size={14} />
                            {t('common.detail')}
                          </Link>

                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenAccessModal(audit)}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
                              >
                                <ShieldCheck size={14} />
                                {t('audits.manage_access')}
                              </button>
                              <Link
                                to={`/audits/edit/${audit.id}`}
                                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-950 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                              >
                                <Edit size={14} />
                                {t('common.edit')}
                              </Link>
                              <button
                                onClick={() => handleDeleteAudit(audit.id)}
                                className="inline-flex items-center gap-1 text-red-750 hover:text-red-950 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all"
                              >
                                <Trash2 size={14} />
                                {t('common.delete')}
                              </button>
                            </>
                          )}
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

      {/* Pagination component */}
      {!isLoading && audits.length > 0 && (
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

            {/* Active page number */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === pNum
                    ? 'bg-coffee-800 text-white shadow-md shadow-coffee-950/20'
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

      {/* Access Control Modal */}
      {isAccessModalOpen && selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 font-display">
                {t('audits.access_title')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t('audits.access_desc')} ({selectedAudit.outlet_name})
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {managers.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Tidak ada manager terdaftar.</p>
              ) : (
                managers.map(m => {
                  const isChecked = selectedManagers.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-3 border rounded-2xl cursor-pointer select-none transition-all ${
                        isChecked ? 'bg-coffee-50/50 border-coffee-800' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-800">{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleManagerAccess(m.id)}
                        className="w-4 h-4 rounded text-coffee-800 border-gray-300 focus:ring-coffee-600 cursor-pointer"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveAccess}
                disabled={isSavingAccess}
                className="px-4 py-2 bg-coffee-800 hover:bg-coffee-950 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSavingAccess ? '...' : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
