# StudyNX — Smart AI Study Tracker

> **AI-Powered Student Productivity Assistant**  
> Built for the Google Antigravity Hackathon

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-black?style=flat-square&logo=vercel)](https://studynx.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-13%20passing-brightgreen?style=flat-square)](/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](/)

---

# ✦ Chosen Vertical

**Student Productivity Assistant**

StudyNX is designed to help students **track, analyze, and improve their study consistency** using AI-driven insights and Google ecosystem integration.

---

# ✦ Problem Statement

Students struggle with:
- Maintaining consistent study habits  
- Planning effective daily schedules  
- Identifying weak subjects and priorities  
- Getting personalized guidance (not generic advice)

Existing tools:
- Track data but don’t guide decisions  
- Lack adaptive intelligence  
- Don’t integrate execution + planning  

### ✔ Solution

StudyNX solves this by combining:
- Real-time behavioral tracking  
- AI-powered personalized coaching  
- Automated scheduling via Google Calendar  

---

# ✦ Key Features

| Feature | Description |
|---|---|
| 🔥 **GitHub-style Heatmap** | Visualize daily study consistency and streaks |
| 🤖 **Gemini AI Coach** | Context-aware personalized study guidance |
| 📅 **Google Calendar Sync** | Auto-create sessions and AI-generated schedules |
| 📊 **Subject Analytics** | Track performance, progress %, and weak areas |
| 🔐 **Secure Auth System** | Email, magic link, and Google OAuth login |
| ⚡ **Streak Intelligence** | Detect risk and send smart nudges |

---

# ✦ Decision Intelligence (Core AI Logic)

StudyNX is not just a chatbot — it is a **decision-making system**.

### Input Data
- Daily / weekly study hours  
- Current streak status  
- Subject-wise performance  
- Historical activity patterns  

### Processing Layer
- Context Builder aggregates real-time user data  
- Structured prompt injection ensures personalization  
- Gemini processes contextual insights  

### Output Actions
- Personalized study coaching  
- Weak subject identification  
- Streak risk detection  
- AI-generated next-day schedule  

---

# ✦ Google Services Integration

StudyNX deeply integrates Google ecosystem:

### 1. Gemini API
- Provides intelligent, context-aware coaching  
- Generates personalized study plans  

### 2. Google Calendar API
- Converts study sessions into calendar events  
- Syncs AI-generated schedules instantly  

### 3. Google OAuth 2.0
- Secure authentication system  
- Seamless user onboarding  

### ✔ Impact
- Eliminates manual planning  
- Enables real-time AI-driven productivity  
- Creates a unified study workflow  

---

# ✦ System Architecture


┌─────────────────────────────────────────┐
│ User Interface │
│ React + TypeScript │
│ Tailwind CSS │
└──────────────┬──────────────────────────┘
│
┌───────┴────────┐
▼ ▼
┌─────────────┐ ┌──────────────────────┐
│ AI Layer │ │ Google Services │
│ │ │ │
│ Context │ │ Google OAuth │
│ Builder │ │ Calendar API │
│ + Gemini │ │ Gemini API │
└─────────────┘ └──────────────────────┘
│
┌───────┴────────────────────┐
▼ ▼
┌──────────────┐ ┌─────────────────┐
│ Supabase Auth│ │ user_progress │
│ │◄────────►│ (JSON + RLS) │
└──────────────┘ └─────────────────┘


---

# ✦ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend/Auth | Supabase |
| Database | Supabase (RLS enabled) |
| AI | Gemini 1.5 Flash |
| Google Services | Calendar API + OAuth |
| Testing | Vitest |

---

# ✦ Approach & Implementation

### AI Personalization Strategy
Every Gemini request includes:
- User study metrics  
- Streak data  
- Weak/strong subjects  

This ensures:
→ No generic responses  
→ Fully personalized coaching  

---

### Calendar Automation Logic
- Study session → auto calendar event  
- Stable key prevents duplicates  
- AI schedule → converted into events  

---

### Data Storage Strategy
- JSON-based flexible schema  
- RLS ensures data isolation  
- Fast reload across sessions  

---

# ✦ Testing Strategy

### ✔ Test Coverage (13 Tests Passing)

Modules tested:
- Study logic (progress %, streaks)  
- Gemini prompt correctness  
- Session logging & duplication prevention  

### ✔ Why Testing Matters
Ensures:
- Accurate analytics  
- Reliable AI outputs  
- Stable system behavior  

---

# ✦ Local Setup

```bash
# Clone repo
git clone https://github.com/IamMradul/StudyNX.git
cd StudyNX

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run dev server
npm run dev

# Run tests
npm run test
✦ Environment Variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_CALENDAR_ID=
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-1.5-flash
✦ Assumptions
Users log study sessions regularly
Internet connection required for AI + Calendar
Gemini responses are advisory (not authoritative)
✦ Future Improvements
Multi-device sync optimization
Offline mode support
Advanced ML-based performance prediction
Notification system for nudges
✦ Submission Checklist
✔ Rules
Public repository
Single branch
.env.example included
No exposed API keys
✔ Evaluation Criteria
Code Quality → TypeScript strict + modular design
Security → RLS + env-based keys
Efficiency → optimized API usage
Testing → 13 unit tests
Accessibility → responsive UI + readable design
Google Services → deeply integrated
✦ Author

Mradul Gupta
GitHub: https://github.com/IamMradul

✦ License

MIT License


---
