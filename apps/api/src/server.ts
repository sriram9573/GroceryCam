import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { receiptsRouter } from './routes/receipts.js';
import { pantryRouter } from './routes/pantry.js';
import { recipesRouter } from './routes/recipes.js';
import { analyticsRouter } from './routes/analytics.js';
import { assistantRouter } from './routes/assistant.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/health', (req, res) => res.send('OK'));
app.use('/api', receiptsRouter);
app.use('/api', pantryRouter);
app.use('/api', recipesRouter);
app.use('/api', analyticsRouter);
app.use('/api', assistantRouter);

app.listen(PORT, () => {
    console.log(`API running on port ${PORT} - Server Revised`);
});
