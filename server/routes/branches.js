import express from 'express';
import Branch from '../models/Branch.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;