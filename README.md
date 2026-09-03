<div align="center">

# 🚀 DevConnect

### AI-Powered Developer Collaboration Platform

Connect • Collaborate • Build • Network • Ship 🚀

<p align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>

<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white"/>

<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>

<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"/>

<img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>

<img src="https://img.shields.io/badge/JWT-black?style=for-the-badge"/>

<img src="https://img.shields.io/badge/Groq-AI-blueviolet?style=for-the-badge"/>

<img src="https://img.shields.io/badge/Cloudinary-4285F4?style=for-the-badge&logo=cloudinary&logoColor=white"/>

</p>

---

### 🌐 Live Demo

Coming Soon

### 📷 Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/60a2e3ab-6ffd-4557-9d15-be9f2becb238" />


Coming Soon

### 📖 Documentation

Coming Soon

</div>

---

# ✨ What is DevConnect?

DevConnect is an AI-powered social collaboration platform built exclusively for developers.

Unlike traditional professional networking platforms, DevConnect focuses on helping developers discover teammates, collaborate on real-world projects, communicate in real time, participate in hackathons, and grow together through AI-powered recommendations.

It combines social networking, project collaboration, messaging, and AI into one unified platform.

---

# 🚀 Features

## 👨‍💻 Developer Profiles

- Technical profile
- GitHub integration
- Resume upload
- Skills showcase
- Portfolio
- Education
- Experience

---

## 🤝 Smart Networking

- Follow Developers
- Connect with Developers
- Suggested Developers
- AI Recommendations
- Mutual Connections

---
## 💻 Live Collaborative Coding

Collaborate with your team in real time inside DevConnect.

### Features

- ⚡ Real-time collaborative code editor
- 👥 Multiple users can code simultaneously
- 🔄 Instant code synchronization
- 👀 Live cursor visibility
- 🔗 Join rooms with a shareable invite link

---

## 💬 Real-Time Messaging

- Socket.IO
- Typing Indicator
- Read Receipts
- Online Status
- Last Seen
- Encrypted Messages

---

## 🚀 Project Collaboration

- Create Teams
- Invite Developers
- Manage Projects
- Assign Roles
- Share Repository
- Tech Stack Tags

---

## 🤖 AI Features

- AI Developer Recommendations
- Smart Search
- Skill Suggestions
- Project Suggestions
- Team Matching

---

## 🔔 Notifications

- Real-time Notifications
- Friend Requests
- Messages
- Team Invites
- Project Updates

---

# 🛠 Tech Stack

| Category | Technologies |
|-----------|-------------|
| Frontend | React.js, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT, Google OAuth, GitHub OAuth |
| Real-Time | Socket.IO + Redis Adapter |
| Cache | Redis |
| Cloud Storage | Cloudinary |
| AI | Groq API |
| Security | Helmet, XSS, Rate Limiting, Mongo Sanitize, Bcrypt |
| Database Driver | Mongoose |

---

# 🏗 Architecture

```
               React Frontend
                      │
                      │
              REST APIs + Socket.IO
                      │
                      ▼
               Express Backend
      ┌────────────┼─────────────┐
      │            │             │
 Authentication  AI Engine   Chat Service
      │            │             │
      ▼            ▼             ▼
 JWT/OAuth      Groq API      Socket.IO
      │                          │
      └────────────┬─────────────┘
                   ▼
                 Redis
                   │
                   ▼
                MongoDB
```

---

# 📂 Folder Structure

```
DevConnect

client/

server/
 ├── config/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 ├── sockets/
 ├── services/
 ├── utils/
 ├── uploads/
 └── app.js

README.md
```

---

# ⚙️ Installation

```bash
git clone https://github.com/yourusername/devconnect.git

cd devconnect

npm install
```

Create a `.env`

```env
PORT=

CLIENT_URL=

MONGODB_URI=

JWT_SECRET=

REDIS_URL=

GROQ_API_KEY=

GOOGLE_CLIENT_ID=

GITHUB_CLIENT_ID=

GITHUB_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

MESSAGE_ENCRYPTION_KEY=
```

Run

```bash
npm run dev
```

---

# 🔒 Security

- JWT Authentication
- Password Hashing
- HTTP Security Headers
- XSS Protection
- MongoDB Injection Protection
- Secure Cookies
- Rate Limiting
- Message Encryption

---

# 📊 Why DevConnect?

| LinkedIn | DevConnect |
|-----------|------------|
| Professional networking | Developer collaboration platform |
| Generic profiles | Technical developer profiles |
| No project collaboration | Built-in collaboration tools |
| No teammate finder | AI teammate matching |
| No hackathon support | Dedicated hackathon ecosystem |
| No real-time messaging | Socket.IO messaging |
| Portfolio is optional | Portfolio-first approach |
| Business networking | Developer ecosystem |
| Limited technical discovery | Skill-based developer discovery |
| No AI recommendations | AI-powered recommendations |

---

# 🚀 Future Roadmap

- AI Resume Analyzer
- AI Mock Interviews
- Video Calling
- Screen Sharing
- Coding Rooms
- Team Analytics
- Open Source Events
- Hackathon Hosting
- AI Career Assistant
- Community Challenges

---

# ⭐ Support

If you like this project, don't forget to ⭐ the repository.

---

<div align="center">

Made with ❤️ by **Maninder Singh**

</div>
