import React, { useState, useRef, useMemo } from 'react';
import { HealthRecord } from '../types';
import { Save, Calendar, Activity, Scale, Mic, Square, Loader2, Droplets, AlertTriangle } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface DataEntryProps {
  onAddRecord: (record: Omit<HealthRecord, 'id'>) => void;
  lastDryWeight?: number;
  patientAge?: number;
}

const DataEntry: React.FC<DataEntryProps> = ({ onAddRecord, lastDryWeight, patientAge }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [dryWeight, setDryWeight] = useState(lastDryWeight?.toString() || '');
  const [fluidRemoval, setFluidRemoval] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fluid Warning Logic
  const showFluidWarning = useMemo(() => {
    const dw = parseFloat(dryWeight);
    const fr = parseFloat(fluidRemoval);
    if (!isNaN(dw) && !isNaN(fr) && dw > 0) {
      return (fr / dw) > 0.05;
    }
    return false;
  }, [dryWeight, fluidRemoval]);

  // Blood Pressure Warning Logic
  const bpStatus = useMemo(() => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    if (isNaN(sys) || isNaN(dia)) return null;

    // Hypotension (Low BP) - Dangerous for dialysis
    if (sys < 90 || dia < 60) {
      return {
        type: 'danger',
        message: '血压偏低 (低血压)',
        detail: '透析中或透析后低血压风险极高，请立即停止脱水并咨询医生。'
      };
    }

    // Hypertension (High BP)
    // Default threshold (Adults)
    let sysLimit = 140;
    let diaLimit = 90;

    // Elderly threshold (>65)
    if (patientAge && patientAge >= 65) {
      sysLimit = 150;
      diaLimit = 90; // JNC 8 recommends slightly looser control for elderly
    }

    if (sys > sysLimit || dia > diaLimit) {
      return {
        type: 'warning',
        message: '血压偏高',
        detail: patientAge && patientAge >= 65 
            ? `针对${patientAge}岁患者，收缩压>${sysLimit}或舒张压>${diaLimit}属于偏高范围。`
            : `收缩压>${sysLimit}或舒张压>${diaLimit}属于偏高范围，请注意控制盐分和水分摄入。`
      };
    }

    return null;
  }, [systolic, diastolic, patientAge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecord({
      date,
      weight: parseFloat(weight),
      dryWeight: parseFloat(dryWeight),
      fluidRemoval: fluidRemoval ? parseFloat(fluidRemoval) : undefined,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      notes
    });
    // Reset crucial fields but keep dry weight as it usually stays similar
    setWeight('');
    setFluidRemoval('');
    setSystolic('');
    setDiastolic('');
    setNotes('');
    alert('记录已保存');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          if (base64Data) {
            const text = await transcribeAudio(base64Data, mimeType);
            if (text) {
              setNotes(prev => {
                const newNote = prev ? `${prev} ${text}` : text;
                return newNote;
              });
            }
          }
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop());
        };
        
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("无法访问麦克风，请检查权限设置。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Activity className="text-blue-600" />
        今日记录
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 flex items-center gap-2">
              <Scale className="w-4 h-4" /> 体重与容量 (kg)
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-xs text-gray-500 mb-1">透析前体重</label>
                <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">设定干体重</label>
                <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={dryWeight}
                    onChange={(e) => setDryWeight(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg bg-gray-50"
                />
                </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                 <Droplets className="w-3 h-3 text-blue-400" /> 
                 今日脱水量 (L/kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={fluidRemoval}
                onChange={(e) => setFluidRemoval(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none text-lg transition
                    ${showFluidWarning 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50 text-red-900' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
              />
              {showFluidWarning && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-fade-in">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 font-medium">
                          警示：脱水量已超过干体重的5%。<br/>
                          <span className="text-xs font-normal opacity-90">过多脱水可能导致低血压、抽筋或心血管风险，请务必咨询医生。</span>
                      </p>
                  </div>
              )}
            </div>
          </div>

          {/* BP Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 血压数据 (mmHg)
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">收缩压 (高压)</label>
              <input
                type="number"
                required
                placeholder="120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none text-lg
                  ${bpStatus ? 'border-orange-300 focus:ring-2 focus:ring-orange-500' : 'border-gray-300 focus:ring-2 focus:ring-red-500'}`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">舒张压 (低压)</label>
              <input
                type="number"
                required
                placeholder="80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none text-lg
                  ${bpStatus ? 'border-orange-300 focus:ring-2 focus:ring-orange-500' : 'border-gray-300 focus:ring-2 focus:ring-red-500'}`}
              />
            </div>
            {bpStatus && (
                <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 animate-fade-in
                    ${bpStatus.type === 'danger' ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'}
                `}>
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5
                        ${bpStatus.type === 'danger' ? 'text-red-600' : 'text-orange-500'}
                    `} />
                    <div>
                        <p className={`text-sm font-bold ${bpStatus.type === 'danger' ? 'text-red-700' : 'text-orange-700'}`}>
                            {bpStatus.message}
                        </p>
                        <p className={`text-xs ${bpStatus.type === 'danger' ? 'text-red-600' : 'text-orange-600'}`}>
                            {bpStatus.detail}
                        </p>
                    </div>
                </div>
            )}
            {!patientAge && (systolic || diastolic) && (
               <p className="text-xs text-gray-400 italic">
                 提示：在"个人信息"中设置年龄可获得更精准的血压预警。
               </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
             备注 (可选)
             {isTranscribing && <span className="text-xs text-blue-600 flex items-center animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> 正在转文字...</span>}
          </label>
          <div className="relative">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none pr-12"
                placeholder="例如：今日感觉疲劳，或者有水肿现象... (支持语音输入)"
            />
            <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 
                    ${isRecording 
                        ? 'bg-red-500 text-white animate-pulse scale-110' 
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                    }
                    ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={isRecording ? "停止录音" : "点击语音输入"}
            >
                {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                    <Square className="w-5 h-5 fill-current" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          保存记录
        </button>
      </form>
    </div>
  );
};

export default DataEntry;