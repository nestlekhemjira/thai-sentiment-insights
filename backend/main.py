import os
import time
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ==========================================
# 📂 1. Setup Paths (แก้ไขให้ถอยหลังไปหา frontend/dist)
# ==========================================
# BASE_DIR คือโฟลเดอร์ /backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 💡 หัวใจสำคัญ: ถอยออกจาก backend เพื่อไปหา frontend/dist
# อ้ายใช้ abspath เพื่อให้ระบบมั่นใจว่า Path ถูกต้องชัวร์ๆ
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

# Path สำหรับโมเดล (อยู่ใน backend/model)
MODEL_PATH_SPLIT = os.path.join(BASE_DIR, "model", "sentiment_model_split.joblib")
MODEL_PATH_KFOLD = os.path.join(BASE_DIR, "model", "sentiment_model_kfold.joblib")

# Debugging: พิมพ์เช็คใน Log ของ Render เพื่อความสบายใจ
print(f"🖥️ Frontend Static Path: {DIST_DIR}")
print(f"🏠 Index.html exists: {os.path.exists(os.path.join(DIST_DIR, 'index.html'))}")

# ==========================================
# 🤖 2. Load Models (Dual Loading Logic)
# ==========================================
models_dict = {}

def load_bundle(path, name):
    try:
        print(f"🔍 Checking model at: {path}")
        if os.path.exists(path):
            bundle = joblib.load(path)
            print(f"✅ {name} loaded successfully!")
            return bundle
        else:
            # ดักเคสถ้าไฟล์วางอยู่ที่เดียวกับ main.py
            alt_path = os.path.join(BASE_DIR, os.path.basename(path))
            if os.path.exists(alt_path):
                print(f"📂 Found {name} at alt path: {alt_path}")
                return joblib.load(alt_path)
            print(f"⚠️ {name} NOT FOUND!")
            return None
    except Exception as e:
        print(f"❌ Error loading {name}: {e}")
        return None

models_dict["split"] = load_bundle(MODEL_PATH_SPLIT, "Split Model")
models_dict["kfold"] = load_bundle(MODEL_PATH_KFOLD, "K-Fold Model")

# ==========================================
# 🚀 3. App Setup
# ==========================================
app = FastAPI(title="Thai Sentiment Dual-Model API", version="2.0.0")

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
# 🔌 4. API Routes (ต้องอยู่เหนือส่วน Static Files)
# ==========================================

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "models": {
            "split": models_dict["split"] is not None,
            "kfold": models_dict["kfold"] is not None
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
    }

@app.get("/model/info")
def get_model_info():
    return {
        "split": {"accuracy": 0.85, "method": "Train-Test Split"},
        "kfold": {"accuracy": 0.92, "method": "5-Fold CV"}
    }

@app.post("/predict")
def predict_sentiment(req: TextRequest):
    if not models_dict["split"] and not models_dict["kfold"]:
        raise HTTPException(status_code=503, detail="No models loaded")

    start_time = time.time()
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    prediction_results = {}
    try:
        for key in ["split", "kfold"]:
            bundle = models_dict.get(key)
            if bundle and isinstance(bundle, dict):
                model = bundle.get("model")
                label_encoder = bundle.get("label_encoder")
                
                if model and label_encoder:
                    proba = model.predict_proba([text])[0]
                    pred_idx = proba.argmax()
                    raw_label = label_encoder.inverse_transform([pred_idx])[0]
                    
                    prediction_results[key] = {
                        "label": str(raw_label).lower(),
                        "confidence": float(proba[pred_idx]),
                        "probabilities": {
                            str(label_encoder.inverse_transform([i])[0]).lower(): float(p)
                            for i, p in enumerate(proba)
                        }
                    }
            else:
                prediction_results[key] = None

        return {
            "results": prediction_results,
            "latency_ms": (time.time() - start_time) * 1000,
            "preprocessed_text": text,
            "compare_mode": True
        }
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 🌐 5. Static Files Serving (วางไว้ท้ายสุด)
# ==========================================
if os.path.exists(DIST_DIR):
    # 1. เสิร์ฟโฟลเดอร์ assets (พวกไฟล์ js, css ของ frontend)
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    # 2. เสิร์ฟหน้าแรก index.html
    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    # 3. Catch-all: ถ้าพิมพ์ URL อื่นๆ ให้กลับมาที่ index.html (ยกเว้น API)
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # รายชื่อ prefix ของ API ที่เราไม่ต้องการให้ FileResponse แย่งไปทำงาน
        api_prefixes = ["api", "predict", "model", "docs", "openapi.json"]
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            return None 
            
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "API Online, but Frontend dist not found at " + DIST_DIR}
