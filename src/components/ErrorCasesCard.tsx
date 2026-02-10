import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Info, Search, CheckCircle2, XCircle } from 'lucide-react';

type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';

interface ErrorCase {
  id: string | number;
  input_text: string;
  actual_label: SentimentLabel;
  split_predicted: SentimentLabel; // ผลจาก Model A (ที่พลาด)
  kfold_predicted: SentimentLabel; // ผลจาก Model B (ที่แก้แล้ว)
  error_group: string;
  reason: string;
}

const labelColors: Record<SentimentLabel, string> = {
  Positive: 'bg-green-500/10 text-green-600 border-green-200',
  Negative: 'bg-red-500/10 text-red-600 border-red-200',
  Neutral: 'bg-gray-500/10 text-gray-600 border-gray-200',
};

export function ErrorCasesCard() {
  const [cases, setCases] = useState<ErrorCase[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // ✅ ข้อมูลเปรียบเทียบเคสที่ Model B (K-Fold) แก้ปัญหาได้ดีขึ้น
  // ---------------------------------------------------------
  const comparisonCases: ErrorCase[] = [
    { 
      id: 1, 
      input_text: "รสชาติ ดี ม้ ้า ก/ ไม่ แพง/ พนักงาน ไม่ค่อย สนใจ. แนะนำ เลย", 
      actual_label: "Positive", 
      split_predicted: "Neutral", 
      kfold_predicted: "Positive", 
      error_group: "Mixed Signal (สัญญาณขัดแย้ง)", 
      reason: "K-Fold ช่วยให้โมเดลให้น้ำหนักคำชม 'แนะนำ/ดี' ชนะคำติ 'ไม่ค่อยสนใจ' ในเชิงบริบทได้" 
    },
    { 
      id: 2, 
      input_text: "แวะ มา กิน ซูชิ... รอ นาน มาก/ ร้าน สะอาด ด/ ไม่ น่า ซ้ำ", 
      actual_label: "Negative", 
      split_predicted: "Neutral", 
      kfold_predicted: "Negative", 
      error_group: "Mixed Signal (สัญญาณขัดแย้ง)", 
      reason: "ตัวเดิมโดนคำว่า 'สะอาด' ดึงคะแนน แต่ K-Fold เรียนรู้บทสรุป 'ไม่น่าซ้ำ' ได้แม่นยำกว่า" 
    },
    { 
      id: 3, 
      input_text: "คิว ช้า/ โอ เค ค้ นะ/ กลิ่น แรง... ไม่ น่า ซ้ำ 🥲", 
      actual_label: "Negative", 
      split_predicted: "Neutral", 
      kfold_predicted: "Negative", 
      error_group: "Ambiguity (ความกำกวม)", 
      reason: "แยกแยะ 'โอเค' ที่เป็นสร้อยคำ ออกจากอารมณ์ลบหลัก 'คิวช้า/กลิ่นแรง' ได้ดีขึ้น" 
    },
    { 
      id: 4, 
      input_text: "ดูแล ดี/ โอเค นะ... ที่ จอด น้อย. แนะนำ เรย 😋", 
      actual_label: "Positive", 
      split_predicted: "Neutral", 
      kfold_predicted: "Positive", 
      error_group: "Typo / Noise (คำวิบัติ)", 
      reason: "การเทรนหลายรอบช่วยให้โมเดลทนทานต่อคำวิบัติอย่าง 'เรย' และการตัดคำที่ผิดพลาด" 
    },
    { 
      id: 5, 
      input_text: "มา ลอง เครื่องดื่ม... คิว ช้า/ โอเค. ไม่ น่า ซ้ำ 😤", 
      actual_label: "Negative", 
      split_predicted: "Neutral", 
      kfold_predicted: "Negative", 
      error_group: "Ambiguity (ความกำกวม)", 
      reason: "K-Fold มองเห็นรูปแบบความสัมพันธ์ของคำว่า 'ไม่น่าซ้ำ' กับอารมณ์ Negative ได้เสถียรกว่า" 
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCases(comparisonCases);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 space-y-6 h-full border-l-4 border-l-orange-500/50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2.5 rounded-xl bg-orange-500/10">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Error Comparison</h2>
          <p className="text-xs text-muted-foreground">
            วิเคราะห์เคสที่ Model A พลาด แต่ Model B (K-Fold) แก้ไขได้
          </p>
        </div>
      </div>

      {/* List of Cases */}
      <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
        {cases.map((c) => (
          <div key={c.id} className="group p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3 hover:bg-muted/50 transition-all">
            {/* Input Text */}
            <div className="flex items-start gap-2">
              <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm font-thai italic text-foreground leading-relaxed">
                "{c.input_text}"
              </p>
            </div>
            
            <div className="pl-6 space-y-3">
              {/* Grouping Tag */}
              <div className="inline-block px-2 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold uppercase tracking-tight">
                กลุ่มอาการ: {c.error_group}
              </div>

              {/* Comparison Matrix in Card */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {/* Model A Result */}
                <div className="p-2 rounded-lg bg-background border border-border flex flex-col gap-1.5 shadow-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-500" /> Model A (Split)
                  </span>
                  <div className={`py-1 rounded border text-center font-bold ${labelColors[c.split_predicted]}`}>
                    {c.split_predicted}
                  </div>
                </div>

                {/* Model B Result */}
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-1.5 shadow-sm ring-1 ring-primary/10">
                  <span className="text-primary font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Model B (K-Fold)
                  </span>
                  <div className={`py-1 rounded border text-center font-bold ${labelColors[c.kfold_predicted]}`}>
                    {c.kfold_predicted}
                  </div>
                </div>
              </div>

              {/* Analysis Reason */}
              <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 text-primary/70 shrink-0" />
                <span>
                  <strong className="text-foreground">Why improved:</strong> {c.reason}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Note */}
      <p className="text-[10px] text-center text-muted-foreground bg-muted/40 py-2 rounded-lg border border-border/40">
        * ผลการวิเคราะห์แสดงให้เห็นว่า Model B มีความเสถียร (Robustness) สูงกว่าต่อข้อมูลที่ซับซ้อน
      </p>
    </div>
  );
}
