# CollabCode - Real-time Collaborative Code Editor

A production-ready Real-time Collaborative Code Editor built using the MERN stack and Socket.io. Features robust multi-user scaling, secure JWT authentication with password protections, and sleek React state synchronization utilizing Debouncing and Monaco Editor.

## Features ✨
- **Dynamic Rooms**: Create your own sandbox environment or join via a unique ID.
- **Real-time Synchronized Coding**: Integrated with Socket.io utilizing a 500ms debounce loop for high-performance scale and seamless user-typing synchronization.
- **Typing Indicators**: Live "User is typing..." indicators ensure a smooth collaborative experience.
- **VS Code Inspired Layout**: Utilizing `@monaco-editor/react` layered on top of pristine Tailwind CSS.
- **Persist Projects via UI**: Explicit "Save to DB" pipeline leveraging MongoDB to snapshot historical timelines of your projects.
- **Secure Authentication**: Backend enforces 8-character complex passwords minimum with salted bcrypt hashes. Robust interceptors prevent unauthorized access and instantly revoke stale tokens locally.

## Tech Stack 💻
- **Frontend**: React (Vite), Tailwind CSS, Monaco Editor, Lucide React, Axios.
- **Backend**: Node.js, Express, Socket.io, JSONWebToken, BcryptJS.
- **Database**: MongoDB (Mongoose Schema Pattern).

## Setup & Quick Start 🚀

### 1. Database Setup
Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or run a local instance of MongoDB.
Copy your Connection URI string.

### 2. Backend Initialization
Open a terminal and navigate to the backend directory:
```bash
cd server
cp .env.example .env
```
Edit `server/.env` and add your `MONGO_URI` and your secret `JWT_SECRET`.

```bash
npm install
npm run dev
```

### 3. Frontend Initialization
Open a separate terminal window and navigate to the frontend directory:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
*(Vite runs on localhost:5173)*

---
> Designed with ❤️ using the MERN Stack.
