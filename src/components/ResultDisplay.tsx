import { TrendingUp, TrendingDown, Minus, Clock, FileText } from 'lucide-react';
import type { PredictionResponse, SentimentLabel } from '@/types/sentiment';
import { Progress } from '@/components/ui/progress';

interface ResultDisplayProps {
  result: PredictionResponse | null;
}

const sentimentConfig: Record<SentimentLabel, {
  icon: React.ElementType;
  label: string;
  thaiLabel: string;
  className: string;
  bgClass: string;
}> = {
  positive: {
    icon: TrendingUp,
    label: 'Positive',
    thaiLabel: 'บวก',
    className: 'sentiment-positive text-white',
    bgClass: 'bg-success/10 text-success',
  },
  negative: {
    icon: TrendingDown,
    label: 'Negative',
    thaiLabel: 'ลบ',
    className: 'sentiment-negative text-white',
    bgClass: 'bg-destructive/10 text-destructive',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    thaiLabel: 'กลาง',
    className: 'sentiment-neutral text-white',
    bgClass: 'bg-muted text-muted-foreground',
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

  const config = sentimentConfig[result.label];
  const Icon = config.icon;

  return (
    <div className="card-glow p-6 space-y-6 animate-scale-in">
      {/* Main Result */}
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${config.className}`}>
          <Icon className="h-6 w-6" />
          <div className="text-left">
            <p className="text-lg font-bold">{config.thaiLabel}</p>
            <p className="text-xs opacity-90">{config.label}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-4xl font-bold font-mono text-foreground">
            {(result.confidence * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">Confidence Score</p>
        </div>
      </div>

      {/* Probability Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Probability Distribution</h3>
        
        {Object.entries(result.probabilities).map(([label, prob]) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className={`font-medium ${
                label === result.label ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {sentimentConfig[label as SentimentLabel].thaiLabel}
                <span className="text-xs ml-1 opacity-70">
                  ({sentimentConfig[label as SentimentLabel].label})
                </span>
              </span>
              <span className="font-mono text-xs">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={prob * 100} 
              className={`h-2 ${label === result.label ? '' : 'opacity-50'}`}
            />
          </div>
        ))}
      </div>

      {/* Latency */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Inference Time</span>
        </div>
        <span className="font-mono text-sm font-medium text-foreground">
          {result.latency_ms.toFixed(0)}ms
        </span>
      </div>

      {/* Preprocessed Text */}
      {result.preprocessed_text && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Preprocessed Input:</p>
          <p className="text-sm font-thai bg-muted/50 p-3 rounded-lg">
            {result.preprocessed_text}
          </p>
        </div>
      )}
    </div>
  );
}
