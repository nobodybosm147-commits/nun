import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, History, Store, User, ChevronLeft, Save, CheckCircle,
  AlertCircle, Star, Utensils, Droplets, Smile, BarChart3, Filter,
  TrendingUp, TrendingDown, ShieldCheck, Clock, Thermometer, Award,
  Package, Leaf, Activity, Flame, Eye
} from 'lucide-react';

// ==========================================
// ⚙️ การตั้งค่าระบบสำหรับ "นันท์ข้าวมันไก่"
// ==========================================
const BRAND_NAME = "นันท์ข้าวมันไก่";
const APP_PIN = "9999";
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwwuF7XmJ5RwVTYhDKVB55fAqANG1sVo_k-bAOgWRg8sM0uJpdtr5lqWqtwT3aF303R/exec';

const BRANCHES = [
  'สาขาหลัก (ต้นตำรับ)',
  'สาขาลาดพร้าว',
  'สาขาเชียงใหม่',
  'สาขาภูเก็ต',
  'สาขาขอนแก่น'
];

// ==========================================
// 📊 โครงสร้างหัวข้อการประเมิน (ปรับได้ง่าย)
// ==========================================
const SCORE_CATEGORIES = [
  {
    id: 'food',
    title: 'คุณภาพอาหารหลัก',
    icon: Utensils,
    items: [
      { key: 'rice',         label: 'ข้าวมัน (หอม นุ่ม ร่วน ไม่แฉะ)',              icon: Utensils },
      { key: 'chicken',      label: 'เนื้อไก่ต้ม (นุ่ม สุกพอดี หนังตึง ไม่คาว)',    icon: Utensils },
      { key: 'friedChicken', label: 'ไก่ทอด (กรอบนอก นุ่มใน สีสม่ำเสมอ)',          icon: Flame    },
      { key: 'soup',         label: 'น้ำซุป (ร้อน รสชาติกลมกล่อม)',                 icon: Droplets },
      { key: 'sauce',        label: 'น้ำจิ้ม (รสชาติตามมาตรฐาน ไม่บูด)',            icon: Droplets },
    ]
  },
  {
    id: 'accompaniment',
    title: 'เครื่องเคียงและผักสด',
    icon: Leaf,
    items: [
      { key: 'cucumber',  label: 'แตงกวา (สด กรอบ หั่นสม่ำเสมอ)',         icon: Leaf     },
      { key: 'coriander', label: 'ผักชี (สด สะอาด ใบไม่เหี่ยวเฉา)',        icon: Leaf     },
      { key: 'blood',     label: 'เลือด (สุก ไม่แฉะ ตัดสม่ำเสมอ)',         icon: Activity },
      { key: 'liver',     label: 'ตับ (สุกพอดี ไม่แข็ง ไม่มีกลิ่น)',       icon: Activity },
    ]
  },
  {
    id: 'service',
    title: 'มาตรฐานการบริการ',
    icon: Smile,
    items: [
      { key: 'service',      label: 'มารยาทการบริการ (ยิ้มแย้ม สุภาพ)',              icon: Smile },
      { key: 'servingSpeed', label: 'ความเร็วในการเสิร์ฟ (ภายใน 5 นาที)',            icon: Clock },
      { key: 'uniform',      label: 'ยูนิฟอร์มพนักงาน (สะอาด ครบ ถูกต้อง)',         icon: Award },
    ]
  },
  {
    id: 'standards',
    title: 'ความสะอาดและมาตรฐานร้าน',
    icon: Star,
    items: [
      { key: 'clean',        label: 'ความสะอาด (ครัว โต๊ะ อุปกรณ์)',                 icon: Star        },
      { key: 'presentation', label: 'การจัดจาน / Presentation (สวยงาม น่ากิน)',      icon: Package     },
      { key: 'temperature',  label: 'อุณหภูมิอาหาร (ร้อนถึงมือลูกค้า)',               icon: Thermometer },
      { key: 'portion',      label: 'ปริมาณอาหาร (สม่ำเสมอตามมาตรฐาน)',              icon: Package     },
    ]
  }
];

const ALL_ITEMS = SCORE_CATEGORIES.flatMap(c => c.items);
const MAX_SCORE = ALL_ITEMS.length * 5; // 16 × 5 = 80

const initialFormState = () => {
  const state = { branch: '', auditor: '', remark: '' };
  ALL_ITEMS.forEach(item => {
    state[`${item.key}Score`] = 5;
    state[`${item.key}Remark`] = '';
  });
  return state;
};

// ==========================================
// 📦 Components ย่อย
// ==========================================
const Header = ({ title, showBack, onBack }) => (
  <header className="bg-gradient-to-r from-red-700 to-red-600 text-white p-4 shadow-md sticky top-0 z-20 flex items-center justify-between">
    <div className="flex items-center">
      {showBack && (
        <button onClick={onBack} className="mr-3 p-1 hover:bg-white/20 rounded-full transition-all">
          <ChevronLeft size={24} />
        </button>
      )}
      <div>
        <h1 className="text-lg font-bold leading-tight">{title}</h1>
        <p className="text-[10px] text-red-100 opacity-90 tracking-wider uppercase">{BRAND_NAME} QC SYSTEM</p>
      </div>
    </div>
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-300 overflow-hidden">
      <img src="/QC/logo.jpg" alt="logo" className="w-full h-full object-cover"
        onError={(e) => { e.target.onerror = null; e.target.src = "https://api.iconify.design/noto:rooster.svg"; }}
      />
    </div>
  </header>
);

const RatingGroup = ({ label, icon: Icon, value, onChange, lowScoreRemark, onRemarkChange }) => {
  const isCritical = value <= 2;
  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border mb-4 transition-all duration-300 ${isCritical ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-100'}`}>
      <div className="flex items-center mb-3 text-gray-800 font-semibold text-sm">
        <div className={`p-2 rounded-lg mr-3 ${isCritical ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
          <Icon size={18} />
        </div>
        {label}
      </div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-1 py-2 sm:py-3 rounded-xl font-bold text-lg transition-all ${
              value === num
                ? num <= 2 ? 'bg-orange-500 text-white shadow-md transform scale-105' : 'bg-red-600 text-white shadow-md transform scale-105'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      {isCritical && (
        <div className="mt-4 animate-fade-in-down">
          <label className="flex items-center text-xs font-bold text-orange-600 mb-2">
            <AlertCircle size={14} className="mr-1" /> ระบุสาเหตุที่ไม่ได้มาตรฐาน (บังคับ)
          </label>
          <input
            type="text"
            placeholder="เช่น ข้าวแฉะเกินไป, ไก่มีกลิ่นคาว..."
            className="w-full bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={lowScoreRemark || ''}
            onChange={(e) => onRemarkChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Mini score bar for DetailView
const ScoreBar = ({ label, icon: Icon, score }) => {
  const pct = score != null ? (score / 5) * 100 : 0;
  const color = score == null ? 'bg-gray-200' : score >= 4 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="text-gray-400 flex-shrink-0"><Icon size={13} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 truncate pr-2">{label}</span>
          <span className={`text-xs font-bold flex-shrink-0 ${score == null ? 'text-gray-300' : score <= 2 ? 'text-red-500' : 'text-gray-700'}`}>
            {score != null ? `${score}/5` : 'N/A'}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    </div>
  );
};

// Grade helper
const getGrade = (pct) => {
  if (pct >= 90) return { label: 'ดีเยี่ยม ⭐',     color: 'text-green-600',  bg: 'bg-green-50',  bar: 'bg-green-500'  };
  if (pct >= 80) return { label: 'ดี',               color: 'text-green-500',  bg: 'bg-green-50',  bar: 'bg-green-400'  };
  if (pct >= 70) return { label: 'ปานกลาง',          color: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-500' };
  if (pct >= 60) return { label: 'พอใช้',            color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
  return              { label: 'ต้องปรับปรุงด่วน',   color: 'text-red-600',    bg: 'bg-red-50',    bar: 'bg-red-500'    };
};

// ==========================================
// 🚀 Main Application
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput]               = useState('');
  const [currentView, setCurrentView]         = useState('home');
  const [isLoading, setIsLoading]             = useState(false);
  const [notification, setNotification]       = useState(null);
  const [historyData, setHistoryData]         = useState([]);
  const [historyFilter, setHistoryFilter]     = useState('ทั้งหมด');
  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [formData, setFormData]               = useState(initialFormState());

  const setField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Login ---
  const handlePinSubmit = () => {
    if (pinInput === APP_PIN) {
      setIsAuthenticated(true);
      fetchHistory();
    } else {
      showNotification('รหัส PIN ไม่ถูกต้อง', 'error');
      setPinInput('');
    }
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!formData.branch || !formData.auditor) {
      showNotification('กรุณาระบุสาขาและชื่อผู้ตรวจ', 'error');
      return;
    }
    for (let item of ALL_ITEMS) {
      const score  = formData[`${item.key}Score`];
      const remark = formData[`${item.key}Remark`];
      if (score <= 2 && !remark.trim()) {
        showNotification(`กรุณาระบุสาเหตุที่ "${item.label.split('(')[0].trim()}" ได้คะแนนต่ำ`, 'error');
        return;
      }
    }

    setIsLoading(true);
    const totalScore     = ALL_ITEMS.reduce((sum, item) => sum + formData[`${item.key}Score`], 0);
    const criticalItems  = ALL_ITEMS.filter(item => formData[`${item.key}Score`] <= 2);
    const criticalIssues = criticalItems.map(item =>
      `${item.label.split('(')[0].trim()}: ${formData[`${item.key}Remark`]}`
    ).join(' | ');

    const scoreFields = Object.fromEntries(
      ALL_ITEMS.map(item => [`${item.key}Score`, formData[`${item.key}Score`]])
    );

    const payload = {
      date: new Date().toISOString(),
      branch: formData.branch,
      auditor: formData.auditor,
      totalScore,
      maxScore: MAX_SCORE,
      remark: formData.remark,
      criticalIssues,
      ...scoreFields
    };

    try {
      if (GOOGLE_SHEET_API_URL) {
        await fetch(GOOGLE_SHEET_API_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const existing = JSON.parse(localStorage.getItem('qc_nun_db') || '[]');
        localStorage.setItem('qc_nun_db', JSON.stringify([payload, ...existing]));
      }
      showNotification('บันทึกผลตรวจสอบเรียบร้อยแล้ว');
      fetchHistory();
      setCurrentView('home');
      setFormData({ ...initialFormState(), auditor: formData.auditor });
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      if (GOOGLE_SHEET_API_URL) {
        const res  = await fetch(GOOGLE_SHEET_API_URL);
        const data = await res.json();
        setHistoryData(data.reverse());
      } else {
        const data = JSON.parse(localStorage.getItem('qc_nun_db') || '[]');
        setHistoryData(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openDetail = (item) => { setSelectedRecord(item); setCurrentView('detail'); };

  // ==========================================
  // 📱 Views
  // ==========================================

  // --- PIN Screen ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-gray-900 flex justify-center items-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
            <ShieldCheck size={48} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{BRAND_NAME}</h2>
          <p className="text-sm text-gray-500 mb-8">ระบบตรวจสอบมาตรฐานสาขา (QC)</p>
          <div className="flex justify-center gap-3 mb-8">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full ${pinInput.length > i ? 'bg-red-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'C') setPinInput('');
                  else if (key === 'OK') handlePinSubmit();
                  else if (pinInput.length < 4) setPinInput(prev => prev + key);
                }}
                className={`py-4 text-xl font-bold rounded-xl transition-all active:scale-95 ${
                  key === 'OK' ? 'bg-red-600 text-white shadow-md hover:bg-red-700' :
                  key === 'C'  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                  'bg-white border border-gray-200 text-gray-800 shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">Authorized Personnel Only</p>
        </div>
      </div>
    );
  }

  // ---- HOME ----
  const HomeView = () => {
    const thisMonth    = new Date().getMonth();
    const monthlyAudits = historyData.filter(d => new Date(d.date).getMonth() === thisMonth).length;
    const avgScore     = historyData.length
      ? Math.round(historyData.reduce((acc, curr) => acc + (curr.totalScore / curr.maxScore * 100), 0) / historyData.length)
      : 0;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="หน้าหลัก" showBack={false} />
        <div className="p-5 flex-1 overflow-y-auto no-scrollbar pb-6">

          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-1">ยินดีต้อนรับทีม QC</h2>
              <p className="text-gray-300 text-sm mb-6">รักษามาตรฐานให้ "{BRAND_NAME}" เติบโตอย่างยั่งยืน</p>
              <div className="flex gap-4">
                <div className="bg-white/10 p-3 rounded-2xl flex-1 backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-gray-300 mb-1">ตรวจเดือนนี้</p>
                  <p className="text-2xl font-bold text-white">{monthlyAudits} <span className="text-sm font-normal">สาขา</span></p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl flex-1 backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-gray-300 mb-1">คะแนนเฉลี่ย</p>
                  <p className={`text-2xl font-bold ${avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {avgScore}%
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl flex-1 backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-gray-300 mb-1">หัวข้อตรวจ</p>
                  <p className="text-2xl font-bold text-white">{ALL_ITEMS.length} <span className="text-sm font-normal">รายการ</span></p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 text-white/5"><ClipboardCheck size={150} /></div>
          </div>

          {/* Main Menu */}
          <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">เมนูหลัก</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setCurrentView('qc_form')} className="bg-red-600 text-white p-5 rounded-2xl shadow-md hover:bg-red-700 active:scale-95 transition-all flex flex-col items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full"><ClipboardCheck size={28} /></div>
              <span className="font-bold text-sm">เริ่มตรวจสาขา</span>
            </button>
            <div className="grid grid-rows-2 gap-3">
              <button onClick={() => setCurrentView('stats')} className="bg-white text-gray-700 p-3 rounded-2xl shadow-sm border border-gray-100 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                <BarChart3 size={20} className="text-red-500" /><span className="font-bold text-sm">สถิติ/รายงาน</span>
              </button>
              <button onClick={() => setCurrentView('history')} className="bg-white text-gray-700 p-3 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                <History size={20} className="text-gray-400" /><span className="font-bold text-sm">ประวัติทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Category Quick View */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {SCORE_CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1.5 text-center">
                  <div className="text-red-500"><CatIcon size={18} /></div>
                  <p className="text-[9px] text-gray-500 leading-tight">{cat.title.split('และ')[0].split('/')[0].trim()}</p>
                  <p className="text-[9px] font-bold text-gray-700">{cat.items.length} รายการ</p>
                </div>
              );
            })}
          </div>

          {/* Recent Audits */}
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">ตรวจสอบล่าสุด</h3>
            <button onClick={() => setCurrentView('history')} className="text-xs text-red-600 font-bold hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="space-y-3">
            {historyData.slice(0, 3).map((item, idx) => {
              const percent = Math.round((item.totalScore / item.maxScore) * 100);
              return (
                <div key={idx}
                  onClick={() => openDetail(item)}
                  className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${percent >= 80 ? 'bg-green-500' : percent >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{item.branch}</p>
                      <p className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{percent}%</span>
                    <Eye size={13} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
            {historyData.length === 0 && <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>
    );
  };

  // ---- QC FORM ----
  const QCFormView = () => {
    const currentTotal = ALL_ITEMS.reduce((sum, item) => sum + formData[`${item.key}Score`], 0);
    const currentPct   = Math.round((currentTotal / MAX_SCORE) * 100);
    const criticalCount = ALL_ITEMS.filter(item => formData[`${item.key}Score`] <= 2).length;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="แบบฟอร์ม QC" showBack={true} onBack={() => setCurrentView('home')} />

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28">

          {/* Branch & Auditor */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="mb-4">
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Store size={16} className="mr-2 text-red-600" /> สาขาที่กำลังตรวจ
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.branch} onChange={(e) => setField('branch', e.target.value)}
              >
                <option value="">-- เลือกสาขา --</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <User size={16} className="mr-2 text-red-600" /> ชื่อผู้ตรวจ (QC)
              </label>
              <input
                type="text" placeholder="ระบุชื่อพนักงาน"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.auditor} onChange={(e) => setField('auditor', e.target.value)}
              />
            </div>
          </div>

          {/* Live Score Preview */}
          <div className="bg-gray-800 text-white p-4 rounded-2xl mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">คะแนนสะสมปัจจุบัน</p>
                <p className={`text-3xl font-black ${currentPct >= 80 ? 'text-green-400' : currentPct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {currentTotal} <span className="text-lg font-normal text-gray-400">/ {MAX_SCORE}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${currentPct >= 80 ? 'text-green-400' : currentPct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{currentPct}%</p>
                {criticalCount > 0 && (
                  <p className="text-[10px] text-orange-400 font-bold">{criticalCount} จุดวิกฤต</p>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${currentPct >= 80 ? 'bg-green-500' : currentPct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${currentPct}%` }}
              ></div>
            </div>
          </div>

          {/* Score Categories */}
          {SCORE_CATEGORIES.map((cat, catIdx) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-bold text-gray-500 mb-3 mt-4 px-2 uppercase tracking-wider flex items-center gap-2">
                  <CatIcon size={15} className="text-red-600" />
                  หมวด {catIdx + 1}: {cat.title}
                  <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                    {cat.items.length} รายการ
                  </span>
                </h3>
                {cat.items.map(item => (
                  <RatingGroup
                    key={item.key}
                    label={item.label}
                    icon={item.icon}
                    value={formData[`${item.key}Score`]}
                    onChange={(v) => setField(`${item.key}Score`, v)}
                    lowScoreRemark={formData[`${item.key}Remark`]}
                    onRemarkChange={(v) => setField(`${item.key}Remark`, v)}
                  />
                ))}
              </div>
            );
          })}

          {/* General Remark */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">ข้อเสนอแนะภาพรวม (ตัวเลือก)</label>
            <textarea
              rows="3"
              placeholder="ข้อความถึงผู้จัดการสาขานี้..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              value={formData.remark} onChange={(e) => setField('remark', e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'}`}
          >
            {isLoading
              ? <span className="animate-pulse">กำลังตรวจสอบและบันทึก...</span>
              : <><Save size={20} /> บันทึกและส่งรายงาน ({currentPct}%)</>
            }
          </button>
        </div>
      </div>
    );
  };

  // ---- DETAIL ----
  const DetailView = () => {
    if (!selectedRecord) return null;
    const item    = selectedRecord;
    const percent = Math.round((item.totalScore / item.maxScore) * 100);
    const grade   = getGrade(percent);
    const hasCritical = item.criticalIssues && item.criticalIssues.length > 0;
    const backView    = 'history';

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="รายละเอียดผลตรวจ" showBack={true} onBack={() => setCurrentView(backView)} />
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-8">

          {/* Score Summary */}
          <div className={`${grade.bg} rounded-3xl p-5 mb-4 border border-gray-100 shadow-sm`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-black text-xl text-gray-800">{item.branch}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(item.date).toLocaleString('th-TH')}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  QC: <span className="font-bold text-gray-700">{item.auditor}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-black ${grade.color}`}>{percent}%</p>
                <p className={`text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full inline-block ${grade.bg} ${grade.color} border border-current border-opacity-20`}>
                  {grade.label}
                </p>
              </div>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all ${grade.bar}`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">{item.totalScore} / {item.maxScore} คะแนน</p>
          </div>

          {/* Critical Issues */}
          {hasCritical && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                <AlertCircle size={16} /> จุดที่ต้องปรับปรุงด่วน
              </h3>
              {item.criticalIssues.split(' | ').map((issue, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-red-700">{issue}</p>
                </div>
              ))}
            </div>
          )}

          {/* Score Breakdown by Category */}
          {SCORE_CATEGORIES.map((cat) => {
            const CatIcon  = cat.icon;
            const catItems = cat.items;
            const catTotal = catItems.reduce((sum, it) => sum + (Number(item[`${it.key}Score`]) || 0), 0);
            const catMax   = catItems.length * 5;
            const catPct   = Math.round((catTotal / catMax) * 100);

            return (
              <div key={cat.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                  <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-red-500"><CatIcon size={15} /></span>
                    {cat.title}
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    catPct >= 80 ? 'bg-green-100 text-green-700' :
                    catPct >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {catPct}%
                  </span>
                </div>
                {catItems.map(it => (
                  <ScoreBar
                    key={it.key}
                    label={it.label}
                    icon={it.icon}
                    score={item[`${it.key}Score`] != null ? Number(item[`${it.key}Score`]) : null}
                  />
                ))}
              </div>
            );
          })}

          {/* General Remark */}
          {item.remark && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <ClipboardCheck size={15} className="text-red-500" /> ข้อเสนอแนะภาพรวม
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.remark}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- HISTORY ----
  const HistoryView = () => {
    const filteredData = historyFilter === 'ทั้งหมด'
      ? historyData
      : historyData.filter(d => d.branch === historyFilter);

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="ประวัติการตรวจสอบ" showBack={true} onBack={() => setCurrentView('home')} />
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            className="flex-1 bg-gray-50 border-none text-sm font-bold text-gray-700 focus:ring-0"
            value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}
          >
            <option value="ทั้งหมด">แสดงทุกสาขา</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredData.length} รายการ</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>ไม่พบข้อมูลประวัติ</p>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {filteredData.map((item, index) => {
                const percent     = Math.round((item.totalScore / item.maxScore) * 100);
                const grade       = getGrade(percent);
                const hasCritical = item.criticalIssues && item.criticalIssues.length > 0;

                return (
                  <div
                    key={index}
                    onClick={() => openDetail(item)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-98"
                  >
                    {hasCritical && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 transform rotate-45 translate-x-8 -translate-y-8 z-0"></div>}
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                          <Store size={13} className="text-red-600" />{item.branch}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">{new Date(item.date).toLocaleString('th-TH')}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${grade.color} ${grade.bg}`}>
                        {percent}%
                      </div>
                    </div>

                    {hasCritical && (
                      <div className="mb-2 bg-red-50 border border-red-100 p-2 rounded-lg text-xs text-red-700 relative z-10">
                        <span className="font-bold flex items-center gap-1 mb-1">
                          <AlertCircle size={11} /> จุดที่ต้องปรับปรุงด่วน:
                        </span>
                        {item.criticalIssues.split(' | ').map((issue, i) => (
                          <div key={i} className="ml-3">• {issue}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 text-xs relative z-10">
                      <span className="text-gray-500">QC: <span className="font-bold text-gray-700">{item.auditor}</span></span>
                      <div className="flex items-center gap-1 text-red-600 font-bold">
                        <Eye size={12} /> ดูรายละเอียด
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- STATS ----
  const StatsView = () => {
    const branchStats = useMemo(() => {
      const stats = {};
      historyData.forEach(item => {
        if (!stats[item.branch]) stats[item.branch] = { totalScore: 0, maxScore: 0, count: 0 };
        stats[item.branch].totalScore += item.totalScore;
        stats[item.branch].maxScore   += item.maxScore;
        stats[item.branch].count      += 1;
      });
      return Object.keys(stats).map(branch => ({
        branch,
        avgPercent: Math.round((stats[branch].totalScore / stats[branch].maxScore) * 100),
        count: stats[branch].count
      })).sort((a, b) => b.avgPercent - a.avgPercent);
    }, [historyData]);

    const categoryStats = useMemo(() => {
      if (!historyData.length) return [];
      return SCORE_CATEGORIES.map(cat => {
        const allScores = cat.items.map(item => {
          const vals = historyData.map(d => Number(d[`${item.key}Score`])).filter(v => !isNaN(v) && v > 0);
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        });
        const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        return {
          title: cat.title,
          icon:  cat.icon,
          avg:   Math.round(avg * 10) / 10,
          pct:   Math.round((avg / 5) * 100)
        };
      });
    }, [historyData]);

    const topBranch    = branchStats.length > 0 ? branchStats[0] : null;
    const lowestBranch = branchStats.length > 1 ? branchStats[branchStats.length - 1] : null;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="รายงานผู้บริหาร" showBack={true} onBack={() => setCurrentView('home')} />
        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {branchStats.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
              <p>ไม่มีข้อมูลสถิติ</p>
            </div>
          ) : (
            <div className="space-y-5 pb-10">
              {/* Executive Summary */}
              <div className="grid grid-cols-2 gap-3">
                {topBranch && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                    <div className="flex items-center gap-2 text-green-600 mb-2"><TrendingUp size={16} /><span className="text-xs font-bold uppercase">สาขายอดเยี่ยม</span></div>
                    <p className="font-bold text-sm text-gray-800 truncate">{topBranch.branch}</p>
                    <p className="text-2xl font-black text-green-500 mt-1">{topBranch.avgPercent}%</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ตรวจ {topBranch.count} ครั้ง</p>
                  </div>
                )}
                {lowestBranch && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                    <div className="flex items-center gap-2 text-red-600 mb-2"><TrendingDown size={16} /><span className="text-xs font-bold uppercase">ต้องปรับปรุง</span></div>
                    <p className="font-bold text-sm text-gray-800 truncate">{lowestBranch.branch}</p>
                    <p className="text-2xl font-black text-red-500 mt-1">{lowestBranch.avgPercent}%</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ตรวจ {lowestBranch.count} ครั้ง</p>
                  </div>
                )}
              </div>

              {/* Category Performance */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-red-600" /> คะแนนเฉลี่ยแยกหมวด
                </h3>
                <div className="space-y-4">
                  {categoryStats.map((cat, i) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <CatIcon size={13} className="text-red-500" />{cat.title}
                          </p>
                          <span className="text-xs font-bold text-gray-500">{cat.avg}/5 ({cat.pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cat.pct >= 80 ? 'bg-green-500' : cat.pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${cat.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Branch Ranking */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award size={16} className="text-red-600" /> การจัดอันดับทุกสาขา
                </h3>
                <div className="space-y-4">
                  {branchStats.map((stat, index) => {
                    const isTop = index === 0;
                    const grade = getGrade(stat.avgPercent);
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-end mb-1">
                          <p className="font-bold text-sm text-gray-700 flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${isTop ? 'bg-yellow-500' : 'bg-gray-300'}`}>{index + 1}</span>
                            {stat.branch}
                          </p>
                          <span className={`text-xs font-bold ${grade.color}`}>{stat.avgPercent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTop ? 'bg-yellow-400' : stat.avgPercent < 70 ? 'bg-red-500' : 'bg-red-600'}`}
                            style={{ width: `${stat.avgPercent}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-right">ตรวจแล้ว {stat.count} ครั้ง</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // 🎬 Render
  // ==========================================
  return (
    <div className="h-screen w-full bg-gray-200 font-sans sm:p-4 flex justify-center items-center">
      <div className="w-full h-full max-w-md bg-white sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden relative sm:border-[8px] sm:border-gray-900 flex flex-col">
        {currentView === 'home'    && <HomeView />}
        {currentView === 'qc_form' && <QCFormView />}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'stats'   && <StatsView />}
        {currentView === 'detail'  && <DetailView />}

        {notification && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down w-[90%] max-w-[300px]">
            <div className={`px-4 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-3 text-white ${notification.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
              {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              {notification.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
