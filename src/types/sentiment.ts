export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface PredictionRequest {
  text: string;
}

export interface PredictionResponse {
  label: SentimentLabel;
  confidence: number;
  probabilities: {
    positive: number;
    negative: number;
    neutral: number;
  };
  latency_ms: number;
  preprocessed_text: string;
}

export interface ModelInfo {
  model_name: string;
  version: string;
  vectorizer_type: string;
  classifier_type: string;
  trained_at: string;
  num_classes: number;
  labels: string[];
  accuracy: number;
  f1_score: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  model_loaded: boolean;
  vectorizer_loaded: boolean;
  timestamp: string;
}

export interface ErrorCase {
  id: number;
  input_text: string;
  predicted_label: SentimentLabel;
  actual_label: SentimentLabel;
  confidence: number;
  error_type: string;
}
