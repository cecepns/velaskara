import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ClipboardCheck, 
  Percent, 
  Coins, 
  ArrowUpRight, 
  Plus, 
  Settings,
  Store,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import logoImg from '../../assets/logo.png';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAudits: 0,
    avgScore: 0,
    avgRevenueAchievement: 0,
    recentAudits: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const auditsRes = await request.get(API_ENDPOINTS.AUDITS.LIST, { limit: 5 });
        const allAuditsRes = await request.get(API_ENDPOINTS.AUDITS.LIST, { limit: 100 });
        
        const data = allAuditsRes.data || [];
        const totalAudits = data.length;
        
        let scoreSum = 0;
        let revAchievementSum = 0;
        
        data.forEach(a => {
          scoreSum += parseFloat(a.compliance_percentage || 0);
          revAchievementSum += parseFloat(a.achievement_percentage || 0);
        });
        
        const avgScore = totalAudits > 0 ? (scoreSum / totalAudits) : 0;
        const avgRevenueAchievement = totalAudits > 0 ? (revAchievementSum / totalAudits) : 0;
        
        setStats({
          totalAudits,
          avgScore,
          avgRevenueAchievement,
          recentAudits: auditsRes.data || []
        });
      } catch (err) {
        toast.error('Gagal memuat data dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner section */}
      <div className="bg-gradient-to-r from-coffee-900 to-coffee-700 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-coffee-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold font-display leading-tight">Velaskara Operational Excellence</h1>
          <p className="text-coffee-100 mt-2 text-sm md:text-base">
            Pantau performa operasional, kualitas kopi terbaik, sanitasi, dan KPI keuangan cabang Velaskara dalam satu platform terintegrasi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link 
              to="/audits/new" 
              className="bg-white text-coffee-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-50 transition-all shadow-md text-sm flex items-center gap-1.5"
            >
              <Plus size={16} />
              Mulai Audit Baru
            </Link>
            <Link 
              to="/criteria" 
              className="bg-coffee-800 text-coffee-100 font-semibold px-5 py-2.5 rounded-xl hover:bg-coffee-900 transition-all border border-coffee-600/30 text-sm flex items-center gap-1.5"
            >
              <Settings size={16} />
              Kelola Kriteria
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 pointer-events-none w-80 h-80 overflow-hidden">
          <img src={logoImg} alt="Velaskara Logo Background" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-500">Total Audit Terlaksana</span>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.totalAudits} Sesi</h3>
              <p className="text-xs text-gray-400">Seluruh cabang berjalan</p>
            </div>
            <div className="bg-coffee-50 text-coffee-800 p-4 rounded-2xl">
              <ClipboardCheck size={24} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-500">Rata-rata Skor Kepatuhan</span>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.avgScore.toFixed(1)}%</h3>
              <div className="flex items-center gap-1">
                {stats.avgScore >= 70 ? (
                  <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                    <TrendingUp size={12} /> Di Atas Target SOP
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                    <TrendingDown size={12} /> Di Bawah Target SOP
                  </span>
                )}
              </div>
            </div>
            <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl">
              <Percent size={24} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-gray-500">Pencapaian Target Finansial</span>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.avgRevenueAchievement.toFixed(0)}%</h3>
              <p className="text-xs text-gray-400">Akumulasi revenue vs target</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl">
              <Coins size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Audits list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-gray-900 font-display">Sesi Audit Terbaru</h3>
            <Link to="/audits" className="text-sm font-semibold text-coffee-700 hover:text-coffee-950 flex items-center gap-0.5">
              Lihat Semua <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats.recentAudits.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ClipboardCheck size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Belum ada audit terdaftar.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentAudits.map((audit) => (
                  <div key={audit.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-coffee-50 p-2.5 rounded-xl text-coffee-800 shrink-0">
                        <Store size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{audit.outlet_name}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                          <span>Shift: {audit.shift}</span>
                          <span>•</span>
                          <span>Tanggal: {new Date(audit.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-gray-900">
                          {parseFloat(audit.compliance_percentage).toFixed(1)}%
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          audit.compliance_percentage >= 70
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {audit.compliance_percentage >= 70 ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <Link 
                        to={`/report/${audit.access_token}`} 
                        className="text-gray-400 hover:text-coffee-800 transition-colors p-1"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mini Guidelines / Quick Links */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xl text-gray-900 font-display">Target & Standar Mutu</h3>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h5 className="font-bold text-sm text-gray-800">1. Kategori Kritis (Bobot 5 Poin)</h5>
              <p className="text-xs text-gray-500">Kualitas rasa, visual espresso, kecepatan layanan drive-thru, sapaan kasir, ketetapan resep, kebersihan toilet.</p>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-sm text-gray-800">2. Kategori Standar (Bobot 2 Poin)</h5>
              <p className="text-xs text-gray-500">Kebersihan lantai, trotoar, kerapihan etalase merchandise, musik kafe, dan perawatan mesin.</p>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-sm text-gray-800">3. Cold Storage Standards</h5>
              <p className="text-xs text-gray-500">Showcase: 1°C–4°C • Milk Fridge: 1°C–4°C • Freezer: ≤ -18°C</p>
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-sm text-gray-800">4. Kalibrasi Espresso</h5>
              <p className="text-xs text-gray-500">Dose standard 18.5gr, pressure 9 Bar, extraction time 26-28s, 3 layers crema.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
