# API Contracts

## Endpoints

### 1. OCR Processing
**POST /api/ocr**
- **Description**: Accepts an image URL (from Firebase Storage), runs Google Vision OCR.
- **Request Body**:
  ```json
  {
    "imageUrl": "https://storage.googleapis.com/...",
    "currency": "USD" // optional, default USD
  }
  ```
- **Response**:
  ```json
  {
    "receiptId": "uuid",
    "storeName": "Target",
    "rawText": "Target\nMilk 2.99...",
    "subtotal": 29.50,
    "tax": 1.50,
    "total": 31.00,
    "items": [
      {
        "description": "Milk 1gal",
        "totalPrice": 2.99
      }
    ]
  }
  ```

### 2. Item Normalization
**POST /api/normalize-items**
- **Description**: Uses Gemini to normalize raw OCR items into structured data.
- **Request Body**:
  ```json
  {
    "itemsRaw": [...],
    "rawText": "Full text context..."
  }
  ```
- **Response**:
  ```json
  {
    "items": [
      {
        "nameNorm": "Whole Milk",
        "category": "Dairy",
        "quantity": 1,
        "unit": "gal",
        "unitPrice": 2.99,
        "lineTotal": 2.99,
        "confidence": 0.95
      }
    ]
  }
  ```

### 3. Pantry Update
**POST /api/update-pantry**
- **Description**: Confirms items from receipt and updates user's pantry.
- **Request Body**:
  ```json
  {
    "receiptId": "uuid",
    "items": [ ...normalizedItems ]
  }
  ```
- **Response**:
  ```json
  {
    "merged": [], // updated pantry items
    "upsertedCount": 1,
    "updatedCount": 0
  }
  ```

### 4. Recipe Generation
**GET /api/recipes**
- **Description**: Generates recipes based on current pantry stock.
- **Query Params**: `budgetPerMeal` (optional), `dietary` (optional).
- **Response**:
  ```json
  {
    "recipes": [
      {
        "name": "Pantry Pasta",
        "ingredients": [
            { "name": "Pasta", "qty": 200, "unit": "g" }
        ],
        "steps": ["Boil water", "Cook pasta"],
        "estCost": 2.50,
        "cookTimeMin": 15
      }
    ]
  }
  ```

### 5. Analytics
**GET /api/savings**
- **Description**: Returns spending and savings data.
- **Response**:
  ```json
  {
    "monthlySpend": [{ "month": "2023-10", "total": 150.00 }],
    "categorySplit": [{ "category": "Dairy", "total": 20.00 }],
    "priceSparklines": {
        "Milk": [{ "date": "2023-10-01", "price": 2.99 }]
    }
  }
  ```
