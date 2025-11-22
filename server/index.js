import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import branchRoutes from './routes/branches.js';
import transactionRoutes from './routes/transactions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// FIX: Added fallback to local DB if env variable is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexile';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
      console.error('❌ MongoDB Connection Error:', err);
      console.log('HINT: Ensure MongoDB Community Server is running on your computer.');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/transactions', transactionRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Nexile API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});