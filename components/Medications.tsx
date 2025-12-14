import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { Pill, Plus, Check, Trash2, Clock, AlertCircle, Bell, BellRing } from 'lucide-react';

interface MedicationsProps {
  medications: Medication[];
  onAddMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
  onToggleTaken: (id: string, date: string) => void;
}

const Medications: React.FC<MedicationsProps> = ({ 
  medications, 
  onAddMedication, 
  onDeleteMedication, 
  onToggleTaken 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('每日一次');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = () => {
    if (!('Notification' in window)) {
      alert("您的浏览器不支持通知功能");
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('透析伴侣', { body: '服药提醒已开启' });
      }
    });
  };

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medication = {
      id: Date.now().toString(),
      name: newName,
      dosage: newDosage,
      frequency: newFrequency,
      reminderTime: newReminderTime || undefined,
      takenToday: false,
      lastTakenDate: ''
    };
    onAddMedication(newMed);
    setNewName('');
    setNewDosage('');
    setNewReminderTime('');
    setShowAddForm(false);
  };

  const isTakenToday = (med: Medication) => {
    return med.lastTakenDate === today && med.takenToday;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6" />
            今日服药清单
          </h2>
          <p className="text-blue-100 mt-1">按时服药是控制病情的关键</p>
          
          {notificationPermission === 'default' && (
             <button 
               onClick={requestPermission}
               className="mt-3 text-xs bg-blue-500 hover:bg-blue-400 text-white py-1 px-3 rounded-full flex items-center gap-1 transition"
             >
               <BellRing className="w-3 h-3" /> 开启到点提醒
             </button>
          )}
           {notificationPermission === 'denied' && (
             <p className="mt-2 text-xs text-red-200 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> 请在浏览器设置中开启通知权限以接收提醒
             </p>
          )}
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
            <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 transition shadow-md"
            >
            <Plus className={`w-6 h-6 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
            </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 animate-fade-in">
          <h3 className="font-bold text-gray-700 mb-4">添加新药物</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="药品名称 (如: 碳酸钙)"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl w-full"
            />
            <input
              type="text"
              placeholder="剂量 (如: 1片)"
              required
              value={newDosage}
              onChange={(e) => setNewDosage(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl w-full"
            />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                className="p-3 border border-gray-300 rounded-xl w-full bg-white"
                >
                <option>每日一次</option>
                <option>每日两次</option>
                <option>每日三次</option>
                <option>透析随餐</option>
                <option>睡前</option>
                </select>
                
                <div className="relative">
                    <Clock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="pl-10 p-3 border border-gray-300 rounded-xl w-full text-gray-700"
                        title="设置提醒时间"
                    />
                </div>
            </div>
            {newReminderTime && (
                <p className="text-xs text-blue-600 col-span-full flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    将于每天 {newReminderTime} 发送提醒
                </p>
            )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            确认添加
          </button>
        </form>
      )}

      <div className="space-y-3">
        {medications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无药物提醒，请点击右上方按钮添加</p>
          </div>
        ) : (
          medications.map(med => {
            const taken = isTakenToday(med);
            return (
              <div 
                key={med.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                  ${taken ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => onToggleTaken(med.id, today)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors
                      ${taken ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                    `}
                  >
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${taken ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                      {med.name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{med.dosage}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {med.frequency}
                      </span>
                      {med.reminderTime && (
                        <span className={`flex items-center gap-1 text-xs ${taken ? 'text-green-600' : 'text-blue-600 font-medium'}`}>
                            <Bell className="w-3 h-3" /> {med.reminderTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => onDeleteMedication(med.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition"
                  title="删除药物"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Medications;