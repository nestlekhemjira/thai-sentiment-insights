import type {
  PredictionRequest,
  PredictionResponse,
  ModelInfo,
  HealthStatus,
} from '@/types/sentiment';

// 🟢 FIX 1: ปรับ Base URL ให้เป็นค่าว่าง ''
// เพื่อให้ Browser ใช้โดเมนปัจจุบัน (แก้ปัญหา Mixed Content และ CORS)
// 🟢 FIX 1: ใส่ URL เต็มของ Backend ลงไปเลยครับ
const API_BASE_URL = 'https://deploymodel-thai-sentiment-insights.onrender.com';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ✅ เช็ค Health
  async checkHealth(): Promise<HealthStatus> {
    // 🟢 FIX 2: ใช้ /api/health ให้ตรงกับ Backend (main.py)
    const res = await fetch(`${this.baseUrl}/api/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  // ✅ เช็ค Model Info
  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${this.baseUrl}/model/info`);
    if (!res.ok) throw new Error('Failed to load model info');
    return res.json();
  }

  // ✅ ตัวยิง API (ใส่ Log กันเหนียวไว้ให้เหมือนเดิม)
  async predict(
    request: PredictionRequest
  ): Promise<PredictionResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(
          errorData?.detail || `Prediction failed with status ${res.status}`
        );
      }

      const data = await res.json();
      console.log('API Success Data:', data); // เช็คตรงนี้ถ้ามีปัญหา
      return data;
    } catch (error) {
      console.error('Network or Parsing Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
