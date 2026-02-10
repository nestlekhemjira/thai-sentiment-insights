☁️ วิธีการ Deploy บน Render.com (Web Service ก้อนเดียว)

1. การตั้งค่า Build & Start

Runtime: Python 3

Build Command: (ก๊อปอันนี้ไปเลย มันคือการสั่ง Build frontend แล้วเตรียมไฟล์ให้ backend รันต่อได้ในคำสั่งเดียว)

Bash
# ติดตั้ง Library ของ Backend
pip install -r backend/requirements.txt && \
# เข้าไป Build Frontend 
cd frontend && npm install && npm run build && \
# พอมันได้โฟลเดอร์ dist มาแล้ว เราไม่ต้องย้ายก็ได้ (เพราะใน main.py เราชี้ไปที่ ../frontend/dist แล้ว)
cd ..
2. Start Command:

Bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
