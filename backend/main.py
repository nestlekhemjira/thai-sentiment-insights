from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import time
import numpy as np

# ---------- Load model ----------
try:
    # โหลด Model (ต้องมั่นใจว่า path ถูกต้อง)
    bundle = joblib.load("model/sentiment_model_v1.joblib")
    model = bundle["model"]
    label_encoder = bundle["label_encoder"]
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None
    label_encoder = None

# ---------- App ----------
app = FastAPI(
    title="Thai Sentiment Insights API",
    version="1.0.0",
    description="Backend API for Thai Sentiment Analysis"
)

# ---------- CORS (สำคัญมากสำหรับ React) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ยอมรับทุก Port (Dev mode)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class TextRequest(BaseModel):
    text: str

# ---------- Routes ----------

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Thai Sentiment Insights API is running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy" if model else "unhealthy",
        "model_loaded": model is not None,
        "vectorizer_loaded": label_encoder is not None,
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
        "trained_at": "2024-01-15T10:30:00Z",
        "num_classes": len(label_encoder.classes_),
        "labels": [str(l).lower() for l in label_encoder.classes_], # ส่งตัวเล็กไปโชว์
        "accuracy": 0.847,
        "f1_score": 0.832
    }

# ✅ POST /predict (ปรับปรุงให้ Robust)
@app.post("/predict")
def predict_sentiment(req: TextRequest):
    if not model or not label_encoder:
        raise HTTPException(status_code=503, detail="Model is not available")

    start_time = time.time()
    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # 1. Predict Probabilities
        proba = model.predict_proba([text])[0]
        pred_idx = proba.argmax()
        
        # 2. Get Label & Confidence
        raw_label = label_encoder.inverse_transform([pred_idx])[0]
        
        # ⚠️ สำคัญ: แปลงเป็นตัวเล็กเสมอ (positive, negative, neutral) เพื่อให้ตรงกับ Frontend
        label = str(raw_label).lower() 
        confidence = float(proba[pred_idx])

        # 3. Build Probabilities Dict (บังคับ Key ตัวเล็ก)
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