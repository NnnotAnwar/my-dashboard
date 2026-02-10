# 🚀 Personal Dashboard & AI Task Manager

> **⚠️ Status: Work in Progress**
> This project is currently under active development. Most features are still being built and polished.

> **📝 Note:** Code comments in this repository are often written in Russian.

A modern, high-performance web application for personal productivity. It combines a real-time dashboard with an AI-powered task manager.

Built with **React 18**, **TypeScript**, and **Supabase**, featuring **Google Gemini AI** integration for smart task generation.

![Project Preview](public/pwa-512x512.png)


---

## 🛠 Tech Stack

Designed with a focus on code quality, performance, and user experience.

### Frontend
* **React 18** + **TypeScript** — Component-based architecture with static typing.
* **Vite** — Next-generation frontend tooling for instant server start.
* **TanStack Query (React Query)** — Server state management, caching, and optimistic UI updates.
* **Tailwind CSS** — Utility-first CSS for rapid and responsive UI design.
* **Framer Motion** — Production-ready animations (lists, modals, transitions).
* **Lucide React** — Beautiful & consistent iconography.

### Backend & Services
* **Supabase** — Open source Firebase alternative (PostgreSQL Database, Auth, Realtime).
* **Google Gemini AI** — Generative AI to automatically break down complex goals into actionable sub-tasks.
* **Open-Meteo API** — Weather data fetching (no API key required).

---

## ✨ Key Features (Implemented)

### 🏠 Smart Dashboard
* **Time-Aware Greeting**: Welcomes the user based on the time of day.
* **Real-time Weather**: Cached weather data integration.
* **Productivity Summary**: Immediate view of pending tasks and daily status.

### ✅ Advanced Todo List
* **AI Assistant**: Input a vague goal (e.g., "Plan a trip"), and Gemini AI splits it into concrete steps.
* **Optimistic UI**: Interface updates instantly before the server responds, ensuring a snappy experience.
* **Categorization**: Organize tasks by Home, Work, Study, or Shopping.
* **CRUD Operations**: Full Create, Read, Update, Delete functionality backed by PostgreSQL.
* **Batch Actions**: "Complete All" or "Clear Completed" features.

### 🔐 Auth & Security
* **Supabase Auth**: Secure Email/Password login.
* **Role-Based Access Control (RBAC)**: Distinction between regular 'Users' and 'Admins'.
* **Admin Console**: Dedicated interface for administrative tasks (hidden for standard users).

---

## 🚧 Upcoming Features (Roadmap)

* [ ] **Calendar Module**: Drag-and-drop event planning.
* [ ] **Calculator**: Integrated quick-access calculator.
* [ ] **Weather Details**: 7-day forecast and more detailed metrics.
* [ ] **Profile Settings**: User avatar upload and password change.

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/NnnotAnwar/my-dashboard.git
cd my-dashboard
```
### 2. Install dependencies
```bash
npm install
```
### 3. Environment Setup
Create ```.env``` file in the root directory and add your keys:
```.env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_KEY=your_google_gemini_api_key
```
### 2. Run the App
```bash
npm run dev
```
----

## 🗄 Database Schema (Supabase)
To replicate the backend, run these SQL queries in your Supabase SQL Editor:
### 1. Create the ```todos``` table:
```SQL
create table todos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  is_completed boolean default false,
  user_id uuid references auth.users not null,
  due_date timestamp with time zone,
  category text default 'home'
);
```
### 2. Create the ```profiles``` table (for user roles):
```SQL
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'user'
);
```
---
## 📂 Project Structure
The project follows a modular architecture for better scalability:
```
src/
├── layout/         # Layout components (Sidebar, AppLayout)
├── modules/        # Feature-based modules
│   ├── Auth/       # Login & Registration components
│   ├── Dashboard/  # Main Dashboard (Data fetching with React Query)
│   ├── Todo/       # Task Manager (Mutations & Optimistic Updates)
│   └── ...
├── supabaseClient.ts # Supabase configuration
├── App.tsx         # Routing & Session handling
└── main.tsx        # Entry point & Providers (QueryClient)

```
