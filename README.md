# MindBridge — AI-Powered Mental Wellness Companion

MindBridge is a full-stack AI emotional wellness companion web application designed to support daily self-reflection, emotional regulation, and mindful personal growth.

> **Disclaimer:** MindBridge is an emotional wellness support tool and does not provide medical diagnoses, clinical psychological evaluations, or healthcare treatments. It does not replace licensed mental-health professionals.

---

## 🌟 Key Features

1. **Firebase Authentication**: Email and password registration, login, session persistence, and profile management with Firebase UID data isolation.
2. **Empathetic AI Companion Chat**: Powered server-side by Google Gemini with active listening, non-judgmental validation, healthy coping recommendations, and strict non-diagnostic ethical boundaries.
3. **Daily Mood Tracker**: Log 8 distinct core emotions (*Very Happy, Happy, Neutral, Sad, Very Sad, Anxious, Angry, Stressed*) with optional contextual notes, timestamping, and historical review.
4. **Private Digital Journal**: Encrypted journal entries stored securely in Firestore.
5. **AI Sentiment & Emotional Tone Analysis**: Automatic evaluation of journal entries providing sentiment classification (*Positive, Neutral, Negative*), numeric tone scores (-1.0 to +1.0), felt emotion tags, and empathetic reflections.
6. **Distress & Crisis Detection**: Multi-keyword and pattern-based safety checks that provide immediate, supportive 24/7 crisis resources (*988 Suicide & Crisis Lifeline, Crisis Text Line 741741, Trevor Project, International Befrienders*).
7. **Interactive Wellness Toolkit**:
   - **4x4 Box Breathing & 4-7-8 Relaxation Pacer**: Real-time visual breathwork coaches with animated rhythms.
   - **5-4-3-2-1 Sensory Grounding Tool**: Step-by-step interactive tool for calming panic or racing thoughts.
   - **Personalized Micro-Practices**: Tailored recommendations generated from recent user mood history.
8. **Analytics Dashboard**: Interactive Chart.js visualizations including:
   - **Mood Trajectory Line Chart** (Scores over time)
   - **Mood Distribution Bar Chart** (Frequency of check-ins)
   - **Journal Tone Doughnut Chart** (Positive / Neutral / Negative breakdown)
   - Average score metrics, top emotion indicators, and entry totals.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Analytics Visualizations**: Chart.js, React-ChartJS-2
- **Backend API**: Node.js & Express REST API (modularly designed for seamless migration to Python/FastAPI if needed)
- **Database**: Firebase Cloud Firestore
- **Authentication**: Firebase Authentication
- **AI Services**: Google GenAI SDK (`@google/genai` Gemini 2.5 Flash)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn

### 2. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
# Gemini API Key (Server-side)
GEMINI_API_KEY="your-gemini-api-key-here"

# Application URL
APP_URL="http://localhost:3000"

# Firebase Client Configuration (Optional if firebase-applet-config.json is present)
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_DATABASE_ID="(default)"
```

### 4. Running Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 5. Production Build

```bash
npm run build
npm start
```

---

## 📦 Firestore Collections & Security Rules

MindBridge isolates user data by `user_id == request.auth.uid`:

- `users`: User profiles `{ user_id, name, email, created_at }`
- `mood_entries`: Mood check-ins `{ mood_id, user_id, mood, note, created_at }`
- `journal_entries`: Digital journal entries `{ journal_id, user_id, content, created_at }`
- `sentiment_analysis`: Emotional tone scores `{ analysis_id, journal_id, user_id, sentiment, sentiment_score, emotional_insight, created_at }`
- `chat_history`: Companion chat pairs `{ chat_id, user_id, user_message, ai_response, created_at }`

---

## 🌐 Deploying to Vercel / Cloud Run

### Synchronizing with GitHub:
1. Initialize git: `git init && git add . && git commit -m "Initial commit"`
2. Add remote repository: `git remote add origin https://github.com/your-username/mindbridge.git`
3. Push: `git push -u origin main`

### Vercel Deployment:
1. Import repository on [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Add environment variables in Vercel Project Settings:
   - `GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy!
