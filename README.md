# 📚 Study Tracker

> Track. Analyze. Improve your study consistency.

---

## 🚀 Overview

Study Tracker is a full-stack web application designed to help students monitor and improve their learning habits through powerful visualizations and structured tracking.

It provides a **GitHub-style heatmap**, **subject-wise progress tracking**, and **detailed analytics** to ensure consistency and productivity.

---

## 🗄️ Supabase Progress Persistence (Tracklio)

Tracklio now supports saving progress to Supabase in addition to local browser storage.

Email login uses Supabase Auth when `VITE_GOOGLE_CLIENT_ID` is not set.
If `VITE_GOOGLE_CLIENT_ID` is set, Tracklio switches to direct Google OAuth (not Supabase Google provider).
The login page now includes:

- Sign In (email + password)
- Sign Up (email + password)
- Magic Link login
- Password reset email
- Google OAuth login (direct from Google)

### 1) Create env variables

Copy values from `.env.example` into a local `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2) Create the table in Supabase SQL editor

Run the SQL in `supabase/user_progress.sql`.

### 3) Enable email auth in Supabase

- Go to Supabase Dashboard -> Authentication -> Providers -> Email.
- Enable Email provider.
- Keep "Confirm email" enabled for magic link flow.

### 4) Enable Direct Google OAuth (Google Cloud Console)

1. Open Google Cloud Console -> APIs & Services -> Credentials.
2. Create OAuth Client ID of type Web application.
3. Add your app origins in Google console:
        - `http://localhost:5173` for local development
        - your production domain
4. Copy Google Client ID.
5. Add `VITE_GOOGLE_CLIENT_ID` in your `.env.local` file.

Note: Direct Google OAuth in this frontend-only setup does not create a Supabase auth session.

### 5) Run the app

```bash
npm install
npm run dev
```

### Behavior

- If Supabase env vars are set, progress is loaded on login and saved automatically on data changes.
- If Supabase is not configured, Tracklio keeps using localStorage only.
- Progress rows are scoped to the authenticated email via RLS policies.

---

## ✨ Features

### 📊 Visualization

* 🔥 GitHub-style heatmap for daily study activity
* 📈 Weekly, Monthly, and Yearly progress analytics
* 🎯 Circular progress bars for each subject

### 📘 Study Management

* ✅ Daily study tracking using checkbox system
* 📚 Add and manage multiple subjects
* 📝 Notes and important links section

### 🔐 Authentication

* Secure user login/signup
* Persistent data storage

### ⚡ User Experience

* Clean and responsive UI
* Fast and interactive dashboard

---

## 🏗️ Tech Stack

### Frontend

* React / Next.js
* Tailwind CSS
* Recharts / Chart.js

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT / Firebase Auth

---

## 🧩 System Architecture

```
Frontend (React / Next.js)
        ↓
API Layer (Node.js / Express)
        ↓
Database (MongoDB)
        ↓
Authentication (JWT / Firebase)
```

---

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/study-tracker.git
cd study-tracker
```

### 2️⃣ Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd server
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in server folder:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### 4️⃣ Run the application

```bash
# backend
npm run server

# frontend
npm run dev
```

---

## 📂 Folder Structure

```
study-tracker/
│── client/         # Frontend
│── server/         # Backend
│── screenshots/    # Images
│── README.md
```

---

## 🚧 Future Improvements

* ⏱️ Study timer integration
* 🔔 Reminder notifications
* 📱 Progressive Web App (PWA)
* 📊 Advanced analytics (AI-based suggestions)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Commit changes
4. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Mradul Gupta**

* GitHub: [https://github.com/IamMradul](https://github.com/IamMradul)
* LeetCode: [https://leetcode.com/u/Mradul_mg/](https://leetcode.com/u/Mradul_mg/)

---

## ⭐ Show your support

If you like this project, consider giving it a ⭐ on GitHub!
