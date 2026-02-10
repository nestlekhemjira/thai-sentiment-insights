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
# 📂 1. Setup Paths
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

# ค้นหา Folder 'dist' สำหรับ Frontend
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

# Path สำหรับโมเดล
MODEL_PATH_SPLIT = os.path.join(BASE_DIR, "model", "sentiment_model_split.joblib")
MODEL_PATH_KFOLD = os.path.join(BASE_DIR, "model", "sentiment_model_kfold.joblib")

# ==========================================
# 🤖 2. Load Models
# ==========================================
models_dict = {}

def load_bundle(path, name):
    try:
        if os.path.exists(path):
            bundle = joblib.load(path)
            print(f"✅ {name} loaded successfully from {path}")
            return bundle
        else:
            print(f"⚠️ {name} NOT FOUND at {path}")
            return None
    except Exception as e:
        print(f"❌ Error loading {name}: {e}")
        return None

# โหลดโมเดลเข้า Dictionary
models_dict["split"] = load_bundle(MODEL_PATH_SPLIT, "Split Model")
models_dict["kfold"] = load_bundle(MODEL_PATH_KFOLD, "K-Fold Model")

# ==========================================
# 🚀 3. App Setup
# ==========================================
app = FastAPI(title="Thai Sentiment Insights API", version="3.0.0")

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
        "models_ready": {k: v is not None for k, v in models_dict.items()},
        "timestamp": time.time()
    }

@app.post("/predict")
def predict_sentiment(req: TextRequest):
    # ตรวจสอบว่ามีโมเดลอย่างน้อย 1 ตัวที่พร้อม
    if not any(models_dict.values()):
        raise HTTPException(status_code=503, detail="No models loaded on server")

    start_time = time.time()
    text = req.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")

    prediction_results = {}
    
    for key in ["split", "kfold"]:
        try:
            bundle = models_dict.get(key)
            if not bundle:
                prediction_results[key] = {"error": "Model not available"}
                continue

            # --- 🎯 จัดการโครงสร้าง Bundle ---
            # รองรับทั้งแบบเก่า (Dict) และแบบใหม่ (Pipeline ตรงๆ)
            if isinstance(bundle, dict):
                model = bundle.get("model")
                le = bundle.get("label_encoder")
            else:
                model = bundle
                # ดึง encoder ที่ฝังไว้ในตัว Pipeline (ถ้ามี)
                le = getattr(model, 'label_encoder', None)

            # --- 🔮 ทำนายผล ---
            # ส่งเป็น List [text] เพราะ Pipeline ต้องการ input เป็น iterable
            proba = model.predict_proba([text])[0]
            pred_idx = proba.argmax()
            
            # แปลง Label เลข -> คำ
            if le:
                label = str(le.inverse_transform([pred_idx])[0]).lower()
            else:
                # Fallback mapping
                labels = ["negative", "neutral", "positive"]
                label = labels[pred_idx] if pred_idx < len(labels) else str(pred_idx)

            prediction_results[key] = {
                "label": label,
                "confidence": float(proba[pred_idx]),
                "probabilities": {str(i): float(p) for i, p in enumerate(proba)}
            }

        except Exception as e:
            print(f"❌ {key} prediction error: {e}")
            prediction_results[key] = {
                "label": "error",
                "confidence": 0,
                "message": str(e)
            }

    return {
        "results": prediction_results,
        "latency_ms": round((time.time() - start_time) * 1000, 2),
        "text": text
    }

# ==========================================
# 🌐 5. Serving Frontend
# ==========================================
if DIST_DIR:
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        if any(full_path.startswith(p) for p in ["api", "predict"]):
            return None
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Backend is running. Frontend (dist) folder not found."}
