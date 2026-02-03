import { GoogleGenAI } from "@google/genai";
import { StatsData } from '../types';

export const analyzeTraffic = async (stats: StatsData, recentLogs: any[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Bạn là trợ lý AI cho Hệ thống Quản lý Rạp chiếu phim.
      
      Dữ liệu hiện tại:
      - Tổng doanh thu: ${stats.totalRevenue.toLocaleString()} VNĐ
      - Người đang truy cập: ${stats.activeUsers}
      - Vé đã bán: ${stats.ticketsSold}
      - Tỷ lệ lấp đầy: ${stats.occupancyRate}%
      
      Logs hệ thống gần đây (3 logs):
      ${JSON.stringify(recentLogs.slice(0, 3))}

      Hãy đưa ra nhận xét ngắn gọn (tối đa 2 câu) bằng Tiếng Việt về tình hình kinh doanh hiện tại. 
      Ví dụ: "Doanh thu đang tăng trưởng tốt..." hoặc "Rạp đang vắng khách...".
      Không dùng markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể phân tích dữ liệu.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Dịch vụ AI đang ngoại tuyến.";
  }
};