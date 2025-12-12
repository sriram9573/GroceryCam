# Architecture & Data Flow

## System Overview

GroceryCam is a full-stack application leveraging OCR and LLMs to digitize grocery shopping and assist in meal planning.

## Data Flow

### 1. Ingestion (Receipt Upload)
1. **User** takes a photo of a receipt or uploads an image via `apps/web`.
2. Image is directly uploaded to **Firebase Storage** (client-side SDK) to reduce server load.
3. Client sends the resulting Storage URL to `apps/api` (`POST /api/ocr`).

### 2. Processing (OCR & Normalization)
1. `apps/api` receives the image URL.
2. Server calls **Google Cloud Vision API** (Text Detection) to extract raw text and bounding boxes.
3. Server parses raw text into a rough list of line items (heuristic parsing).
4. Server sends the raw text block + heuristics to **Google Gemini** (via AI Studio SDK).
5. **Gemini** returns a standardized JSON array of items (Normalized Name, Category, Qty, Unit).
6. Server returns this structured data to the Client for review.

### 3. Confirmation (Pantry Update)
1. User reviews the items on the frontend, correcting any errors.
2. User submits the final list to `apps/api` (`POST /api/update-pantry`).
3. Server performs a transaction on **Firestore**:
    - Updates `receipts` collection with the finalized receipt.
    - Iterates through items to upsert into `pantry/{userId}/items`.
    - Updates `priceHistory` for each item.

### 4. Consumption (Recipe Generation)
1. Client requests recipes (`GET /api/recipes`).
2. Server fetches current user's `pantry` from Firestore.
3. Server constructs a prompt with the pantry inventory and sends it to **Gemini**.
4. **Gemini** generates 5 recipes that maximize pantry usage.
5. Server returns recipes to Client.

## Infrastructure
- **Frontend**: Vercel (Next.js)
- **Backend**: Cloud Run (Node.js/Express Docker Container) or Vercel Serverless
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Auth
- **AI**: Vertex AI / AI Studio (Gemini), Vision API
