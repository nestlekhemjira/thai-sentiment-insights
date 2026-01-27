import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  FileText,
} from 'lucide-react';
import type { PredictionResponse, SentimentLabel } from '@/types/sentiment';
import { Progress } from '@/components/ui/progress';
import type { ElementType } from 'react';

interface ResultDisplayProps {
  result: PredictionResponse | null;
}

const sentimentConfig: Record<
  SentimentLabel,
  {
    icon: ElementType;
    label: string;
    thaiLabel: string;
    className: string;
  }
> = {
  positive: {
    icon: TrendingUp,
    label: 'Positive',
    thaiLabel: 'บวก',
    className: 'sentiment-positive text-white',
  },
  negative: {
    icon: TrendingDown,
    label: 'Negative',
    thaiLabel: 'ลบ',
    className: 'sentiment-negative text-white',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    thaiLabel: 'กลาง',
    className: 'sentiment-neutral text-white',
  },
};

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ผลลัพธ์จะแสดงที่นี่</p>
          <p className="text-xs mt-1">Results will appear here</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: กันจอขาว 1 (ถ้า label มาผิด ให้ปัดเป็น neutral)
  const safeLabel: SentimentLabel =
    result.label && sentimentConfig[result.label]
      ? result.label
      : 'neutral';

  const config = sentimentConfig[safeLabel];
  const Icon = config.icon;

  // ✅ FIX: กันจอขาว 2 (ถ้า probabilities ไม่มี ให้ใส่ค่าว่าง)
  const probabilities = result.probabilities || {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  // ✅ FIX: สร้าง List ลำดับคงที่ กัน Loop พัง
  const orderedLabels: SentimentLabel[] = ['positive', 'neutral', 'negative'];

  return (
    <div className="card-glow p-6 space-y-6 animate-scale-in">
      {/* Main Result */}
      <div className="text-center space-y-4">
        <div
          className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${config.className}`}
        >
          <Icon className="h-6 w-6" />
          <div className="text-left">
            <p className="text-lg font-bold">{config.thaiLabel}</p>
            <p className="text-xs opacity-90">{config.label}</p>
          </div>
        </div>

        <div>
          <p className="text-4xl font-bold font-mono text-foreground">
            {((result.confidence || 0) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">Confidence Score</p>
        </div>
      </div>

      {/* Probability Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Probability Distribution
        </h3>

        {/* ใช้ orderedLabels แทน Object.keys เพื่อความชัวร์ */}
        {orderedLabels.map((label) => {
          const prob = probabilities[label] || 0; // กันค่า null

          return (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span
                  className={
                    label === safeLabel
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {sentimentConfig[label].thaiLabel}{' '}
                  <span className="text-xs opacity-70">
                    ({sentimentConfig[label].label})
                  </span>
                </span>
                <span className="font-mono text-xs">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>

              <Progress
                value={prob * 100}
                className={`h-2 ${
                  label === safeLabel ? '' : 'opacity-50'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Latency */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Inference Time</span>
        </div>
        <span className="font-mono text-sm font-medium text-foreground">
          {Math.round(result.latency_ms || 0)} ms
        </span>
      </div>

      {/* Preprocessed Text */}
      {result.preprocessed_text && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Preprocessed Input
          </p>
          <p className="text-sm font-thai bg-muted/50 p-3 rounded-lg">
            {result.preprocessed_text}
          </p>
        </div>
      )}
    </div>
  );
}