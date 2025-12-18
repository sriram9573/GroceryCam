# GroceryCam 🥦 📸

**AI-Powered Smart Kitchen Assistant**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%2FAuth-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-blue?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 🚀 Overview

GroceryCam is an intelligent kitchen management platform that uses **Computer Vision** and **Generative AI** to automate pantry tracking and meal planning. 

Instead of manually typing grocery items, users simply snap a photo of their receipt or item. The app digitizes the items, categorizes them using AI, predicts expiration timelines, and generates personalized recipes based on what's actually in stock.

---

## ✨ Key Features

### 📸 **Receipt-to-Pantry (OCR & AI)**
- **Scanning**: Uses Google Cloud Vision to extract text from receipts.
- **Normalization**: Google Gemini AI corrects OCR errors, standardizes names (e.g., "Mngo Lrg" → "Mango"), and categorizes items automatically.
- **Multi-Scan**: Support for scanning multiple receipts in a single session.

### 🍳 **AI Recipe Chef**
- **Context-Aware**: Generates recipes based *only* on ingredients currently in your pantry.
- **Nutritional Info**: Estimates calories and macros for every generated recipe.
- **Dynamic Loading**: "Chef's Kitchen" animation keeps users engaged while recipes generate.

### 🎙️ **Voice Command Center**
- **Natural Language**: "Add 5 apples and a gallon of milk."
- **Intent Parsing**: AI understands quantity, unit, and item name from spoken commands.

### 📊 **Smart Dashboard**
- **Glassmorphic UI**: Premium, modern aesthetic with dark mode support.
- **Category Taxonomy**: Standardized grouping (Produce, Dairy, Pantry) for easy sorting.
- **Spend Analytics**: Visual charts to track monthly grocery spending.

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **State Management**: Zustand
- **Theme**: `next-themes` (Dark/Light mode)

### Backend & Services
- **Auth**: Firebase Authentication (Google/Email)
- **Database**: Firestore (Real-time updates)
- **Storage**: Firebase Storage (Receipt images)
- **AI Core**: 
    - **Google Cloud Vision API** (OCR)
    - **Google Gemini 1.5 Flash** (Data Normalization & Recipe Generation)

---

## 🏗️ Architecture

1.  **Upload**: User uploads image → stored in Firebase Storage.
2.  **Trigger**: Frontend calls `/api/ocr` → extract text via Cloud Vision.
3.  **Process**: Raw text sent to `/api/normalize-items` → Gemini converts messy text to JSON.
4.  **Review**: User confirms items in a polished UI → Data committed to Firestore.
5.  **Generate**: User requests recipe → Gemini analyzes Firestore inventory → streams Recipe JSON.

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project
- Google Cloud Project with Vision API enabled
- Gemini API Key

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/sriram9573/GroceryCam.git
    cd GroceryCam
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in `apps/web` and `apps/api`:
    ```env
    # Example
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    GOOGLE_APPLICATION_CREDENTIALS=...
    GEMINI_API_KEY=...
    ```
    *(See `docs/setup-guide.md` for full keys)*

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    - Web: `http://localhost:3000`
    - API: `http://localhost:3001`

---

## 🚀 Future Roadmap
- [ ] Barcode Scanning integration
- [ ] Multiple Users / Family Sharing
- [ ] Shopping List auto-generation from Recipes
