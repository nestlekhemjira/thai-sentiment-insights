import { useEffect, useState } from 'react';
import { Brain, Calendar, Target, Layers, Tag, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ModelInfo } from '@/types/sentiment';

export function ModelInfoCard() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await apiService.getModelInfo();
        setInfo(data);
      } catch (error) {
        console.error('Failed to fetch model info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!info) return null;

  const stats = [
    { 
      icon: Brain, 
      label: 'Classifier', 
      value: info.classifier_type,
      subValue: info.vectorizer_type,
    },
    { 
      icon: Target, 
      label: 'Accuracy', 
      value: `${(info.accuracy * 100).toFixed(1)}%`,
      subValue: `F1: ${(info.f1_score * 100).toFixed(1)}%`,
    },
    { 
      icon: Layers, 
      label: 'Classes', 
      value: info.num_classes.toString(),
      subValue: info.labels.join(', '),
    },
    { 
      icon: Calendar, 
      label: 'Trained', 
      value: new Date(info.trained_at).toLocaleDateString(),
      subValue: `v${info.version}`,
    },
  ];

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-accent">
          <Tag className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Model Information</h2>
          <p className="text-sm text-muted-foreground font-mono">{info.model_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold font-mono text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subValue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
