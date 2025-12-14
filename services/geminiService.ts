import { GoogleGenAI } from "@google/genai";
import { HealthRecord } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateHealthAnalysis = async (records: HealthRecord[]): Promise<string> => {
  if (!apiKey) {
    return "API Key 未配置，无法生成智能分析。";
  }

  if (records.length === 0) {
    return "尚无足够数据进行分析，请先添加记录。";
  }

  // Sort records by date
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Prepare data string for prompt
  const dataString = sortedRecords.map(r => 
    `日期: ${r.date}, 体重: ${r.weight}kg, 干体重: ${r.dryWeight}kg, 脱水量: ${r.fluidRemoval ? r.fluidRemoval + 'kg' : '无记录'}, 收缩压: ${r.systolic}, 舒张压: ${r.diastolic}`
  ).join('\n');

  const prompt = `
    你是一位专业的肾内科透析专家助手。请根据以下患者最近的记录生成一份简短的月度健康总结（使用中文）。
    
    重点关注：
    1. 体重控制：实际体重与干体重的差距（透析间期体重增长IDWG）。
    2. 液体管理：特别注意“脱水量”数据。如果某次脱水量超过干体重的5%，请给予特别提醒和建议。
    3. 血压控制：是否存在高血压或低血压趋势，是否与脱水量过大有关。
    4. 给出1-2条具体的健康建议（饮食、控水或休息）。
    
    语气：温暖、鼓励、专业。
    
    患者数据:
    ${dataString}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "无法生成分析，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成分析时发生错误，请检查网络连接。";
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing for transcription");
    return "";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "请将这段语音转录为文字。如果是透析患者描述症状（如头晕、抽筋、水肿等）或饮食情况，请确保医学术语准确。直接输出识别后的文字，不要包含任何开场白或解释。"
          }
        ]
      }
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    return ""; // Return empty string on error to avoid breaking UI flow
  }
};