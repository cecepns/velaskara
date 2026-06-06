import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { 
  ShieldAlert, 
  CreditCard, 
  Printer, 
  FileText, 
  Loader2, 
  Check, 
  X, 
  Thermometer, 
  Coffee, 
  Coins, 
  UserCheck, 
  Award,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import SignaturePad from '../../components/signature/SignaturePad';

export default function ReportViewPage({ user }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  async function fetchReport() {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.AUDITS.REPORT(token));
      setData(res);
    } catch (err) {
      toast.error('Laporan audit tidak ditemukan atau tautan tidak valid');
      navigate('/audits');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, [token]);

  const handleSimulatePayment = async () => {
    setIsPaying(true);
    try {
      const auditId = data.audit.id;
      const res = await request.post(API_ENDPOINTS.AUDITS.PAY, { audit_id: auditId });
      if (res.success) {
        toast.success('Pembayaran Simulasi Berhasil!');
        fetchReport(); // Reload full report data
      }
    } catch (err) {
      toast.error(err.message || 'Pembayaran gagal');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSaveSignature = async (base64Data) => {
    setIsSigning(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUDITS.SIGN(token), {
        signature_data: base64Data,
        ip_address: '127.0.0.1' // Mock or client IP
      });
      if (res.success) {
        toast.success('Laporan berhasil ditandatangani!');
        fetchReport(); // Reload report
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan tanda tangan');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-document');
    if (!element) {
      toast.error('Elemen dokumen tidak ditemukan');
      return;
    }
    
    const opt = {
      margin:       0.4,
      filename:     `Laporan_Audit_${audit?.outlet_name?.replace(/\s+/g, '_') || 'Velaskara'}_${audit?.audit_date || ''}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    const loadingToast = toast.loading('Mengonversi dokumen ke PDF...');
    
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success('PDF berhasil diunduh!');
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error('Gagal mengunduh PDF: ' + err.message);
        console.error(err);
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
        <Loader2 className="animate-spin text-coffee-800" size={32} />
        <p className="text-sm font-semibold text-gray-500">Membuka Laporan Audit...</p>
      </div>
    );
  }

  // Case 1: Payment required (restricted metadata gate)
  if (data?.payment_required) {
    const costStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.amount);
    const auditInfo = data.audit;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert size={32} />
          </div>
          
          <div className="space-y-2">
            <span className="text-xs bg-red-100 text-red-700 font-extrabold px-3 py-1 rounded-full uppercase">
              Operational Standard Audit Blocked
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Akses Terkunci: Nilai di Bawah Standar</h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Hasil audit untuk <strong className="text-gray-800">{auditInfo.outlet_name}</strong> tanggal <strong className="text-gray-800">{new Date(auditInfo.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> mendapat nilai kepatuhan sebesar <strong className="text-red-600">{parseFloat(auditInfo.compliance_percentage).toFixed(1)}%</strong> (di bawah target standard 70.0%).
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
            <h4 className="font-bold text-sm text-amber-800 uppercase tracking-wide">Kebijakan Operasional Kafe</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Setiap outlet diberikan alokasi budget untuk operasional standar. Jika pencapaian standar audit Anda di bawah rata-rata (70%), Anda wajib membayar biaya akses laporan sebesar <strong className="font-extrabold text-amber-900">{costStr}</strong> untuk dapat membaca rincian evaluasi perbaikan dan menandatangani dokumen audit.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleSimulatePayment}
              disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-coffee-800 hover:bg-coffee-950 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isPaying ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <CreditCard size={18} />
              )}
              Bayar Akses Laporan ({costStr})
            </button>
            <button
              onClick={() => navigate('/audits')}
              className="text-sm text-gray-500 hover:text-gray-700 font-bold transition-all"
            >
              Kembali Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Full report visible (Score passed, paid, or authorized role)
  const audit = data?.audit;
  const answers = data?.answers || [];

  // Grouping compliance answer parameters
  const categoriesMap = {};
  answers.forEach(item => {
    if (!categoriesMap[item.category_name]) {
      categoriesMap[item.category_name] = [];
    }
    categoriesMap[item.category_name].push(item);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:p-0 print:m-0">
      
      {/* Top action header */}
      <div className="flex items-center justify-between no-print border-b pb-4">
        <button
          onClick={() => navigate('/audits')}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-all"
        >
          &larr; Kembali ke Daftar
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
          >
            <Download size={14} />
            Unduh PDF
          </button>
        </div>
      </div>

      {/* Main Printed Report layout */}
      <div id="report-document" className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 print:border-none print:shadow-none print-card">
        
        {/* Document Header banner */}
        <div className="border-b-4 border-coffee-900 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-coffee-600 uppercase">SECURITY CODE: VK-2026</span>
            <h1 className="text-3xl font-extrabold text-coffee-950 font-display tracking-tight mt-0.5">VELASKARA KOPAY</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase mt-0.5">Operational Excellence & Assessment System — Report Document</p>
          </div>
          <div className="bg-coffee-900 text-white px-5 py-3 rounded-2xl text-center shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-coffee-200 block">Compliance Score</span>
            <span className="text-3xl font-black">{parseFloat(audit.compliance_percentage).toFixed(1)}%</span>
          </div>
        </div>

        {/* Section I: Metadata */}
        <div className="space-y-4">
          <h2 className="text-md font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            I. METADATA & QUALITY CONTROL LOG
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {/* Info Table */}
            <div className="divide-y divide-gray-150">
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">Tanggal Audit</span>
                <span className="font-bold text-gray-800">
                  {new Date(audit.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">Auditor</span>
                <span className="font-bold text-gray-800">{audit.auditor_name}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">Shift</span>
                <span className="font-bold text-gray-800">{audit.shift}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">Outlet Cabang</span>
                <span className="font-bold text-gray-800">{audit.outlet_name}</span>
              </div>
            </div>

            {/* Cold Storage Monitoring */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">Cold Storage Monitoring</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">RTD Showcase: <strong className="text-gray-900">{audit.rtd_temp}°C</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    audit.rtd_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{audit.rtd_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Milk Fridge: <strong className="text-gray-900">{audit.milk_temp}°C</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    audit.milk_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{audit.milk_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Freezer: <strong className="text-gray-900">{audit.freezer_temp}°C</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    audit.freezer_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{audit.freezer_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Espresso Calibration display */}
          <div className="border border-gray-150 rounded-2xl p-4 space-y-4 bg-white shadow-sm">
            <h4 className="text-xs font-extrabold text-coffee-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Coffee size={14} />
              Espresso Calibration & Coffee Quality Summary
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">Metrik Kalibrasi</span>
                <p className="font-semibold text-gray-700">Dose (Coffee In): <strong className="text-gray-900">{audit.espresso_dose} gr</strong></p>
                <p className="font-semibold text-gray-700">Pressure: <strong className="text-gray-900">{audit.espresso_pressure} Bar</strong></p>
                <p className="font-semibold text-gray-700">Extraction Time: <strong className="text-gray-900">{audit.espresso_finish_sec} seconds</strong></p>
                <p className="font-semibold text-gray-700">Yield: <strong className="text-gray-900">{audit.espresso_yield} ml</strong></p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">Visual Crema (3 Layers)</span>
                <p className="font-semibold text-gray-700">Colour: <strong className="text-gray-900">{audit.espresso_color}</strong></p>
                <p className="font-semibold text-gray-700">Crema Layer: <strong className="text-gray-950 font-bold">{audit.espresso_crema_layers} Layers (Perfect)</strong></p>
                <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-gray-500 font-medium">
                  <span>• Layer 1: Dark Brown Base</span>
                  <span>• Layer 2: Golden Brown Body</span>
                  <span>• Layer 3: Thick Crema Top</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">Taste Sensory Assessment</span>
                <p className="font-semibold text-gray-700">Sweetness: <strong className="text-gray-900">{audit.espresso_taste_sweetness}</strong></p>
                <p className="font-semibold text-gray-700">Acidity: <strong className="text-gray-900">{audit.espresso_taste_acidity}</strong></p>
                <p className="font-semibold text-gray-700">Bitterness: <strong className="text-gray-900">{audit.espresso_taste_bitterness}</strong></p>
                <p className="font-semibold text-gray-700">Aftertaste: <strong className="text-gray-900">{audit.espresso_taste_aftertaste}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-coffee-50/50 p-2.5 rounded-xl border border-coffee-100 text-xs">
              <span className="font-semibold text-coffee-800">Status Calibration Final:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                audit.espresso_calibration_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{audit.espresso_calibration_status}</span>
            </div>
          </div>
        </div>

        {/* Section II: Financial Performance */}
        <div className="space-y-4">
          <h2 className="text-md font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            II. FINANCIAL PERFORMANCE METRICS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">Target Revenue</span>
              <span className="text-sm font-extrabold text-gray-800">
                {new Date(audit.audit_date).getFullYear() > 2000 
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.target_revenue)
                  : audit.target_revenue}
              </span>
            </div>
            
            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">Actual Revenue</span>
              <span className="text-sm font-extrabold text-gray-800">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.actual_revenue)}
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">Achievement (%)</span>
              <span className="text-sm font-extrabold text-gray-800">
                {parseFloat(audit.achievement_percentage).toFixed(0)}%
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">Status Achievement</span>
              <span className={`inline-block font-extrabold text-[10px] px-2 py-0.5 rounded ${
                audit.revenue_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{audit.revenue_status === 'PASS' ? 'Above Target' : 'Below Target'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border border-gray-150 rounded-2xl p-4 bg-white shadow-sm">
            <div>
              <span className="font-bold text-gray-400 block uppercase">Transaction Count</span>
              <span className="text-sm font-extrabold text-gray-800 mt-0.5 block">{audit.transaction_count} trx</span>
            </div>
            <div>
              <span className="font-bold text-gray-400 block uppercase">Average Ticket Size</span>
              <span className="text-sm font-extrabold text-gray-800 mt-0.5 block">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.average_ticket_size)}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-400 block uppercase">Revenue KPI Summary</span>
              <span className="text-xs font-bold text-emerald-800 uppercase block mt-1">{audit.financial_overall_status}</span>
            </div>
          </div>
        </div>

        {/* Section III: Compliance Detail */}
        <div className="space-y-4">
          <h2 className="text-md font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            III. COMPLIANCE ASSESSMENT INSTRUMENT DETAIL
          </h2>

          <div className="space-y-6">
            {Object.keys(categoriesMap).map((catName) => (
              <div key={catName} className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-coffee-800 bg-coffee-50/70 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                  {catName}
                </h4>

                <div className="border border-gray-150 rounded-2xl overflow-hidden overflow-x-auto bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100 text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Parameter Evaluasi</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bobot</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Hasil Penilaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {categoriesMap[catName].map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-700">{item.criteria_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-bold uppercase">{item.weight} ({item.weight_value} pts)</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className={`inline-block font-extrabold px-2 py-0.5 rounded ${
                              item.answer_value === '1'
                                ? 'bg-green-50 text-green-700'
                                : item.answer_value === '0'
                                ? 'bg-red-50 text-red-750'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.answer_value === '1' ? 'Ya (Sesuai SOP)' : item.answer_value === '0' ? 'Tidak (Mangkir SOP)' : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final score calculation banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <h4 className="text-emerald-950 font-black text-lg">TOTAL KEPATUHAN STANDAR OPERASIONAL</h4>
            <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
              Persentase kepatuhan dihitung berdasarkan total nilai bobot diperoleh dibagi total nilai bobot maksimal.
            </p>
          </div>
          <div className="text-center md:text-right shrink-0">
            <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Final Excellence Score</span>
            <div className="text-4xl font-black text-emerald-900 mt-0.5">{parseFloat(audit.compliance_percentage).toFixed(2)}%</div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="border-t pt-8 space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider font-display">Tanda Tangan & Pengesahan Dokumen</h3>
          
          {audit.signature_data ? (
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50/50 w-64 h-36 flex items-center justify-center overflow-hidden">
                <img 
                  src={audit.signature_data} 
                  alt="Manager Signature" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                Ditandatangani secara digital oleh Manager pada{' '}
                <strong className="text-gray-800">
                  {new Date(audit.signed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </strong>
              </p>
              <p className="text-[10px] text-gray-400 font-mono">IP Address: {audit.ip_address}</p>
            </div>
          ) : (
            <div className="no-print">
              {/* Only Manager linked or authorized admin/user can sign, or for demo allow anybody viewing paid/free report */}
              <SignaturePad 
                onSave={handleSaveSignature} 
                onClear={() => {}}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
