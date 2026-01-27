import { useState } from 'react';
import { BookOpen, Cpu } from 'lucide-react'; // 🗑️ ลบ Github ออกแล้ว
import { PredictionForm } from '@/components/PredictionForm';
import { ResultDisplay } from '@/components/ResultDisplay';
import { ModelInfoCard } from '@/components/ModelInfoCard';
import { ErrorCasesCard } from '@/components/ErrorCasesCard';
import { HealthIndicator } from '@/components/HealthIndicator';
import { apiService } from '@/services/api';
import type { PredictionResponse } from '@/types/sentiment';

const Index = () => {
  const [result, setResult] = useState<PredictionResponse | null>(null);
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
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Thai Sentiment
                <span className="gradient-text ml-1">Analyzer</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">NLP Mini Project</p>
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
              {/* 🗑️ ปุ่ม Github หายไปแล้ว */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            วิเคราะห์ความรู้สึกข้อความภาษาไทย
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze sentiment in Thai text using TF-IDF vectorization and 
            machine learning classification
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <PredictionForm onPredict={handlePredict} isLoading={isLoading} />
          <ResultDisplay result={result} />
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <ModelInfoCard />
          <ErrorCasesCard />
        </div>

        {/* Tech Stack */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">Built with</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {['FastAPI', 'scikit-learn', 'PyThaiNLP', 'React', 'TailwindCSS'].map((tech) => (
              <span 
                key={tech}
                className="px-3 py-1.5 bg-muted rounded-full text-xs font-mono text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Thai Sentiment Analysis • Academic Mini Project • 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;