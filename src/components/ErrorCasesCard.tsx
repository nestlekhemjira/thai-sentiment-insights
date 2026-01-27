import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ErrorCase, SentimentLabel } from '@/types/sentiment';

const labelColors: Record<SentimentLabel, string> = {
  positive: 'bg-success/10 text-success',
  negative: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
};

export function ErrorCasesCard() {
  const [cases, setCases] = useState<ErrorCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await apiService.getErrorCases();
        setCases(data);
      } catch (error) {
        console.error('Failed to fetch error cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Error Cases</h2>
          <p className="text-sm text-muted-foreground">Example misclassifications</p>
        </div>
      </div>

      <div className="space-y-3">
        {cases.map((errorCase) => (
          <div 
            key={errorCase.id} 
            className="p-4 rounded-xl bg-muted/30 border border-border space-y-3 hover:bg-muted/50 transition-colors"
          >
            <p className="text-sm font-thai text-foreground leading-relaxed">
              "{errorCase.input_text}"
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${labelColors[errorCase.predicted_label]}`}>
                Predicted: {errorCase.predicted_label}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${labelColors[errorCase.actual_label]}`}>
                Actual: {errorCase.actual_label}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {errorCase.error_type}
              </span>
              <span className="font-mono text-muted-foreground">
                Confidence: {(errorCase.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
