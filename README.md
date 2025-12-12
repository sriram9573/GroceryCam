# GroceryCam 🥦

Intelligent Grocery Receipt Reader & Pantry Manager.
Snap a photo of your receipt, and GroceryCam will digitize your items, update your pantry inventory, and suggest budget-friendly recipes.


## Features
- 📸 **Receipt OCR**: Extract line items using Google Cloud Vision.
- 🧹 **AI Normalization**: Clean messy receipt text into structured data with Gemini.
- 📦 **Smart Pantry**: Track what you have and see price history.
- 🍳 **Recipe Generator**: Get custom recipes based on your actual inventory.
- 📈 **Spend Analytics**: Visualize monthly spending and category breakdown.

## Tech Stack
- **Frontend**: Next.js 14, TailwindCSS, Zustand, Recharts
- **Backend**: Node.js, Express, Firebase Admin
- **Data**: Firestore, Firebase Storage
- **AI**: Google Vision API, Gemini 1.5 Flash

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase Project
- Google Cloud Project (Vision API enabled)
- Gemini API Key

### Installation

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd grocery-cam
   npm install
   ```

3. **Environment Setup**
    **CRITICAL**: This project requires valid API keys to function.
    
    👉 **[READ THE SETUP GUIDE HERE](docs/setup-guide.md)** 👈
    
    The guide will explain how to:
    - Create a Firebase Project
    - Get Google Cloud Vision credentials
    - Get a Gemini API Key
    - Configure your `.env` files safely.

    *Do not commit your `.env` files or `service-account.json` to GitHub!*

3. **Run Locally**
   Start both frontend and backend:
   ```bash
   npm run seed # Optional: Seed data
   npm run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001

## Deployment

### Frontend (Vercel)
1. Push to GitHub.
2. Import project in Vercel.
3. Set Root Directory to `apps/web`.
4. Add Environment Variables from `.env.example`.
5. Deploy.

### Backend (Cloud Run)
1. Build container:
   ```bash
   docker build -f infra/cloudrun.Dockerfile -t grocery-cam-api .
   ```
2. Push & Deploy to Cloud Run.
3. Set Environment Variables.

## Testing
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run e2e`

## Architecture
See [docs/architecture.md](docs/architecture.md) for details.
Read 'docs/setup-guide.md' for detailed configuration steps.
