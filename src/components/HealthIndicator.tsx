import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import type { HealthStatus } from '@/types/sentiment';

export function HealthIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await apiService.checkHealth();
        setHealth(status);
      } catch {
        setHealth({
          status: 'unhealthy',
          model_loaded: false,
          vectorizer_loaded: false,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-mono">Checking...</span>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
        isHealthy 
          ? 'bg-success/10 text-success' 
          : 'bg-destructive/10 text-destructive'
      }`}>
        {isHealthy ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        <span className="font-mono text-xs">
          {isHealthy ? 'API Online' : 'API Offline'}
        </span>
      </div>
      <Activity className={`h-4 w-4 ${isHealthy ? 'text-success animate-pulse' : 'text-destructive'}`} />
    </div>
  );
}
