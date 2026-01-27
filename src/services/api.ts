import type {
  PredictionRequest,
  PredictionResponse,
  ModelInfo,
  HealthStatus,
} from '@/types/sentiment';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ✅ เช็ค Health
  async checkHealth(): Promise<HealthStatus> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  // ✅ เช็ค Model Info
  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${this.baseUrl}/model/info`);
    if (!res.ok) throw new Error('Failed to load model info');
    return res.json();
  }

  // ✅ ตัวยิง API (ใส่ Log กันเหนียวไว้ให้)
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