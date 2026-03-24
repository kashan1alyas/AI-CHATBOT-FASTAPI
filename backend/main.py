import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. Load Configuration
load_dotenv()
# Ensure your .env file has: OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

# 2. CORS Bridge (Allowing your Vite frontend at localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# 3. The Chat Endpoint
@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        return {"reply": "❌ Error: OPENROUTER_API_KEY not found in backend .env file."}

    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Headers required by OpenRouter
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", # Optional: Site URL
        "X-Title": "Vite AI Chatbot",            # Optional: Site Name
    }

    # Data payload
    data = {
        "model": "google/gemini-2.0-flash-001", # You can also use "google/gemini-2.0-flash-lite-001"
        "messages": [
            {"role": "user", "content": request.message}
        ]
    }

    try:
        # Sending the request to OpenRouter
        response = requests.post(url, headers=headers, json=data)
        
        # Check for HTTP errors (like 401, 404, 429)
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', 'Unknown Error')
            return {"reply": f"OpenRouter Error ({response.status_code}): {error_msg}"}

        result = response.json()
        
        # Extract the AI's text response
        if 'choices' in result and len(result['choices']) > 0:
            reply_text = result['choices'][0]['message']['content']
            return {"reply": reply_text}
        else:
            return {"reply": "AI returned an empty response. Check your OpenRouter credits."}

    except Exception as e:
        print(f"SYSTEM ERROR: {str(e)}")
        return {"reply": f"Backend Error: {str(e)}"}

# 4. Health Check
@app.get("/")
def health():
    return {"status": "OpenRouter Backend is Online"}

# TO RUN: uvicorn main:app --reload --port 5000