import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { 
  Loader2, 
  Coffee, 
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import SignaturePad from '../../components/signature/SignaturePad';
import { useLanguage } from '../../context/LanguageContext';
import logoImg from '../../assets/logo.png';

export default function ReportViewPage({ user }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleSaveSignature = async (base64Data) => {
    setIsSigning(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUDITS.SIGN(token), {
        signature_data: base64Data,
        ip_address: '127.0.0.1' // Mock or client IP
      });
      if (res.success) {
        toast.success(t('report.sign_success'));
        fetchReport(); // Reload report
      }
    } catch (err) {
      toast.error(err.message || t('report.sign_error'));
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
    
    const loadingToast = toast.loading(t('report.pdf_generating'));
    
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success(t('report.pdf_success'));
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error(t('report.pdf_error') + err.message);
        console.error(err);
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
        <Loader2 className="animate-spin text-coffee-800" size={32} />
        <p className="text-sm font-semibold text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

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
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-all cursor-pointer"
        >
          &larr; {t('report.back_list')}
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} />
            {t('report.download_pdf')}
          </button>
        </div>
      </div>

      {/* Main Printed Report layout */}
      <div id="report-document" className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 print:border-none print:shadow-none print-card">
        
        {/* Document Header banner */}
        <div className="border-b-4 border-coffee-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl border border-gray-150 flex items-center justify-center shrink-0">
              <img src={logoImg} alt="Velaskara Logo" className="h-14 w-auto object-contain bg-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-coffee-600 uppercase">{t('report.security_code')}: VK-2026</span>
              <h1 className="text-2xl font-extrabold text-coffee-950 font-display tracking-tight mt-0.5">VELASKARA KOPAY</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">{t('report.system_name')}</p>
            </div>
          </div>
          <div className="bg-coffee-900 text-white px-5 py-3 rounded-2xl text-center shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-coffee-200 block">{t('report.compliance_score')}</span>
            <span className="text-3xl font-black">{parseFloat(audit.compliance_percentage).toFixed(1)}%</span>
          </div>
        </div>

        {/* Section I: Metadata */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            {t('report.section_1')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {/* Info Table */}
            <div className="divide-y divide-gray-150">
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">{t('report.audit_date')}</span>
                <span className="font-bold text-gray-800">
                  {new Date(audit.audit_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">{t('report.auditor')}</span>
                <span className="font-bold text-gray-800">{audit.auditor_name}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">{t('report.shift')}</span>
                <span className="font-bold text-gray-800">{audit.shift}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="font-semibold text-gray-500">{t('report.outlet_branch')}</span>
                <span className="font-bold text-gray-800">{audit.outlet_name}</span>
              </div>
            </div>

            {/* Cold Storage Monitoring */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">{t('report.cold_storage')}</h4>
              
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
              {t('report.espresso_calibration')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">{t('report.calibration_metrics')}</span>
                <p className="font-semibold text-gray-700">{t('report.dose')}: <strong className="text-gray-900">{audit.espresso_dose} gr</strong></p>
                <p className="font-semibold text-gray-700">{t('report.pressure')}: <strong className="text-gray-900">{audit.espresso_pressure} Bar</strong></p>
                <p className="font-semibold text-gray-700">{t('report.time')}: <strong className="text-gray-900">{audit.espresso_finish_sec} {t('report.seconds')}</strong></p>
                <p className="font-semibold text-gray-700">{t('report.yield')}: <strong className="text-gray-900">{audit.espresso_yield} ml</strong></p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">{t('report.crema_layers')}</span>
                <p className="font-semibold text-gray-700">{t('report.crema_layers_desc')}</p>
                <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-gray-500 font-medium">
                  <span>• Layer 1: Dark Brown Base</span>
                  <span>• Layer 2: Golden Brown Body</span>
                  <span>• Layer 3: Thick Crema Top</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wide">{t('report.taste_sensory')}</span>
                <p className="font-semibold text-gray-700">{t('report.sweetness')}: <strong className="text-gray-900">{audit.espresso_taste_sweetness}</strong></p>
                <p className="font-semibold text-gray-700">{t('report.acidity')}: <strong className="text-gray-900">{audit.espresso_taste_acidity}</strong></p>
                <p className="font-semibold text-gray-700">{t('report.bitterness')}: <strong className="text-gray-900">{audit.espresso_taste_bitterness}</strong></p>
                <p className="font-semibold text-gray-700">{t('report.aftertaste')}: <strong className="text-gray-900">{audit.espresso_taste_aftertaste}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-coffee-50/50 p-2.5 rounded-xl border border-coffee-100 text-xs">
              <span className="font-semibold text-coffee-800">{t('report.calibration_status')}:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                audit.espresso_calibration_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{audit.espresso_calibration_status}</span>
            </div>
          </div>
        </div>

        {/* Section II: Financial Performance */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            {t('report.section_2')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">{t('report.target_rev')}</span>
              <span className="text-sm font-extrabold text-gray-800">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.target_revenue)}
              </span>
            </div>
            
            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">{t('report.actual_rev')}</span>
              <span className="text-sm font-extrabold text-gray-800">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.actual_revenue)}
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">{t('report.achievement')} (%)</span>
              <span className="text-sm font-extrabold text-gray-800">
                {parseFloat(audit.achievement_percentage).toFixed(0)}%
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">{t('report.ach_status')}</span>
              <span className={`inline-block font-extrabold text-[10px] px-2 py-0.5 rounded ${
                audit.revenue_status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{audit.revenue_status === 'PASS' ? t('report.above_target') : t('report.below_target')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border border-gray-150 rounded-2xl p-4 bg-white shadow-sm">
            <div>
              <span className="font-bold text-gray-400 block uppercase">{t('report.trx_count')}</span>
              <span className="text-sm font-extrabold text-gray-800 mt-0.5 block">{audit.transaction_count} trx</span>
            </div>
            <div>
              <span className="font-bold text-gray-400 block uppercase">{t('report.ticket_size')}</span>
              <span className="text-sm font-extrabold text-gray-800 mt-0.5 block">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(audit.average_ticket_size)}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-400 block uppercase">{t('report.kpi_summary')}</span>
              <span className="text-xs font-bold text-emerald-800 uppercase block mt-1">{audit.financial_overall_status}</span>
            </div>
          </div>
        </div>

        {/* Section III: Compliance Detail */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-coffee-900 border-b pb-1 font-display uppercase tracking-wide">
            {t('report.section_3')}
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
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[40%]">{t('report.eval_param')}</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[15%]">{t('report.weight')}</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[15%]">{t('report.eval_result')}</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[30%]">{t('report.notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {categoriesMap[catName].map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-700">{item.criteria_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-bold uppercase">{item.weight} ({item.weight_value} pts)</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-block font-extrabold px-2 py-0.5 rounded ${
                              item.answer_value === '1'
                                ? 'bg-green-50 text-green-700'
                                : item.answer_value === '0'
                                ? 'bg-red-50 text-red-755'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.answer_value === '1' ? t('common.yes') : item.answer_value === '0' ? t('common.no') : t('common.na')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-medium break-words">
                            {item.note || <span className="text-gray-300 italic">{t('report.notes_placeholder')}</span>}
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
            <h4 className="text-emerald-950 font-black text-lg">{t('report.total_compliance')}</h4>
            <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
              {t('report.compliance_desc')}
            </p>
          </div>
          <div className="text-center md:text-right shrink-0">
            <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Final Excellence Score</span>
            <div className="text-4xl font-black text-emerald-900 mt-0.5">{parseFloat(audit.compliance_percentage).toFixed(2)}%</div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="border-t pt-8 space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider font-display">{t('report.signature_title')}</h3>
          
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
                {t('report.signed_by')}{' '}
                <strong className="text-gray-800">
                  {new Date(audit.signed_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </strong>
              </p>
              <p className="text-[10px] text-gray-400 font-mono">{t('report.ip_address')}: {audit.ip_address}</p>
            </div>
          ) : (
            <div className="no-print space-y-3">
              <p className="text-xs text-gray-500 font-semibold">{t('report.sign_prompt')}</p>
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
