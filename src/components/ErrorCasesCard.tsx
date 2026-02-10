import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, Info, Search } from 'lucide-react';

type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';

interface ErrorCase {
  id: string | number;
  input_text: string;
  actual_label: SentimentLabel;
  predicted_label: SentimentLabel;
  error_type: string;
  confidence: number;
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

  // ข้อมูลจริงจาก Log (5 Cases)
  const realErrorCases: ErrorCase[] = [
    // Case 1
    { 
      id: 1, 
      input_text: "มา ลอง ชาบู... รสชาติ ดี ม้ ้า ก/ ไม่ แพง/ โอเค นะ/ พนักงาน ไม่ค่อย สนใจ. แนะนำ เลย", 
      actual_label: "Positive", 
      predicted_label: "Neutral", 
      error_type: "Mixed Signal (สัญญาณขัดแย้ง)", 
      confidence: 0.438, 
      reason: "มีคำชม 'รสชาติดี/แนะนำ' แต่เจอคำลบ 'ไม่สนใจ' มาหักล้าง โมเดลเลยเลือกกลาง" 
    },
    // Case 2
    { 
      id: 2, 
      input_text: "แวะ มา กิน ซูชิ... รอ นาน มาก/ ร้าน สะอาด ด/ บรรยากาศ ทั่วไป. ไม่ น่า ซ้ำ", 
      actual_label: "Negative", 
      predicted_label: "Neutral", 
      error_type: "Mixed Signal (สัญญาณขัดแย้ง)", 
      confidence: 0.485, 
      reason: "คำว่า 'ร้านสะอาด' (Pos) ขัดแย้งกับ 'รอนาน/ไม่น่าซ้ำ' (Neg) โมเดลให้น้ำหนักผิด" 
    },
    // Case 3
    { 
      id: 3, 
      input_text: "แวะ ม้า กิน ก๋วยเตี๋ยว... คิว ช้า/ โอ เค ค้ นะ/ กลิ่น แรง... ไม่ น่า ซ้ำ 🥲", 
      actual_label: "Negative", 
      predicted_label: "Neutral", 
      error_type: "Ambiguity (ความกำกวม)", 
      confidence: 0.505, 
      reason: "คำว่า 'โอเค' (Neutral Keyword) ดึงคะแนนขึ้น แม้สรุปท้ายจะบอกว่า 'ไม่น่าซ้ำ'" 
    },
    // Case 4
    { 
      id: 4, 
      input_text: "กิน ข้าวมันไก่... ดูแล ดี/ โอเค นะ... ที่ จอด น้อย. แนะนำ เรย 😋", 
      actual_label: "Positive", 
      predicted_label: "Neutral", 
      error_type: "Typo / Noise (คำวิบัติ)", 
      confidence: 0.599, 
      reason: "พิมพ์คำว่า 'เรย' (เลย) และตัดคำผิด 'ม้ ้า ก' ทำให้ Feature หายไปบางส่วน" 
    },
    // Case 5
    { 
      id: 5, 
      input_text: "มา ลอง เครื่องดื่ม... คิว ช้า/ โอเค. ไม่ น่า ซ้ำ 😤", 
      actual_label: "Negative", 
      predicted_label: "Neutral", 
      error_type: "Ambiguity (ความกำกวม)", 
      confidence: 0.553, 
      reason: "สับสนคำว่า 'โอเค' (แปลว่ายอมรับได้) กับบริบทจริงที่ลูกค้าไม่พอใจ (คิวช้า)" 
    },
  ];

  useEffect(() => {
    // จำลองการโหลด
    setTimeout(() => {
      setCases(realErrorCases);
      setLoading(false);
    }, 500);
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
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2.5 rounded-xl bg-orange-500/10">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Error Analysis</h2>
          <p className="text-sm text-muted-foreground">
            วิเคราะห์ข้อผิดพลาดจริงจาก Test Set (5 ตัวอย่าง)
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {cases.map((errorCase) => (
          <div 
            key={errorCase.id} 
            className="group p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3 hover:bg-muted/60 transition-all hover:shadow-sm"
          >
            {/* Input Text */}
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2">
                    <Search className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm font-thai text-foreground leading-relaxed font-medium italic line-clamp-2" title={errorCase.input_text}>
                    "{errorCase.input_text}"
                    </p>
                </div>
            </div>
            
            {/* Error Type Badge */}
            <div className="flex items-center gap-2 mb-1 pl-6">
               <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
                 {errorCase.error_type}
               </span>
               <span className="text-[10px] font-mono text-muted-foreground/70">
                 Conf: {(errorCase.confidence * 100).toFixed(1)}%
               </span>
            </div>

            {/* Labels Comparison */}
            <div className="flex items-center gap-2 flex-wrap text-xs pl-6">
              <span className={`px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 ${labelColors[errorCase.actual_label]}`}>
                ความจริง: {errorCase.actual_label}
              </span>

              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />

              <span className={`px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 ${labelColors[errorCase.predicted_label]}`}>
                AI ทาย: {errorCase.predicted_label}
              </span>
            </div>

            {/* Reason Analysis */}
            <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground pl-1">
                <Info className="h-3.5 w-3.5 mt-0.5 text-primary/70 shrink-0" />
                <span>{errorCase.reason}</span>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-[10px] text-center text-muted-foreground pt-2">
        * ข้อผิดพลาดส่วนใหญ่เกิดจากประโยคที่มีความหมายขัดแย้งกัน (Mixed Sentiment) ทำให้โมเดลเลือกตอบเป็นกลาง
      </p>
    </div>
  );
}
