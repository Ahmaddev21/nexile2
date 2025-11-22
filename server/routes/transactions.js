import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET TRANSACTIONS
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RECORD TRANSACTION (AND UPDATE STOCK)
router.post('/', verifyToken, async (req, res) => {
  let session = null;
  try {
    // SAFE SESSION DETECTION
    // Try to start a session. If it fails (Standalone DB), catch and proceed without transactions.
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (e) {
        // console.warn("MongoDB Sessions not supported (Standalone). Running in compatibility mode.");
        session = null;
    }

    // 1. Create Transaction Record
    const transaction = new Transaction(req.body);
    await transaction.save(session ? { session } : undefined);

    // 2. Update Stock
    for (const item of req.body.items) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            session ? { session } : undefined
        );
    }

    if (session) {
        await session.commitTransaction();
    }
    
    res.status(201).json(transaction);

  } catch (err) {
    console.error("Transaction Failed:", err);
    
    if (session) {
        await session.abortTransaction();
    }
    
    res.status(400).json({ message: err.message || "Transaction failed" });
  } finally {
    if (session) {
        session.endSession();
    }
  }
});

export default router;