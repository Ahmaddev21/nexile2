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
    // HYBRID TRANSACTION LOGIC
    // 1. Check if the database supports sessions (Replica Set)
    // This prevents crashes on Standalone/Local MongoDB instances
    try {
        // @ts-ignore - Internal mongoose check
        const client = mongoose.connection.getClient();
        if (client.topology && client.topology.hasSessionSupport()) {
            session = await mongoose.startSession();
            session.startTransaction();
        }
    } catch (e) {
        console.warn("Transactions not supported on this MongoDB instance. Falling back to standard write.");
        session = null;
    }

    // 2. Create Transaction Record
    // Pass session if it exists, otherwise undefined
    const transaction = new Transaction(req.body);
    await transaction.save(session ? { session } : undefined);

    // 3. Update Stock for each item
    for (const item of req.body.items) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            session ? { session } : undefined
        );
    }

    // 4. Commit if session exists
    if (session) {
        await session.commitTransaction();
    }
    
    res.status(201).json(transaction);

  } catch (err) {
    console.error("Transaction Failed:", err);
    
    // Rollback if session was active
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