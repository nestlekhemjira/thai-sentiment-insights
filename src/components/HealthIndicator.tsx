import { useEffect, useState } from 'react';
import { Activity, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { apiService } from '@/services/api';

export function HealthIndicator() {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await apiService.checkHealth();
        setHealth(status);
      } catch {
        setHealth({
          status: 'offline',
          models: { split: false, kfold: false },
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
      <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[10px] font-mono uppercase tracking-widest">Checking System...</span>
      </div>
    );
  }

  // ✅ แก้ไขชื่อตัวแปรให้ตรงกับ Backend (status: 'online' และ models.split / models.kfold)
  const isHealthy = (health?.status === 'online' || health?.status === 'healthy') && 
                    health?.models?.split === true && 
                    health?.models?.kfold === true;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-tighter transition-all ${
        isHealthy 
          ? 'bg-green-500/5 text-green-600 border-green-500/20' 
          : 'bg-red-500/5 text-red-600 border-red-500/20'
      }`}>
        {isHealthy ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        <span>
          {isHealthy ? 'Dual-Model Ready' : 'System Error'}
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <Activity className={`h-4 w-4 z-10 ${isHealthy ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
        {isHealthy && (
           <span className="absolute h-4 w-4 rounded-full bg-green-500/30 animate-ping"></span>
        )}
      </div>
    </div>
  );
}
