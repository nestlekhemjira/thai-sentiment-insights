import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import time
import numpy as np

# ==========================================
# 📂 1. Setup Paths (สำคัญมากสำหรับ Render)
# ==========================================
# หาที่อยู่ปัจจุบันของไฟล์ main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ชี้ไปที่โฟลเดอร์ dist (Frontend ที่ Build แล้ว)
DIST_DIR = os.path.join(BASE_DIR, "dist")
# ชี้ไปที่ไฟล์ Model (แก้ path ให้ชัวร์)
MODEL_PATH = os.path.join(BASE_DIR, "model", "sentiment_model_v1.joblib")

# ==========================================
# 🤖 2. Load Model
# ==========================================
model = None
label_encoder = None

try:
    print(f"📂 Loading model from: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    label_encoder = bundle["label_encoder"]
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    # หมายเหตุ: บน Render ถ้าโหลดโมเดลไม่ได้ App อาจจะยังรันได้แต่ Predict ไม่ได้

# ==========================================
# 🚀 3. App & CORS
# ==========================================
app = FastAPI(
    title="Thai Sentiment Insights API",
    version="1.0.0",
    description="Hybrid Server: Serving React Frontend + Python Backend"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class TextRequest(BaseModel):
    text: str

# ==========================================
# 🔌 4. API Routes (Backend Logic)
# ==========================================

@app.get("/api/health")  # เปลี่ยนเป็น /api/health เพื่อไม่ให้ชนกับ Frontend
def health():
    return {
        "status": "healthy" if model else "unhealthy",
        "model_loaded": model is not None,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
    }

@app.get("/model/info")
def model_info():
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "Thai Sentiment Classifier",
        "version": "1.0.0",
        "classifier_type": type(model).__name__,
        "num_classes": len(label_encoder.classes_),
        "labels": [str(l).lower() for l in label_encoder.classes_],
        "accuracy": 0.995, # อัปเดตตามจริง
        "f1_score": 0.992
    }

@app.post("/predict")
def predict_sentiment(req: TextRequest):
    if not model or not label_encoder:
        raise HTTPException(status_code=503, detail="Model is not available")

    start_time = time.time()
    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        proba = model.predict_proba([text])[0]
        pred_idx = proba.argmax()
        raw_label = label_encoder.inverse_transform([pred_idx])[0]
        label = str(raw_label).lower() 
        confidence = float(proba[pred_idx])

        probabilities = {
            str(label_encoder.inverse_transform([i])[0]).lower(): float(p)
            for i, p in enumerate(proba)
        }

        latency_ms = (time.time() - start_time) * 1000

        return {
            "label": label,
            "confidence": confidence,
            "probabilities": probabilities,
            "latency_ms": latency_ms,
            "preprocessed_text": text
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 🌐 5. Frontend Serving (ส่วนที่เพิ่มเข้ามา)
# ==========================================

# ตรวจสอบว่ามีโฟลเดอร์ dist ไหม
if os.path.exists(DIST_DIR):
    # 1. Mount Assets (CSS, JS, Images)
    # React จะเรียกไฟล์พวกนี้ผ่าน /assets/...
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    # 2. Serve index.html ที่ Root (/)
    @app.get("/")
    async def serve_spa():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    # 3. Catch-All Route (สำหรับ React Router)
    # ถ้า User กด Refresh หน้า /about หรือ /result ระบบจะส่ง index.html ให้ React จัดการต่อ
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        # ถ้าไฟล์มีอยู่จริง (เช่น favicon.ico) ให้ส่งไฟล์นั้น
        if os.path.exists(file_path):
            return FileResponse(file_path)
        # ถ้าไม่เจอไฟล์ ให้ส่ง index.html (SPA Fallback)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    print("⚠️ WARNING: 'dist' folder not found! Frontend will not be served.")
    @app.get("/")
    def root():
        return {"message": "Backend is running, but Frontend (dist) is missing."}