import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PredictionFormProps {
  onPredict: (text: string) => Promise<void>;
  isLoading: boolean;
}

const exampleTexts = [
  'ดีนะ ส้มตำอร่อย',
  'แนะนำ โคตรจะจึ้ง',
  'ก็นะ ก็โอเคร',
  'ไม่ซ้ำค่ะ จบ',
];

export function PredictionForm({ onPredict, isLoading }: PredictionFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      await onPredict(text.trim());
    }
  };

  const handleExample = (example: string) => {
    setText(example);
  };

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">วิเคราะห์ความรู้สึก</h2>
          <p className="text-sm text-muted-foreground">Sentiment Analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            ใส่ข้อความภาษาไทย
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="พิมพ์ข้อความที่ต้องการวิเคราะห์..."
            className="min-h-[120px] font-thai text-base resize-none bg-background border-input focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground font-mono">
            {text.length} characters
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-medium"
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังวิเคราะห์...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              วิเคราะห์ความรู้สึก
            </>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">ตัวอย่างข้อความ:</p>
        <div className="flex flex-wrap gap-2">
          {exampleTexts.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExample(example)}
              className="px-3 py-1.5 text-xs font-thai bg-secondary hover:bg-accent text-secondary-foreground rounded-full transition-colors"
              disabled={isLoading}
            >
              {example.slice(0, 20)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
