# 📅 PolyU Calendar Manager

<div align="center">

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**The ultimate tool for managing and syncing your PolyU schedule.**

[Key Features](#-key-features) •
[Getting Started](#-getting-started) •
[Deployment](#-deployment-guide)

</div>

---

## 🌟 Introduction

Welcome to the **PolyU Calendar Manager**. This application is designed to help students seamlessly manage, merge, and synchronize their university class schedules with their personal calendar applications (like **Google Calendar**, **Outlook**, or **Apple Calendar**).

Say goodbye to manual entry and missed classes. With cloud synchronization, your schedule follows you everywhere.

## 🚀 Key Features

### 📥 Effortless Import
- **.ics Support**: Simply download your class timetable from the university portal and drop existing `.ics` files directly into the app.
- **Instant Preview**: Your classes appear immediately on the interactive calendar view.

### 🗓️ Smart Calendar Management
- **Interactive Views**: Switch between **Day**, **Week**, and **Month** views to visualize your workload.
- **Event Control**: Edit event details, delete unwanted sessions, or restore them from the **Recycle Bin**.
- **Bulk Actions**: Quickly delete or restore events by "Subject" (e.g., clear all tutorials for a dropped course).

### 🔄 Universal Sync
- **One-Click Subscription**: Generate a unique, private URL to subscribe to your calendar.
- **Auto-Sync**: Changes you make in the app reflect automatically in Google Calendar, Outlook, and Apple Calendar.

### 📊 Insights & Tools
- **Analytics**: Visualize your study load with subject breakdowns and hour distributions.
- **Export**: Download a clean `.ics` file backup at any time.

---

## 🏁 Getting Started

### 1. Account Creation & Login
To unlock cloud features:
- **Sign Up**: Use your email to receive a secure magic link.
- **Sign In**: Access your synchronized calendar data from any browser.

### 2. Terms of Service
Transparency is key. Upon your first visit, please review our [Terms of Service](docs/term%20of%20service.md).
> *Note: This is a student-led project and is not officially affiliated with PolyU.*

## ⚡ Tech Stack

Built with modern web technologies for speed and reliability:

- **Frontend**: ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
- **Backend / DB**: ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
- **Styling**: Vanilla CSS (Optimized for performance)

---

## 🛠️ Deployment Guide

Optimized for **Vercel** + **Supabase**. Follow these steps to deploy your own instance.

### Prerequisites
1.  **Vercel Account**: [Sign up](https://vercel.com/signup)
2.  **Supabase Account**: [Sign up](https://supabase.com/)
3.  **GitHub Repository**: Push this code to your GitHub.

### Step 1: Supabase Setup
1.  **Create a Project** in Supabase.
2.  Navigate to the **SQL Editor**.
3.  Run the contents of `supabase/init.sql` from this repo.
    - *This sets up tables (`events`, `user_calendars`) and RLS policies.*

### Step 2: Vercel Configuration
1.  Import your repo into Vercel.
2.  Set the following **Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase `service_role` key (Backend API) |
| `VITE_ENABLE_API_ACCESS` | Set to `true` to enable API menus |
| `VITE_SHOW_TOS` | Set to `true` to enable Terms of Service |

### Step 3: Launch 🚀
Click **Deploy** and wait for the build to finish. Your personal calendar manager is now live!

---

<div align="center">

Made with ❤️ for PolyU Students

</div>
