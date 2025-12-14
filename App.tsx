import React, { useState, useEffect, useRef } from 'react';
import { HealthRecord, Medication, PatientProfile, AppView } from './types';
import DataEntry from './components/DataEntry';
import Analytics from './components/Analytics';
import Medications from './components/Medications';
import Profile from './components/Profile';
import { LayoutDashboard, PlusCircle, Pill, BarChart3, Menu, X, HeartPulse, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('dialysis_records');
    const savedMeds = localStorage.getItem('dialysis_meds');
    const savedProfile = localStorage.getItem('dialysis_profile');
    
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedMeds) setMedications(JSON.parse(savedMeds));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem('dialysis_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('dialysis_meds', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('dialysis_profile', JSON.stringify(profile));
    }
  }, [profile]);

  // Notification Logic
  const lastCheckMinute = useRef<string>('');

  useEffect(() => {
    const checkReminders = () => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const now = new Date();
        const currentMinute = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const todayDate = now.toISOString().split('T')[0];

        // Ensure we only check once per minute
        if (currentMinute === lastCheckMinute.current) return;
        lastCheckMinute.current = currentMinute;

        medications.forEach(med => {
            if (med.reminderTime === currentMinute) {
                // Check if already taken today
                const isTaken = med.lastTakenDate === todayDate && med.takenToday;
                if (!isTaken) {
                    try {
                        new Notification('服药提醒', {
                            body: `时间到了！请服用：${med.name} ${med.dosage}`,
                            icon: '/vite.svg', // Assuming vite.svg exists in public
                            requireInteraction: true,
                        });
                    } catch (e) {
                        console.error("Notification failed", e);
                    }
                }
            }
        });
    };

    const intervalId = setInterval(checkReminders, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, [medications]);


  const addRecord = (recordData: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = {
      ...recordData,
      id: Date.now().toString(),
    };
    setRecords(prev => [...prev, newRecord]);
    setCurrentView(AppView.ANALYTICS); // Redirect to analytics to see result
  };

  const addMedication = (med: Medication) => {
    setMedications(prev => [...prev, med]);
  };

  const deleteMedication = (id: string) => {
    if (window.confirm('确定要删除这个药物提醒吗？')) {
      setMedications(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleMedTaken = (id: string, date: string) => {
    setMedications(prev => prev.map(m => {
      if (m.id === id) {
        // Toggle logic: if already taken today, un-take it. If not, take it.
        const isTakenToday = m.lastTakenDate === date && m.takenToday;
        return {
          ...m,
          takenToday: !isTakenToday,
          lastTakenDate: !isTakenToday ? date : m.lastTakenDate // keep date if unchecking, logic handled by boolean mostly
        };
      }
      return m;
    }));
  };

  const updateProfile = (newProfile: PatientProfile) => {
    setProfile(newProfile);
  };

  const getLastDryWeight = () => {
    if (records.length === 0) return undefined;
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].dryWeight;
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        // Simple dashboard overview
        const latestRecord = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const medsTakenCount = medications.filter(m => m.lastTakenDate === new Date().toISOString().split('T')[0] && m.takenToday).length;
        
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">欢迎回来, {profile?.name || '朋友'}</h1>
                    <p className="opacity-90">今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  {!profile && (
                      <button onClick={() => setCurrentView(AppView.PROFILE)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition">
                          设置个人信息
                      </button>
                  )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-xs opacity-75 mb-1">最近体重</p>
                  <p className="text-2xl font-bold">{latestRecord?.weight || '--'} <span className="text-sm font-normal">kg</span></p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-xs opacity-75 mb-1">最近血压</p>
                  <p className="text-2xl font-bold">{latestRecord ? `${latestRecord.systolic}/${latestRecord.diastolic}` : '--/--'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                   <p className="text-xs opacity-75 mb-1">干体重设定</p>
                   <p className="text-2xl font-bold">{latestRecord?.dryWeight || '--'} <span className="text-sm font-normal">kg</span></p>
                </div>
                 <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                   <p className="text-xs opacity-75 mb-1">今日服药</p>
                   <p className="text-2xl font-bold">{medsTakenCount}/{medications.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button onClick={() => setCurrentView(AppView.ENTRY)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <PlusCircle className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xl text-gray-800">记一笔</h3>
                    <p className="text-gray-500 text-sm">记录今日体重与血压</p>
                  </div>
               </button>

               <button onClick={() => setCurrentView(AppView.MEDICATIONS)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                  <div className="bg-green-100 p-4 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                    <Pill className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xl text-gray-800">服药打卡</h3>
                    <p className="text-gray-500 text-sm">管理和查看今日药物</p>
                  </div>
               </button>
            </div>
          </div>
        );
      case AppView.ENTRY:
        return <DataEntry 
          onAddRecord={addRecord} 
          lastDryWeight={getLastDryWeight()} 
          patientAge={profile?.age}
        />;
      case AppView.ANALYTICS:
        return <Analytics records={records} />;
      case AppView.MEDICATIONS:
        return <Medications 
          medications={medications} 
          onAddMedication={addMedication} 
          onDeleteMedication={deleteMedication}
          onToggleTaken={toggleMedTaken}
        />;
      case AppView.PROFILE:
        return <Profile profile={profile} onSaveProfile={updateProfile} />;
      default:
        return <div>Not found</div>;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full
        ${currentView === view 
          ? 'bg-blue-600 text-white font-medium shadow-md' 
          : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
           <HeartPulse className="w-6 h-6" />
           透析伴侣
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Dropdown (Mobile) */}
      <div className={`
        fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 p-6 z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        flex flex-col
      `}>
        <div className="hidden md:flex items-center gap-2 font-bold text-2xl text-blue-600 mb-10 px-4">
           <HeartPulse className="w-8 h-8" />
           透析伴侣
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="概览首页" />
          <NavItem view={AppView.ENTRY} icon={PlusCircle} label="记录数据" />
          <NavItem view={AppView.MEDICATIONS} icon={Pill} label="吃药提醒" />
          <NavItem view={AppView.ANALYTICS} icon={BarChart3} label="健康分析" />
          <NavItem view={AppView.PROFILE} icon={UserCircle} label="个人信息" />
        </nav>

        <div className="mt-auto px-4 py-4 text-xs text-gray-400 border-t border-gray-100">
          <p>Care v1.0.0</p>
          <p>Made for health</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full md:w-[calc(100vw-256px)]">
         {renderContent()}
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;