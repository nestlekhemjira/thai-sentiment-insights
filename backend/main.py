import os
import time
import joblib
import numpy as np
import warnings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ปิด Warning เพื่อความสะอาดของ Log
warnings.filterwarnings("ignore", category=UserWarning)

# ==========================================
# 📂 1. Setup Paths (ระบบนำทางไฟล์)
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

# ค้นหา Folder 'dist' สำหรับหน้าเว็บ
POSSIBLE_DIST_PATHS = [
    os.path.join(PARENT_DIR, "frontend", "dist"),
    os.path.join(BASE_DIR, "dist"),
    os.path.join(PARENT_DIR, "dist"),
    "/opt/render/project/src/backend/dist"
]

DIST_DIR = ""
for path in POSSIBLE_DIST_PATHS:
    if os.path.exists(os.path.join(path, "index.html")):
        DIST_DIR = path
        break

# Path สำหรับโมเดล (ตรวจสอบ Folder 'model' ใน backend)
MODEL_PATH_SPLIT = os.path.join(BASE_DIR, "model", "sentiment_model_split.joblib")
MODEL_PATH_KFOLD = os.path.join(BASE_DIR, "model", "sentiment_model_kfold.joblib")

# ==========================================
# 🤖 2. Load Models (โหลดโมเดลเตรียมพร้อม)
# ==========================================
models_dict = {}

def load_bundle(path, name):
    try:
        if os.path.exists(path):
            bundle = joblib.load(path)
            print(f"✅ {name} loaded successfully!")
            return bundle
        else:
            # ลองหาใน root เผื่อไฟล์ไม่ได้อยู่ใน folder model
            alt_path = os.path.join(BASE_DIR, os.path.basename(path))
            if os.path.exists(alt_path):
                bundle = joblib.load(alt_path)
                print(f"✅ {name} loaded from alt path!")
                return bundle
            print(f"⚠️ {name} NOT FOUND at {path}")
            return None
    except Exception as e:
        print(f"❌ Error loading {name}: {e}")
        return None

models_dict["split"] = load_bundle(MODEL_PATH_SPLIT, "Split Model")
models_dict["kfold"] = load_bundle(MODEL_PATH_KFOLD, "K-Fold Model")

# ==========================================
# 🚀 3. App Setup & Middleware
# ==========================================
app = FastAPI(title="Thai Sentiment Dual-Model API", version="2.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

# ==========================================
# 🔌 4. API Routes
# ==========================================

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "models_ready": {
            "split": models_dict["split"] is not None,
            "kfold": models_dict["kfold"] is not None
        },
        "time": time.strftime("%H:%M:%S")
    }

@app.post("/predict")
def predict_sentiment(req: TextRequest):
    if not any(models_dict.values()):
        raise HTTPException(status_code=503, detail="Models not ready")

    start_time = time.time()
    text = req.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    prediction_results = {}
    
    for key in ["split", "kfold"]:
        try:
            bundle = models_dict.get(key)
            if not bundle:
                prediction_results[key] = {"error": "Model not loaded"}
                continue

            # ตรวจสอบโครงสร้างไฟล์ (รองรับทั้ง Dictionary และ Pipeline ตรงๆ)
            if isinstance(bundle, dict):
                model = bundle.get("model")
                label_encoder = bundle.get("label_encoder")
                vectorizer = bundle.get("vectorizer")
            else:
                model = bundle
                label_encoder = None
                vectorizer = None

            # --- ขั้นตอนการทำนาย (The Prediction Logic) ---
            try:
                # 1. ลองแบบส่ง Text ตรงๆ (กรณีเป็น Pipeline)
                proba = model.predict_proba([text])[0]
            except Exception:
                # 2. ถ้าไม่ได้ ต้องผ่าน Vectorizer ก่อน
                if vectorizer:
                    X_transformed = vectorizer.transform([text])
                    proba = model.predict_proba(X_transformed)[0]
                else:
                    raise ValueError("Need Vectorizer for this model")

            pred_idx = proba.argmax()
            
            # แปลงเลขเป็นคำ (Positive/Negative/Neutral)
            if label_encoder:
                raw_label = label_encoder.inverse_transform([pred_idx])[0]
            else:
                # Default labels ถ้าไม่มี encoder
                default_labels = ["negative", "neutral", "positive"]
                raw_label = default_labels[pred_idx] if pred_idx < len(default_labels) else str(pred_idx)

            prediction_results[key] = {
                "label": str(raw_label).lower(),
                "confidence": float(proba[pred_idx]),
                "probabilities": {str(i): float(p) for i, p in enumerate(proba)}
            }

        except Exception as e:
            # ดัก Error รายโมเดล: ตัวหนึ่งพัง อีกตัวต้องทำงานได้
            print(f"❌ Error in {key}: {e}")
            prediction_results[key] = {
                "label": "error",
                "confidence": 0,
                "message": "Model Mismatch or Unfitted"
            }

    return {
        "results": prediction_results,
        "latency_ms": round((time.time() - start_time) * 1000, 2),
        "text": text
    }

# ==========================================
# 🌐 5. Serving Frontend (Static Files)
# ==========================================
if DIST_DIR:
    # เสิร์ฟไฟล์ CSS/JS
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # กันไม่ให้ทับเส้นทาง API
        if any(full_path.startswith(p) for p in ["api", "predict", "model"]):
            return None
        
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "API is Online. Frontend build (dist) not found."}
