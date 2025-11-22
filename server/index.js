
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import branchRoutes from './routes/branches.js';
import transactionRoutes from './routes/transactions.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// FIX: Added fallback to local DB if env variable is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexile';

console.log(`[SERVER] Attempting to connect to MongoDB at: ${MONGODB_URI}`);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ [SERVER] MongoDB Connected Successfully'))
  .catch(err => {
      console.error('❌ [SERVER] MongoDB Connection Error:', err);
      console.log('HINT: Ensure MongoDB Community Server is running on your computer.');
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/transactions', transactionRoutes);

// --- PRODUCTION: Serve Static Frontend ---
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Nexile API is running (Dev Mode)...');
    });
}

app.listen(PORT, () => {
  console.log(`🚀 [SERVER] Server running on port ${PORT}`);
});
