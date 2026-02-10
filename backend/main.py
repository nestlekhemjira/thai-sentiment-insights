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
# 📂 1. Setup Paths (ทำให้ยืดหยุ่นที่สุด)
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")

# แก้ไข Path ให้ดักทั้งกรณีมีโฟลเดอร์ model และไม่มี
MODEL_PATH_SPLIT = os.path.join(BASE_DIR, "model", "sentiment_model_split.joblib")
MODEL_PATH_KFOLD = os.path.join(BASE_DIR, "model", "sentiment_model_kfold.joblib")

# ==========================================
# 🤖 2. Load Models (Dual Loading Logic)
# ==========================================
models_dict = {}

def load_bundle(path, name):
    try:
        # Debugging: พิมพ์เช็คใน Log Render
        print(f"🔍 Checking path: {path}")
        if os.path.exists(path):
            bundle = joblib.load(path)
            print(f"✅ {name} loaded successfully!")
            return bundle
        else:
            # ดักเคสถ้าไฟล์วางอยู่ที่เดียวกับ main.py (กันพลาด)
            alt_path = os.path.join(BASE_DIR, os.path.basename(path))
            if os.path.exists(alt_path):
                print(f"📂 Found at alt path: {alt_path}")
                return joblib.load(alt_path)
            print(f"⚠️ {name} NOT FOUND at {path}")
            return None
    except Exception as e:
        print(f"❌ Failed to load {name}: {e}")
        return None

# โหลดเก็บไว้ใน Dictionary
models_dict["split"] = load_bundle(MODEL_PATH_SPLIT, "Split Model")
models_dict["kfold"] = load_bundle(MODEL_PATH_KFOLD, "K-Fold Model")

# ==========================================
# 🚀 3. App & CORS Setup
# ==========================================
app = FastAPI(
    title="Thai Sentiment Dual-Model API",
    version="2.0.0"
)

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
        "models": {
            "split": models_dict["split"] is not None,
            "kfold": models_dict["kfold"] is not None
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
    }

@app.get("/model/info")
def get_model_info():
    # เพิ่ม Endpoint นี้เพื่อรองรับฟังก์ชันใน ApiService ของแอ๋ม
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
                    # ทำนาย
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

        latency_ms = (time.time() - start_time) * 1000

        return {
            "results": prediction_results,
            "latency_ms": latency_ms,
            "preprocessed_text": text,
            "compare_mode": True
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 🌐 5. Static Files Serving (Production)
# ==========================================
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_spa():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "API is online. (Frontend dist not found)"}
