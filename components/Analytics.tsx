import React, { useState, useMemo } from 'react';
import { HealthRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { generateHealthAnalysis } from '../services/geminiService';
import { Sparkles, TrendingUp, AlertCircle, Droplets } from 'lucide-react';

interface AnalyticsProps {
  records: HealthRecord[];
}

const Analytics: React.FC<AnalyticsProps> = ({ records }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for filtering
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, selectedMonth]);

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    const result = await generateHealthAnalysis(filteredRecords);
    setAnalysis(result);
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-gray-700">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">选择月份:</span>
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setAnalysis(null); // Clear old analysis
                }}
                className="border border-gray-300 rounded-lg p-2 text-gray-700"
            />
        </div>
        <button
          onClick={handleGenerateAnalysis}
          disabled={loading || filteredRecords.length === 0}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white transition shadow-md
            ${loading || filteredRecords.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
            }`}
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'AI分析中...' : '生成月度智能总结'}
        </button>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI 健康助手分析
            </h3>
            <div className="prose prose-indigo text-gray-700 whitespace-pre-line leading-relaxed">
                {analysis}
            </div>
        </div>
      )}

      {/* Warning for empty data */}
      {filteredRecords.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-gray-500 font-medium">该月份暂无记录</h3>
              <p className="text-gray-400 text-sm mt-1">请前往"记录"页面添加数据</p>
          </div>
      )}

      {filteredRecords.length > 0 && (
        <>
            {/* Weight Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Droplets className="text-blue-500" />
                        体重趋势 (含干体重)
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredRecords} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" name="实际体重" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 6 }} />
                        <Line type="step" name="干体重" dataKey="dryWeight" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-400 mt-4 text-center">
                    * 实际体重高于干体重过多可能意味着体内水分潴留。
                </p>
            </div>

            {/* Blood Pressure Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="text-red-500" />
                        血压波动趋势
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredRecords} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                        <YAxis domain={[40, 200]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36}/>
                        {/* Normal Range Reference Area (Approximate) */}
                        <ReferenceArea y1={80} y2={120} strokeOpacity={0} fill="#ecfdf5" fillOpacity={0.3} />
                        
                        <Line type="monotone" name="收缩压 (高压)" dataKey="systolic" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                        <Line type="monotone" name="舒张压 (低压)" dataKey="diastolic" stroke="#f97316" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Analytics;