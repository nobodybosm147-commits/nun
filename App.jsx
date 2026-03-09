import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  History, 
  Store, 
  User, 
  ChevronLeft, 
  Save, 
  CheckCircle,
  AlertCircle,
  Star,
  Utensils,
  Droplets,
  Smile,
  BarChart3
} from 'lucide-react';

// ==========================================
// ⚙️ การตั้งค่าระบบ
// ==========================================
// นำ URL ที่ได้จาก Google Apps Script มาใส่ที่นี่ (ปล่อยว่างไว้เพื่อทดสอบด้วยระบบ Local Storage)
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycby7UVjvmJmpLUta2mp6wkgNo0AQqWP1ChzTnRgGGnIFazZeBY75Ce5CfrWntqA5YHcc/exec'; 

// รายชื่อสาขา
const BRANCHES = ['สาขาอ้อมเมือง', 'สาขาสันป่าข่อย', 'สาขาสันทราย', 'สาขาบ่อสร้าง', 'สาขากาดแม่หยวก'];

// ==========================================
// 📦 Components ย่อย
// ==========================================

// Component: แถบเมนูด้านบน
const Header = ({ title, showBack, onBack }) => (
  <header className="bg-red-600 text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
    <div className="flex items-center">
      {showBack && (
        <button onClick={onBack} className="mr-3 p-1 hover:bg-red-700 rounded-full transition">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold tracking-wide">{title}</h1>
    </div>
    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
      <img src="/QC/logo.jpg" alt="logo" className="w-full h-full object-cover" />
    </div>
  </header>
);

// Component: ปุ่มให้คะแนน 1-5
const RatingGroup = ({ label, icon: Icon, value, onChange }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
    <div className="flex items-center mb-3 text-gray-800 font-medium">
      <div className="bg-red-50 p-2 rounded-lg mr-3 text-red-600">
        <Icon size={20} />
      </div>
      {label}
    </div>
    <div className="flex justify-between gap-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
            value === num 
              ? 'bg-red-600 text-white shadow-md transform scale-105' 
              : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
    <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
      <span>ปรับปรุงด่วน</span>
      <span>ดีเยี่ยม</span>
    </div>
  </div>
);

// ==========================================
// 🚀 Main Application
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'qc_form', 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    branch: '',
    auditor: '',
    riceScore: 5,
    chickenScore: 5,
    soupScore: 5,
    sauceScore: 5,
    cleanScore: 5,
    serviceScore: 5,
    remark: ''
  });

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 📝 ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async () => {
    if (!formData.branch || !formData.auditor) {
      showNotification('กรุณาระบุสาขาและชื่อผู้ตรวจ', 'error');
      return;
    }

    setIsLoading(true);
    const payload = {
      ...formData,
      date: new Date().toISOString(),
      totalScore: formData.riceScore + formData.chickenScore + formData.soupScore + 
                  formData.sauceScore + formData.cleanScore + formData.serviceScore,
      maxScore: 30
    };

    try {
      if (GOOGLE_SHEET_API_URL) {
        // ส่งไป Google Sheets
        await fetch(GOOGLE_SHEET_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Mock System: บันทึกลง Local Storage หากไม่ได้ตั้งค่า API
        const existing = JSON.parse(localStorage.getItem('qc_mock_db') || '[]');
        localStorage.setItem('qc_mock_db', JSON.stringify([payload, ...existing]));
      }

      showNotification('บันทึกผลตรวจสอบเรียบร้อยแล้ว');
      setCurrentView('home');
      // รีเซ็ตฟอร์มบางส่วน
      setFormData(prev => ({ ...prev, remark: '', riceScore: 5, chickenScore: 5, soupScore: 5, sauceScore: 5, cleanScore: 5, serviceScore: 5 }));
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 ฟังก์ชันดึงประวัติ
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      if (GOOGLE_SHEET_API_URL) {
        const res = await fetch(GOOGLE_SHEET_API_URL);
        const data = await res.json();
        setHistoryData(data.reverse()); // ล่าสุดขึ้นก่อน
      } else {
        // Mock System
        const data = JSON.parse(localStorage.getItem('qc_mock_db') || '[]');
        setHistoryData(data);
      }
    } catch (error) {
      showNotification('ไม่สามารถดึงข้อมูลประวัติได้', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 📱 Views
  // ==========================================

  // View: หน้าแรก (Home)
  const HomeView = () => (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="QC ข้าวมันไก่" showBack={false} />
      
      <div className="p-6 flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full mb-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ClipboardCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ระบบควบคุมคุณภาพ</h2>
          <p className="text-gray-500 text-sm mb-6">บันทึกและติดตามมาตรฐานร้านข้าวมันไก่<br/>เพื่อคุณภาพที่ดีที่สุด</p>
          
          <button 
            onClick={() => setCurrentView('qc_form')}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ClipboardCheck size={20} />
            เริ่มตรวจคุณภาพ (QC)
          </button>
        </div>

        <div className="w-full flex gap-3 mb-4">
          <button 
            onClick={() => {
              fetchHistory();
              setCurrentView('stats');
            }}
            className="flex-1 bg-white text-gray-700 font-semibold py-4 rounded-xl shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:transform active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
          >
            <BarChart3 size={24} className="text-red-500" />
            <span className="text-sm">สถิติสาขา</span>
          </button>

          <button 
            onClick={() => {
              fetchHistory();
              setCurrentView('history');
            }}
            className="flex-1 bg-white text-gray-700 font-semibold py-4 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 active:transform active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
          >
            <History size={24} className="text-gray-400" />
            <span className="text-sm">ประวัติการตรวจ</span>
          </button>
        </div>

        {!GOOGLE_SHEET_API_URL && (
          <div className="mt-4 text-xs text-orange-500 bg-orange-50 p-3 rounded-lg flex items-start gap-2 text-left">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p>ขณะนี้ระบบทำงานในโหมด Offline (Local Storage) หากต้องการบันทึกข้อมูลจริง กรุณาตั้งค่า GOOGLE_SHEET_API_URL ในโค้ด</p>
          </div>
        )}
      </div>
    </div>
  );

  // View: ฟอร์มตรวจสอบ (QC Form)
  const QCFormView = () => (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="แบบฟอร์มตรวจสอบ" showBack={true} onBack={() => setCurrentView('home')} />
      
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full pb-24">
        {/* ข้อมูลเบื้องต้น */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="mb-4">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Store size={16} className="mr-2 text-red-600" /> สาขาที่ตรวจ
            </label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              value={formData.branch}
              onChange={(e) => setFormData({...formData, branch: e.target.value})}
            >
              <option value="">-- เลือกสาขา --</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <User size={16} className="mr-2 text-red-600" /> ชื่อผู้ตรวจ
            </label>
            <input 
              type="text" 
              placeholder="ระบุชื่อพนักงาน QC"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              value={formData.auditor}
              onChange={(e) => setFormData({...formData, auditor: e.target.value})}
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-500 mb-3 px-2 uppercase tracking-wider">คุณภาพอาหาร</h3>
        <RatingGroup 
          label="ข้าวมัน (หอม นุ่ม ร่วน ไม่แฉะ)" 
          icon={Utensils} 
          value={formData.riceScore} 
          onChange={(v) => setFormData({...formData, riceScore: v})} 
        />
        <RatingGroup 
          label="เนื้อไก่ (นุ่ม สุกพอดี หนังตึง ไม่คาว)" 
          icon={Utensils} 
          value={formData.chickenScore} 
          onChange={(v) => setFormData({...formData, chickenScore: v})} 
        />
        <RatingGroup 
          label="น้ำซุป (ร้อน รสชาติกลมกล่อม)" 
          icon={Droplets} 
          value={formData.soupScore} 
          onChange={(v) => setFormData({...formData, soupScore: v})} 
        />
        <RatingGroup 
          label="น้ำจิ้ม (รสชาติตามมาตรฐาน ไม่บูด)" 
          icon={Droplets} 
          value={formData.sauceScore} 
          onChange={(v) => setFormData({...formData, sauceScore: v})} 
        />

        <h3 className="text-sm font-bold text-gray-500 mb-3 mt-6 px-2 uppercase tracking-wider">การจัดการร้าน</h3>
        <RatingGroup 
          label="ความสะอาด (ครัว, โต๊ะ, อุปกรณ์)" 
          icon={Star} 
          value={formData.cleanScore} 
          onChange={(v) => setFormData({...formData, cleanScore: v})} 
        />
        <RatingGroup 
          label="การบริการ (ความรวดเร็ว, มารยาท)" 
          icon={Smile} 
          value={formData.serviceScore} 
          onChange={(v) => setFormData({...formData, serviceScore: v})} 
        />

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">ข้อเสนอแนะเพิ่มเติม</label>
          <textarea 
            rows="3"
            placeholder="ระบุปัญหาที่พบ หรือสิ่งที่ต้องปรับปรุง..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
            value={formData.remark}
            onChange={(e) => setFormData({...formData, remark: e.target.value})}
          ></textarea>
        </div>
      </div>

      {/* ปุ่ม Submit ลอยอยู่ด้านล่าง */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all
              ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'}
            `}
          >
            {isLoading ? (
              <span className="animate-pulse">กำลังบันทึกข้อมูล...</span>
            ) : (
              <>
                <Save size={20} />
                บันทึกผลตรวจสอบ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // View: หน้าประวัติ (History)
  const HistoryView = () => (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="ประวัติการตรวจสอบ" showBack={true} onBack={() => setCurrentView('home')} />
      
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <History size={48} className="mx-auto mb-4 opacity-20" />
            <p>ยังไม่มีประวัติการตรวจสอบ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData.map((item, index) => {
              const scorePercent = Math.round((item.totalScore / item.maxScore) * 100);
              const isGood = scorePercent >= 80;
              
              return (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 flex items-center gap-1">
                        <Store size={14} className="text-red-600" />
                        {item.branch}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.date).toLocaleDateString('th-TH', { 
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })} น.
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                      isGood ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {isGood ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {scorePercent}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-3">
                    <div className="flex justify-between"><span>ข้าวมัน:</span> <b>{item.riceScore}/5</b></div>
                    <div className="flex justify-between"><span>ไก่:</span> <b>{item.chickenScore}/5</b></div>
                    <div className="flex justify-between"><span>น้ำซุป:</span> <b>{item.soupScore}/5</b></div>
                    <div className="flex justify-between"><span>น้ำจิ้ม:</span> <b>{item.sauceScore}/5</b></div>
                    <div className="flex justify-between"><span>ความสะอาด:</span> <b>{item.cleanScore}/5</b></div>
                    <div className="flex justify-between"><span>บริการ:</span> <b>{item.serviceScore}/5</b></div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-gray-500">
                      <span className="text-xs">ผู้ตรวจ:</span> {item.auditor}
                    </div>
                    {item.remark && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md max-w-[50%] truncate">
                        "{item.remark}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // View: หน้าสถิติ (Statistics)
  const StatsView = () => {
    // คำนวณสถิติ
    const branchStats = React.useMemo(() => {
      const stats = {};
      historyData.forEach(item => {
        if (!stats[item.branch]) {
          stats[item.branch] = { totalScore: 0, maxScore: 0, count: 0 };
        }
        stats[item.branch].totalScore += item.totalScore;
        stats[item.branch].maxScore += item.maxScore;
        stats[item.branch].count += 1;
      });

      // แปลง object เป็น array และเรียงลำดับตามคะแนนเฉลี่ย
      return Object.keys(stats).map(branch => ({
        branch,
        avgPercent: Math.round((stats[branch].totalScore / stats[branch].maxScore) * 100),
        count: stats[branch].count
      })).sort((a, b) => b.avgPercent - a.avgPercent);
    }, [historyData]);

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="สถิติคุณภาพแต่ละสาขา" showBack={true} onBack={() => setCurrentView('home')} />
        
        <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : branchStats.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
              <p>ยังไม่มีข้อมูลสำหรับคำนวณสถิติ</p>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {/* Card สรุปภาพรวม */}
              <div className="bg-red-600 text-white p-5 rounded-2xl shadow-md mb-6 flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">จำนวนการตรวจทั้งหมด</p>
                  <h3 className="text-3xl font-bold">{historyData.length} <span className="text-lg font-normal">ครั้ง</span></h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardCheck size={24} className="text-white" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">คะแนนเฉลี่ยรายสาขา</h3>
              
              {branchStats.map((stat, index) => {
                const isGood = stat.avgPercent >= 80;
                const isWarning = stat.avgPercent < 60;
                
                return (
                  <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        {index === 0 && <span className="text-yellow-500"><Star size={16} fill="currentColor" /></span>}
                        {stat.branch}
                      </h4>
                      <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
                        ตรวจ {stat.count} ครั้ง
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isGood ? 'bg-green-500' : isWarning ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${stat.avgPercent}%` }}
                        ></div>
                      </div>
                      <div className={`text-sm font-bold w-10 text-right ${
                        isGood ? 'text-green-600' : isWarning ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {stat.avgPercent}%
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

  return (
    <div className="h-screen w-full bg-gray-100 font-sans sm:p-4 md:p-8 flex justify-center items-center">
      {/* Mobile Frame Container */}
      <div className="w-full h-full max-w-md bg-white sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden relative sm:border-[8px] sm:border-gray-900 flex flex-col">
        
        {/* View Router */}
        {currentView === 'home' && <HomeView />}
        {currentView === 'qc_form' && <QCFormView />}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'stats' && <StatsView />}

        {/* Global Notification Toast */}
        {notification && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
            <div className={`px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'
            }`}>
              {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {notification.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}