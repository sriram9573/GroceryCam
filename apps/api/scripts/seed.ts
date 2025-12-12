import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { db } from '../src/config/firebase.js';

dotenv.config();

const SEED_USER_ID = 'test-user-id';

async function seed() {
    console.log('🌱 Seeding data...');

    // 1. Create a User Pantry
    const pantryRef = db.collection('users').doc(SEED_USER_ID).collection('pantry');

    const items = [
        { name: 'Pasta', category: 'Pantry', quantity: 500, unit: 'g', updatedAt: new Date().toISOString(), priceHistory: [{ price: 1.29, date: '2023-10-01' }] },
        { name: 'Tomato Sauce', category: 'Pantry', quantity: 2, unit: 'count', updatedAt: new Date().toISOString(), priceHistory: [{ price: 2.50, date: '2023-10-01' }] },
        { name: 'Eggs', category: 'Dairy', quantity: 12, unit: 'count', updatedAt: new Date().toISOString(), priceHistory: [{ price: 3.99, date: '2023-10-05' }] },
        { name: 'Olive Oil', category: 'Pantry', quantity: 1, unit: 'count', updatedAt: new Date().toISOString(), priceHistory: [{ price: 8.99, date: '2023-09-15' }] },
    ];

    for (const item of items) {
        // Mock ID
        const id = item.name.toLowerCase().replace(/ /g, '-');
        await pantryRef.doc(id).set(item);
    }

    // 2. Create some Receipts for Analytics
    const receiptsRef = db.collection('receipts');
    const receipts = [
        {
            userId: SEED_USER_ID,
            total: 15.50,
            createdAt: '2023-10-01T10:00:00Z',
            updatedAt: '2023-10-01T10:00:00Z',
            items: [{ category: 'Pantry', lineTotal: 3.79 }, { category: 'Dairy', lineTotal: 3.99 }]
        },
        {
            userId: SEED_USER_ID,
            total: 45.20,
            createdAt: '2023-11-01T10:00:00Z',
            updatedAt: '2023-11-01T10:00:00Z',
            items: [{ category: 'Meat', lineTotal: 25.00 }, { category: 'Produce', lineTotal: 15.00 }]
        }
    ];

    for (const r of receipts) {
        await receiptsRef.add(r);
    }

    console.log('✅ Seed complete!');
    process.exit(0);
}

seed().catch(console.error);
