# 🏛️ Community Hero — Civic Issue Reporting Portal

<div align="center">

![Community Hero](https://img.shields.io/badge/Government%20of%20India-Civic%20Portal-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-046A38?style=for-the-badge)

**सामुदायिक हीरो** — *File it once. We'll see it through.*

A full-stack civic issue reporting platform that bridges the gap between citizens and local government authorities. Report potholes, broken streetlights, water leaks, and garbage — directly to the civic office. Every case is logged, tracked, and resolved transparently.

[Live Demo](https://your-site.netlify.app) · [Report a Bug](https://github.com/YOUR_USERNAME/community-hero/issues) · [Request Feature](https://github.com/YOUR_USERNAME/community-hero/issues)

</div>

---

## 📸 Screenshots

| Landing Page | Case Ledger | Report an Issue |
|:---:|:---:|:---:|
| ![Landing](https://via.placeholder.com/280x160/1a3c6e/ffffff?text=Landing+Page) | ![Ledger](https://via.placeholder.com/280x160/046A38/ffffff?text=Case+Ledger) | ![Report](https://via.placeholder.com/280x160/FF6B00/ffffff?text=File+a+Report) |

---

## ✨ Features

### For Citizens
- 📋 **File reports** — submit civic issues with title, photo, and GPS location in under 60 seconds
- 🗺️ **Live map** — view all reported issues pinned on an interactive Google Map
- 👍 **Upvote issues** — community upvoting surfaces the most urgent problems
- 📊 **Public ledger** — every case is publicly visible with real-time status tracking
- 🔔 **Status tracking** — follow your case from *Reported* → *Verified* → *In Progress* → *Resolved*

### For Administrators
- 👑 **Admin dashboard** — verify, update status, and delete issues from any device
- 🔄 **Real-time sync** — Firestore live listener pushes updates to every open tab instantly
- 📁 **AI photo analysis** — uploaded photos are automatically analysed to detect issue category and severity
- 📈 **Resolution metrics** — live resolution rate and case count statistics

### Platform
- 🔒 **Secure auth** — Firebase Authentication for citizens, JWT for admin
- 📱 **Mobile first** — fully responsive down to 320px, with touch-friendly controls
- ⚡ **Real-time** — Firestore `onSnapshot` listener; no manual refresh needed
- 🌐 **Transparent governance** — 100% public case ledger, no hidden resolutions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6 |
| **Styling** | Inline styles with responsive media queries, Noto Sans (Google Fonts) |
| **Maps** | Google Maps JavaScript API (`@react-google-maps/api`) |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore (real-time) |
| **Auth** | Firebase Authentication + JWT |
| **File Storage** | Base64 image encoding in Firestore |
| **AI Analysis** | Anthropic Claude API (photo → category + severity) |
| **Deployment** | Netlify (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Firebase](https://firebase.google.com) project with Firestore and Authentication enabled
- A [Google Maps API key](https://developers.google.com/maps) with Maps JavaScript API enabled
- An [Anthropic API key](https://console.anthropic.com) (for AI photo analysis)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/community-hero.git
cd community-hero
```

**2. Set up the backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key

# Admin credentials
ADMIN_EMAIL=admin@communityhero.gov.in
ADMIN_PASSWORD=your_secure_admin_password

# Firebase Service Account
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Anthropic (for AI photo analysis)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**3. Set up the frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MAPS_API_KEY=your_google_maps_api_key

# Firebase Web Config
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**4. Run locally**

In one terminal:
```bash
cd backend
npm run dev
```

In another terminal:
```bash
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
community-hero/
│
├── backend/
│   ├── controllers/
│   │   └── issueController.js   # Issue CRUD + AI analysis
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   ├── authRoutes.js        # Login endpoints
│   │   └── issueRoutes.js       # Issue endpoints
│   ├── firebase.js              # Firebase Admin SDK init
│   ├── serviceAccountKey.json   # Firebase service account (gitignored)
│   ├── index.js                 # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── _redirects           # Netlify SPA routing fix
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Public home page
│   │   │   ├── Home.jsx         # Authenticated map + issue list
│   │   │   ├── Login.jsx        # Citizen + admin sign in
│   │   │   ├── Register.jsx     # Citizen registration
│   │   │   └── Report.jsx       # File a new issue
│   │   ├── firebase.js          # Firebase client SDK init
│   │   ├── App.jsx              # Router + nav
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## 🌍 Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Add all backend environment variables from `.env`
5. Deploy — copy the generated URL (e.g. `https://community-hero-api.onrender.com`)

### Frontend → Netlify

1. Update `frontend/.env`:
   ```env
   REACT_APP_API_URL=https://community-hero-api.onrender.com
   ```
2. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```
3. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
4. Drag and drop the `frontend/build/` folder
5. Add environment variables under **Site → Environment variables**

### Update CORS

In `backend/index.js`, add your Netlify URL:
```js
app.use(cors({
  origin: [
    'https://your-site.netlify.app',
    'http://localhost:3000',
  ],
  credentials: true,
}));
```

---

## 🔐 Authentication Flow

```
Citizen Login                    Admin Login
─────────────────                ─────────────────────
Firebase Auth                    Backend credential check
    ↓                                ↓
Get ID Token                     Verify email + password
    ↓                                ↓
POST /api/auth/login             POST /api/auth/login
    ↓                                ↓
Backend verifies token           Backend issues JWT
    ↓                                ↓
JWT stored in localStorage       JWT stored in localStorage
    ↓                                ↓
Access protected routes          Access admin actions
```

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login (citizen via Firebase ID token, admin via credentials) |

### Issues

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/issues` | Public | Fetch all issues |
| `POST` | `/api/issues` | Citizen | File a new issue (with photo) |
| `PATCH` | `/api/issues/:id/status` | Admin | Update issue status |
| `PATCH` | `/api/issues/:id/upvote` | Citizen | Upvote an issue |
| `DELETE` | `/api/issues/:id` | Admin | Delete an issue |

---

## 🗺️ Issue Lifecycle

```
Citizen files report
        ↓
   [ Reported ]  ←── Initial state, awaiting review
        ↓
   [ Verified ]  ←── Staff confirms the issue is real
        ↓
 [ In Progress ]  ←── Field crew assigned and working
        ↓
   [ Resolved ]  ←── Work complete, case closed permanently
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature-name`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push to the branch — `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure your code follows the existing style and all environment variables are documented.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Firebase](https://firebase.google.com) — real-time database and authentication
- [Google Maps Platform](https://developers.google.com/maps) — interactive issue mapping
- [Anthropic Claude](https://anthropic.com) — AI-powered photo analysis
- [Render](https://render.com) — backend hosting
- [Netlify](https://netlify.com) — frontend hosting
- Government of India design guidelines for the tricolor civic aesthetic

---

<div align="center">

**सत्यमेव जयते — Truth Alone Triumphs**

Built with ❤️ for transparent civic governance

</div>
