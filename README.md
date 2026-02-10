🍜 Thai Sentiment Analysis: Split vs K-Fold Comparison
โปรเจกต์วิเคราะห์ความรู้สึกจากรีวิวอาหาร (ภาษาไทย) โดยเปรียบเทียบประสิทธิภาพระหว่างการใช้ Model แบบ Train-Test Split และ 5-Fold Cross-Validation

📂 โครงสร้างโปรเจกต์ (Monorepo)
/ (Root) -> ไฟล์ README และการตั้งค่าสำหรับ Deploy

/backend -> API (FastAPI) และโฟลเดอร์ model/ สำหรับเก็บไฟล์ .joblib

/frontend -> Dashboard (React + Vite) สำหรับแสดงผลเปรียบเทียบ

🚀 วิธีการรันบนเครื่อง Local
1. รัน Backend

เข้าไปที่โฟลเดอร์ backend: cd backend

ติดตั้ง Library: pip install -r requirements.txt

สั่งรัน Server: uvicorn main:app --reload
API จะรันที่ http://localhost:8000 และดู Docs ได้ที่ /docs

2. รัน Frontend

เข้าไปที่โฟลเดอร์ frontend: cd frontend

ติดตั้ง Package: npm install

สั่งรันหน้าเว็บ: npm run dev
หน้าเว็บจะรันที่ http://localhost:5173

☁️ วิธีการ Deploy บน Render.com (Web Service)
1. การตั้งค่า Build & Start

Runtime: Python 3

Build Command:
# 1. ติดตั้ง dependencies ของ Backend
pip install -r backend/requirements.txt

# 2. ไปที่โฟลเดอร์ frontend เพื่อ build หน้าเว็บ
cd frontend && npm install && npm run build

# 3. ย้ายโฟลเดอร์ dist มาไว้ใน backend เพื่อให้ FastAPI เรียกใช้ได้
cp -r dist ../backend/

Bash
# ติดตั้ง dependencies สำหรับ backend
pip install -r backend/requirements.txt
# build frontend และย้ายไฟล์ไปไว้ที่ backend/dist เพื่อให้ FastAPI เสิร์ฟไฟล์ได้
cd frontend && npm install && npm run build && cp -r dist ../backend/
Start Command:

Bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
2. Environment Variables

SCIKIT_LEARN_VERSION: 1.6.1 (เพื่อให้ตรงกับตอนเทรนโมเดล)
