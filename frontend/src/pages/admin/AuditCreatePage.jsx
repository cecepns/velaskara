import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  Store,
  Thermometer,
  Coffee,
  Coins,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Info,
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function AuditCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [accessToken, setAccessToken] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [outlets, setOutlets] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    outlet_id: '',
    audit_date: new Date().toISOString().split('T')[0],
    shift: 'PAGI (AM)',

    // Cold Storage Monitoring
    rtd_temp: 3.2,
    rtd_status: 'PASS',
    milk_temp: 2.8,
    milk_status: 'PASS',
    freezer_temp: -19.5,
    freezer_status: 'PASS',

    // Espresso Calibration
    espresso_dose: 18.5,
    espresso_pressure: 9,
    espresso_start_sec: 0,
    espresso_finish_sec: 26,
    espresso_yield: 37,
    espresso_color: 'Dark Caramel Brown',
    espresso_crema_layers: 3,
    espresso_taste_sweetness: 'High',
    espresso_taste_acidity: 'Bright & Balanced',
    espresso_taste_bitterness: 'Medium',
    espresso_taste_body: 'Medium Full Body',
    espresso_taste_aftertaste: 'Intense Chocolatey Finish',
    espresso_calibration_status: 'PASS',

    // Financial Performance
    target_revenue: 5000000,
    actual_revenue: 5450000,
    transaction_count: 122,
    average_ticket_size: 44672,

    // Compliance Answers
    answers: {} // Keyed by criteria_id: '1'|'0'|'N/A'
  });

  // Fetch Outlets and Criteria Categories
  useEffect(() => {
    async function initForm() {
      try {
        const outletsRes = await request.get(API_ENDPOINTS.OUTLETS.LIST);
        const criteriaRes = await request.get(API_ENDPOINTS.CRITERIA.LIST, { limit: 200 });

        setOutlets(outletsRes.data || []);
        setCriteria(criteriaRes.data || []);

        // Populate default answers (default to '1' = PASS/Yes)
        const defaultAnswers = {};
        criteriaRes.data?.forEach(item => {
          defaultAnswers[item.id] = '1';
        });

        if (id) {
          const auditRes = await request.get(API_ENDPOINTS.AUDITS.DETAIL(id));
          if (auditRes.success) {
            setAccessToken(auditRes.audit.access_token);
            const answersMap = { ...defaultAnswers };
            auditRes.answers.forEach(ans => {
              answersMap[ans.criteria_id] = ans.answer_value;
            });

            let formattedDate = '';
            if (auditRes.audit.audit_date) {
              formattedDate = new Date(auditRes.audit.audit_date).toISOString().split('T')[0];
            }

            setFormData({
              outlet_id: auditRes.audit.outlet_id,
              audit_date: formattedDate,
              shift: auditRes.audit.shift,
              rtd_temp: auditRes.audit.rtd_temp,
              rtd_status: auditRes.audit.rtd_status,
              milk_temp: auditRes.audit.milk_temp,
              milk_status: auditRes.audit.milk_status,
              freezer_temp: auditRes.audit.freezer_temp,
              freezer_status: auditRes.audit.freezer_status,
              espresso_dose: auditRes.audit.espresso_dose,
              espresso_pressure: auditRes.audit.espresso_pressure,
              espresso_start_sec: auditRes.audit.espresso_start_sec,
              espresso_finish_sec: auditRes.audit.espresso_finish_sec,
              espresso_yield: auditRes.audit.espresso_yield,
              espresso_color: auditRes.audit.espresso_color,
              espresso_crema_layers: auditRes.audit.espresso_crema_layers,
              espresso_taste_sweetness: auditRes.audit.espresso_taste_sweetness,
              espresso_taste_acidity: auditRes.audit.espresso_taste_acidity,
              espresso_taste_bitterness: auditRes.audit.espresso_taste_bitterness,
              espresso_taste_body: auditRes.audit.espresso_taste_body,
              espresso_taste_aftertaste: auditRes.audit.espresso_taste_aftertaste,
              espresso_calibration_status: auditRes.audit.espresso_calibration_status,
              target_revenue: auditRes.audit.target_revenue,
              actual_revenue: auditRes.audit.actual_revenue,
              transaction_count: auditRes.audit.transaction_count,
              average_ticket_size: auditRes.audit.average_ticket_size,
              answers: answersMap
            });
          }
        } else {
          setFormData(prev => ({
            ...prev,
            outlet_id: outletsRes.data?.[0]?.id || '',
            answers: defaultAnswers
          }));
        }
      } catch (err) {
        toast.error('Gagal mengambil data inisialisasi form');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    initForm();
  }, [id]);

  // Monitor Cold Storage standard auto-status helper
  useEffect(() => {
    const rtd = parseFloat(formData.rtd_temp);
    const rtdStatus = (rtd >= 1 && rtd <= 4) ? 'PASS' : 'FAIL';

    const milk = parseFloat(formData.milk_temp);
    const milkStatus = (milk >= 1 && milk <= 4) ? 'PASS' : 'FAIL';

    const freezer = parseFloat(formData.freezer_temp);
    const freezerStatus = freezer <= -18 ? 'PASS' : 'FAIL';

    setFormData(prev => ({
      ...prev,
      rtd_status: rtdStatus,
      milk_status: milkStatus,
      freezer_status: freezerStatus
    }));
  }, [formData.rtd_temp, formData.milk_temp, formData.freezer_temp]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnswerChange = (criteriaId, value) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [criteriaId]: value
      }
    }));
  };

  const calculateLiveScore = () => {
    let scoreObtained = 0;
    let scoreMax = 0;

    criteria.forEach(item => {
      const val = formData.answers[item.id];
      if (val !== 'N/A') {
        scoreMax += item.weight_value;
        if (val === '1') {
          scoreObtained += item.weight_value;
        }
      }
    });

    const pct = scoreMax > 0 ? (scoreObtained / scoreMax) * 100 : 0;
    return { scoreObtained, scoreMax, pct };
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.outlet_id) {
      toast.error('Pilih outlet terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map answer object back to list format for backend API
      const answersList = Object.keys(formData.answers).map(id => ({
        criteria_id: parseInt(id),
        answer_value: formData.answers[id]
      }));

      const payload = {
        ...formData,
        answers: answersList
      };

      let res;
      if (id) {
        res = await request.put(API_ENDPOINTS.AUDITS.UPDATE(id), payload);
      } else {
        res = await request.post(API_ENDPOINTS.AUDITS.CREATE, payload);
      }

      if (res.success) {
        toast.success(id ? 'Laporan audit berhasil diperbarui!' : 'Laporan audit berhasil disimpan!');
        const tokenToUse = id ? accessToken : res.access_token;
        if (tokenToUse) {
          navigate(`/report/${tokenToUse}`);
        } else {
          navigate('/audits');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan laporan audit');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTab = () => setActiveTab(t => Math.min(5, t + 1));
  const prevTab = () => setActiveTab(t => Math.max(1, t - 1));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="animate-spin text-coffee-800" size={32} />
        <p className="text-sm font-semibold text-gray-500">Menyiapkan Form Audit...</p>
      </div>
    );
  }

  // Group criteria by categories
  const categoriesMap = {};
  criteria.forEach(item => {
    if (!categoriesMap[item.category_name]) {
      categoriesMap[item.category_name] = [];
    }
    categoriesMap[item.category_name].push(item);
  });

  const { pct } = calculateLiveScore();

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-display">
            {id ? 'Edit Sesi Audit' : 'Sesi Audit Baru'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Isi formulir penilaian standard kualitas berikut</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-semibold uppercase">Estimasi Skor</span>
          <div className="text-2xl font-extrabold text-coffee-800">{pct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 1, label: 'Metadata & Info', icon: Store },
          { id: 2, label: 'Cold Storage', icon: Thermometer },
          { id: 3, label: 'Espresso Calibration', icon: Coffee },
          { id: 4, label: 'Financial Performance', icon: Coins },
          { id: 5, label: 'Compliance Assessment', icon: ClipboardCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs whitespace-nowrap transition-all ${isActive
                ? 'border-coffee-800 text-coffee-850'
                : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Area */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">

        {/* Step 1: Metadata */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-lg text-gray-800 font-display">Section I: Informasi Audit</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Pilih Outlet</label>
                <select
                  name="outlet_id"
                  value={formData.outlet_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                >
                  <option value="">Pilih outlet...</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Tanggal Audit</label>
                <input
                  type="date"
                  name="audit_date"
                  value={formData.audit_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Shift Operasional</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                >
                  <option value="PAGI (AM)">PAGI (AM)</option>
                  <option value="SORE (PM)">SORE (PM)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cold Storage */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-lg text-gray-800 font-display flex items-center gap-2">
              <Thermometer className="text-coffee-650" />
              Section II: Cold Storage Monitoring
            </h3>

            <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-2.5 border border-amber-200">
              <Info className="text-amber-600 mt-0.5 shrink-0" size={16} />
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Standard Suhu: RTD Showcase: 1°C - 4°C • Milk Fridge: 1°C - 4°C • Freezer: ≤ -18°C. Status PASS/FAIL akan dihitung otomatis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* RTD Showcase */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <span className="text-sm font-bold text-gray-800">RTD Showcase</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="rtd_temp"
                    value={formData.rtd_temp}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                  />
                  <span className="text-sm text-gray-500 font-bold">°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Auto Status:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${formData.rtd_status === 'PASS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {formData.rtd_status}
                  </span>
                </div>
              </div>

              {/* Milk Fridge */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <span className="text-sm font-bold text-gray-800">Milk Fridge</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="milk_temp"
                    value={formData.milk_temp}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                  />
                  <span className="text-sm text-gray-500 font-bold">°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Auto Status:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${formData.milk_status === 'PASS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {formData.milk_status}
                  </span>
                </div>
              </div>

              {/* Freezer */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <span className="text-sm font-bold text-gray-800">Freezer</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="freezer_temp"
                    value={formData.freezer_temp}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                  />
                  <span className="text-sm text-gray-500 font-bold">°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Auto Status:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${formData.freezer_status === 'PASS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {formData.freezer_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Espresso */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-lg text-gray-800 font-display flex items-center gap-2">
              <Coffee className="text-coffee-650" />
              Section III: Espresso Calibration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Physical metrics */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-700 border-b pb-1">Metrik Ekstraksi</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Dose (Coffee In) gr</label>
                    <input
                      type="number"
                      step="0.1"
                      name="espresso_dose"
                      value={formData.espresso_dose}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Pressure (Bar)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="espresso_pressure"
                      value={formData.espresso_pressure}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Start Extraction (s)</label>
                    <input
                      type="number"
                      name="espresso_start_sec"
                      value={formData.espresso_start_sec}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Finish Extraction (s)</label>
                    <input
                      type="number"
                      name="espresso_finish_sec"
                      value={formData.espresso_finish_sec}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600">Yield (ml)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="espresso_yield"
                      value={formData.espresso_yield}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Sensory & Status */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-700 border-b pb-1">Sensory & Calibration Status</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Espresso Color</label>
                    <input
                      type="text"
                      name="espresso_color"
                      value={formData.espresso_color}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Crema Layer count</label>
                    <select
                      name="espresso_crema_layers"
                      value={formData.espresso_crema_layers}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                    >
                      <option value={1}>1 Layer</option>
                      <option value={2}>2 Layers</option>
                      <option value={3}>3 Layers (Perfect)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600">Calibration Result Status</label>
                    <select
                      name="espresso_calibration_status"
                      value={formData.espresso_calibration_status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none text-gray-800 font-bold focus:ring-2 focus:ring-coffee-600"
                    >
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Taste description */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-sm text-gray-700">Taste & Flavor Profile Assessment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600">Sweetness</label>
                  <input
                    type="text"
                    name="espresso_taste_sweetness"
                    value={formData.espresso_taste_sweetness}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600">Acidity</label>
                  <input
                    type="text"
                    name="espresso_taste_acidity"
                    value={formData.espresso_taste_acidity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600">Bitterness</label>
                  <input
                    type="text"
                    name="espresso_taste_bitterness"
                    value={formData.espresso_taste_bitterness}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600">Body</label>
                  <input
                    type="text"
                    name="espresso_taste_body"
                    value={formData.espresso_taste_body}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600">Aftertaste Finish</label>
                  <input
                    type="text"
                    name="espresso_taste_aftertaste"
                    value={formData.espresso_taste_aftertaste}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Financial */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-lg text-gray-800 font-display flex items-center gap-2">
              <Coins className="text-coffee-650" />
              Section IV: Financial Performance Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Target Revenue (Rupiah)</label>
                <input
                  type="number"
                  name="target_revenue"
                  value={formData.target_revenue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Actual Revenue (Rupiah)</label>
                <input
                  type="number"
                  name="actual_revenue"
                  value={formData.actual_revenue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Transaction Count (trx)</label>
                <input
                  type="number"
                  name="transaction_count"
                  value={formData.transaction_count}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Average Ticket Size (Rupiah)</label>
                <input
                  type="number"
                  name="average_ticket_size"
                  value={formData.average_ticket_size}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Compliance Assessment */}
        {activeTab === 5 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-lg text-gray-800 font-display flex items-center gap-2">
                <ClipboardCheck className="text-coffee-650" />
                Section V: Compliance Assessment Instrument
              </h3>
              <span className="text-xs bg-coffee-100 text-coffee-800 px-3 py-1 rounded-full font-bold">
                Live Score: {pct.toFixed(1)}%
              </span>
            </div>

            {Object.keys(categoriesMap).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Kriteria penilaian tidak ditemukan. Silakan tambahkan kriteria terlebih dahulu.</p>
            ) : (
              Object.keys(categoriesMap).map((catName) => (
                <div key={catName} className="space-y-4">
                  <h4 className="font-bold text-sm text-coffee-800 bg-coffee-50 px-4 py-2 rounded-xl">
                    {catName}
                  </h4>

                  <div className="divide-y divide-gray-100 border rounded-2xl bg-white overflow-hidden">
                    {categoriesMap[catName].map((item) => {
                      const curVal = formData.answers[item.id] || '1';

                      return (
                        <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${item.weight === 'critical' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {item.weight} ({item.weight_value} pts)
                              </span>
                            </div>
                          </div>

                          {/* Radios Option */}
                          <div className="flex items-center space-x-3 shrink-0">
                            {[
                              { label: 'Ya', value: '1' },
                              { label: 'Tidak', value: '0' },
                              { label: 'N/A', value: 'N/A' }
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center border px-3 py-1.5 rounded-xl cursor-pointer text-xs font-bold select-none transition-all ${curVal === opt.value
                                  ? 'bg-coffee-800 text-white border-coffee-800 shadow-sm'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name={`criteria_${item.id}`}
                                  value={opt.value}
                                  checked={curVal === opt.value}
                                  onChange={() => handleAnswerChange(item.id, opt.value)}
                                  className="sr-only"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wizard Buttons Navigation */}
        <div className="flex items-center justify-between border-t pt-5 mt-6">
          <button
            type="button"
            onClick={prevTab}
            disabled={activeTab === 1}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={16} />
            Sebelumnya
          </button>

          {activeTab < 5 ? (
            <button
              type="button"
              onClick={nextTab}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-coffee-800 text-white rounded-xl text-sm font-semibold hover:bg-coffee-950 transition-all shadow-sm"
            >
              Lanjutkan
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan & Kirim Laporan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
