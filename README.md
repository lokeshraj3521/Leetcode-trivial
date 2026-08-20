# 🚀 LeetCode Friends Tracker

> **Automated Competitive LeetCode Tracking, Weighted Scoring, Real-Time Push Notifications, & AI Insights for Friend Groups.**

---

## 📌 Overview

**LeetCode Friends Tracker** is a full-stack, zero-friction competitive platform inspired by fitness step-count contests. Friends (and public user groups) link their LeetCode usernames, and the platform **automatically syncs solved problems in real-time** without requiring passwords, Chrome extensions, or manual submission logging.

It features **weighted difficulty scoring**, **GitHub-style contribution heatmaps**, **group leaderboards (Daily, Weekly, All-Time)**, **Firebase Cloud Messaging (FCM) push notifications**, and an **AI Insights engine** that detects weak topic tags and generates personalized practice suggestions.

---

## 🎯 Core Concept & Differentiation

### Why Build This?
Existing tools are either Chrome extensions (contest-only), unmaintained scripts, or solo streak trackers. **LeetCode Friends Tracker** fills the gap by providing a comprehensive, multi-user web app + PWA with:

1. **Zero-Trust Authentication**: Uses LeetCode's public GraphQL endpoint. Only usernames are stored—no passwords or session cookies needed.
2. **Automated Synchronization**: Background poller checks for new Accepted (AC) submissions every 2–5 minutes per user.
3. **Fair Weighted Scoring**:
   - 🟢 **Easy**: 1 point
   - 🟡 **Medium**: 3 points
   - 🔴 **Hard**: 5 points
   - *First AC per problem awarded only to prevent resubmission farming.*
4. **Messaging & Notification Service**: Real-time FCM Web Push alerts + live in-app activity feed whenever a friend solves a problem.
5. **AI Weak-Topic Detector & Roast Engine**: Leverages LLMs/RAG analytics to highlight topic gaps (e.g., Dynamic Programming, Graphs) and generate witty weekly recaps.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **Database & ORM**: SQLAlchemy 2.0 (Async) + Pydantic v2
- **Supported Databases**: SQLite (zero-config local dev) / PostgreSQL (production)
- **Background Jobs**: APScheduler async worker
- **Messaging & Push**: Firebase Admin SDK (FCM) + In-App Activity Log
- **AI Integration**: LangChain / OpenAI / Gemini SDKs (with built-in analytical fallback engine)

### **Frontend**
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS + Lucide Icons
- **Data Visualization**: Recharts + Custom GitHub-style Heatmap Grid
- **PWA & Push**: Service Worker + Web App Manifest for mobile installation

### **DevOps & Deployment**
- **Containers**: Docker & Docker Compose
- **Production Hosts**: Render / Railway / Fly.io / AWS

---

## 🔄 System Architecture & Data Flow

```
   [ LeetCode User Solves Problem ]
                 │
                 ▼
   [ Background Polling Worker ]   <-- Polls public GraphQL endpoint every 2-5 min
                 │
                 ▼
   [ Deduplication Engine ]        <-- Validates unique leetcode_submission_id
                 │
                 ▼
   [ Points & Streak Service ]     <-- Calculates Easy(1), Medium(3), Hard(5) & streaks
                 │
       ┌─────────┴───────────────────────────────┐
       ▼                                         ▼
[ Database Persistence ]          [ Messaging & Notification Service ]
(UserStats, Submissions)          ├── Sends FCM Web Push to group members
                                  └── Logs to in-app activity feed
       │
       ▼
[ AI Insights Engine ]             <-- Analyzes topic gaps & generates suggestions
```

---

## 📲 Messaging & Push Notification Service

The **Messaging Service** (`app/services/messaging.py`) operates as a dual-channel notification engine:

1. **Web Push (FCM)**: Registers device tokens (`/api/notifications/register-token`). When User *A* solves a problem, group members receive phone/browser push notifications:
   > 🚀 **Raj solved "Trapping Rain Water"!**  
   > *Difficulty: Hard | +5 pts | Current Group Rank: #1*
2. **In-App Activity Feed**: Records all events in `notification_log` so users without push enabled can view recent friend achievements directly in the UI dashboard drawer.

---

## 🧠 AI Insights Engine

The **AI Engine** (`app/services/ai_insights.py`) processes user submission history to provide actionable guidance:

- 📊 **Weak-Topic Detector**: Compares solved problem tags against standard interview topic distributions to identify neglected areas (e.g., "Solved 15 Arrays, 0 Dynamic Programming").
- 🤖 **Weekly AI Recap & Roast**: Auto-generates shareable, entertaining weekly summaries of group activity.
- 🎯 **Smart Problem Suggester**: Recommends the next optimal problem tailored to user gaps and group trends.

*Note: AI responses are cached with `valid_until` timestamps to optimize API latency and LLM costs.*

---

## 🗄️ Database Schema Overview

```sql
-- Users & Groups
users (id UUID PK, leetcode_username TEXT UNIQUE, display_name TEXT, created_at TIMESTAMP)
groups (id UUID PK, name TEXT, invite_code TEXT UNIQUE, created_by UUID FK)
group_members (group_id UUID FK, user_id UUID FK, PRIMARY KEY (group_id, user_id))

-- Solved Submissions (Deduplicated)
submissions (
  id UUID PK,
  user_id UUID FK,
  leetcode_submission_id TEXT UNIQUE, -- critical deduplication key
  problem_slug TEXT,
  problem_title TEXT,
  difficulty TEXT, -- 'Easy', 'Medium', 'Hard'
  language TEXT,
  topic_tags JSON,
  points_awarded INT,
  submitted_at TIMESTAMP
)

-- Real-Time Leaderboard Stats & Streaks
user_stats (
  user_id UUID PK FK,
  total_points INT,
  easy_count INT,
  medium_count INT,
  hard_count INT,
  current_streak INT,
  longest_streak INT,
  last_solved_date DATE
)

-- Push Tokens & Activity Log
device_tokens (id UUID PK, user_id UUID FK, fcm_token TEXT, platform TEXT)
notification_log (id UUID PK, triggered_by_user_id UUID FK, submission_id UUID FK, sent_to_user_id UUID FK, sent_at TIMESTAMP, status TEXT)

-- AI Insights Cache
ai_insights (id UUID PK, user_id UUID FK, insight_type TEXT, content JSON, valid_until TIMESTAMP)
```

---

## 🚀 Quick Start & Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/yourusername/leetcode-tracker-project.git
cd leetcode-tracker-project
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python seed.py              # Seeds demo users & triggers initial sync
uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 🐳 Docker Deployment

To launch the full stack with PostgreSQL using Docker Compose:

```bash
docker-compose up --build -d
```

---

## 💡 Resume & Technical Pitch

- **Distributed Systems Design**: Polling architecture with rate-limiting backoff, idempotency guarantees, and payload deduplication.
- **Real-Time Push Infrastructure**: Web Push PWA integration using Firebase Cloud Messaging (FCM).
- **Production-Grade API**: Built with FastAPI, Pydantic v2, and Async SQLAlchemy supporting SQLite & PostgreSQL seamlessly.
- **Applied AI / LLMs**: Meaningful data-driven prompt engineering and analytical fallbacks for weak topic identification.

---

## 📄 License
MIT License. Free to use, modify, and build upon!
