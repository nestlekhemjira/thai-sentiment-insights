import { useState } from 'react';
import { BookOpen, MessageSquareSearch, LayoutDashboard, Zap } from 'lucide-react';
import { PredictionForm } from '@/components/PredictionForm';
import { ResultDisplay } from '@/components/ResultDisplay';
import { ModelInfoCard } from '@/components/ModelInfoCard';
import { ErrorCasesCard } from '@/components/ErrorCasesCard';
import { HealthIndicator } from '@/components/HealthIndicator';
import { apiService } from '@/services/api';
import type { PredictionResponse } from '@/types/sentiment';

const Index = () => {
  // รับข้อมูลแบบใหม่ที่มีผลลัพธ์ 2 ชุด
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.predict({ text });
      setResult(response);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquareSearch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Thai Sentiment
                <span className="gradient-text ml-1">Insights</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">Comparative Analysis Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <HealthIndicator />
            <div className="hidden sm:flex items-center gap-2">
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Documentation"
              >
                <BookOpen className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            วิเคราะห์ความรู้สึกเชิงเปรียบเทียบ
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            เปรียบเทียบผลการทำนายระหว่างรุ่น <b>Train/Test Split</b> และ <b>5-Fold Cross Validation</b> เพื่อความแม่นยำสูงสุด
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-10">
           <PredictionForm onPredict={handlePredict} isLoading={isLoading} />
        </div>

        {/* Comparison Results Area */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Model Comparison Results</h3>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 mb-12">
              {/* ฝั่ง Split Model */}
              <div className="relative group">
                <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-full border border-border">
                  Model A: Split Method
                </div>
                <ResultDisplay result={result.results.split} />
              </div>

              {/* ฝั่ง K-Fold Model */}
              <div className="relative group">
                <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-current" />
                  Model B: K-Fold (Recommended)
                </div>
                <div className="ring-2 ring-primary/20 rounded-2xl">
                   <ResultDisplay result={result.results.kfold} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6 border-t border-border pt-12">
          <ModelInfoCard />
          <ErrorCasesCard />
        </div>

        {/* Tech Stack */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Powered by Advanced NLP Pipeline</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {['FastAPI', 'scikit-learn', 'Dual-Model Logic', 'React', 'TailwindCSS'].map((tech) => (
              <span 
                key={tech}
                className="px-4 py-2 bg-card border border-border rounded-lg text-xs font-mono text-foreground shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-card/30">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Thai Sentiment Analysis Comparative Study • 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
