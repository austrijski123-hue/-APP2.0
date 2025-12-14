import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { User, Save, Calendar, Clock } from 'lucide-react';

interface ProfileProps {
  profile: PatientProfile | null;
  onSaveProfile: (profile: PatientProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [dialysisAge, setDialysisAge] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(profile.age.toString());
      setDialysisAge(profile.dialysisAge?.toString() || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name,
      age: parseInt(age),
      dialysisAge: dialysisAge ? parseInt(dialysisAge) : undefined,
    });
    alert('个人信息已更新');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">个人信息设置</h2>
          <p className="text-gray-500 text-sm">完善信息有助于提供更精准的健康预警</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">您的称呼</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">年龄 (岁)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="number"
              required
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="用于判断血压正常范围"
              className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            * 系统将根据您的年龄自动调整高血压预警标准（≥65岁适用老年标准）。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">透析龄 (月) - 选填</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="number"
              min="0"
              step="1"
              value={dialysisAge}
              onChange={(e) => setDialysisAge(e.target.value)}
              placeholder="您透析了多少个月？"
              className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 mt-4"
        >
          <Save className="w-5 h-5" />
          保存信息
        </button>
      </form>
    </div>
  );
};

export default Profile;