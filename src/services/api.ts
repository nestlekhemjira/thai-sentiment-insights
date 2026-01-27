import type { PredictionRequest, PredictionResponse, ModelInfo, HealthStatus, ErrorCase } from '@/types/sentiment';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<HealthStatus> {
    // Mock response for demo
    return {
      status: 'healthy',
      model_loaded: true,
      vectorizer_loaded: true,
      timestamp: new Date().toISOString(),
    };
  }

  async getModelInfo(): Promise<ModelInfo> {
    // Mock response for demo
    return {
      model_name: 'Thai Sentiment Classifier',
      version: '1.0.0',
      vectorizer_type: 'TF-IDF',
      classifier_type: 'Logistic Regression',
      trained_at: '2024-01-15T10:30:00Z',
      num_classes: 3,
      labels: ['positive', 'negative', 'neutral'],
      accuracy: 0.847,
      f1_score: 0.832,
    };
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    // Mock prediction for demo - simulates real model behavior
    const startTime = performance.now();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    const text = request.text.toLowerCase();
    let label: 'positive' | 'negative' | 'neutral';
    let confidence: number;
    
    // Simple keyword-based mock classification
    const positiveWords = ['ดี', 'สุด', 'ชอบ', 'รัก', 'เยี่ยม', 'สวย', 'เก่ง', 'ขอบคุณ', 'ยอด', 'ประทับใจ'];
    const negativeWords = ['แย่', 'เกลียด', 'ไม่ดี', 'ห่วย', 'ผิดหวัง', 'เศร้า', 'โกรธ', 'เบื่อ', 'ซึ้ง'];
    
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
    
    if (hasPositive && !hasNegative) {
      label = 'positive';
      confidence = 0.75 + Math.random() * 0.2;
    } else if (hasNegative && !hasPositive) {
      label = 'negative';
      confidence = 0.70 + Math.random() * 0.25;
    } else if (hasPositive && hasNegative) {
      label = 'neutral';
      confidence = 0.55 + Math.random() * 0.2;
    } else {
      label = 'neutral';
      confidence = 0.60 + Math.random() * 0.15;
    }

    const endTime = performance.now();
    
    // Generate mock probabilities
    const remaining = 1 - confidence;
    const otherLabels = ['positive', 'negative', 'neutral'].filter(l => l !== label) as Array<'positive' | 'negative' | 'neutral'>;
    const split = Math.random() * remaining;
    
    const probabilities = {
      positive: label === 'positive' ? confidence : (otherLabels[0] === 'positive' ? split : remaining - split),
      negative: label === 'negative' ? confidence : (otherLabels[0] === 'negative' ? split : remaining - split),
      neutral: label === 'neutral' ? confidence : (otherLabels[0] === 'neutral' ? split : remaining - split),
    };

    return {
      label,
      confidence,
      probabilities,
      latency_ms: endTime - startTime,
      preprocessed_text: text.replace(/\s+/g, ' ').trim(),
    };
  }

  async getErrorCases(): Promise<ErrorCase[]> {
    // Mock error cases for demo
    return [
      {
        id: 1,
        input_text: 'อาหารอร่อยมากแต่บริการช้า',
        predicted_label: 'positive',
        actual_label: 'neutral',
        confidence: 0.72,
        error_type: 'Mixed sentiment',
      },
      {
        id: 2,
        input_text: 'ไม่เลวเลยนะ',
        predicted_label: 'negative',
        actual_label: 'positive',
        confidence: 0.68,
        error_type: 'Negation handling',
      },
      {
        id: 3,
        input_text: 'สินค้าโอเคแต่ส่งผิด',
        predicted_label: 'neutral',
        actual_label: 'negative',
        confidence: 0.61,
        error_type: 'Context-dependent',
      },
    ];
  }
}

export const apiService = new ApiService();
