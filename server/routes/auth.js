
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

const router = express.Router();

// FIX: Added fallbacks so it works without .env in development
const MANAGER_ACCESS_CODE = process.env.MANAGER_CODE || "123456";
const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret_key_123";

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, branchName, accessCode } = req.body;
    console.log(`[REGISTER] Attempt: ${email} as ${role}`);

    // Check duplicates
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        console.warn(`[REGISTER] Failed: Email ${email} already exists.`);
        return res.status(400).json({ message: 'Email already registered. Please log in.' });
    }

    // Role Logic
    let assignedBranchId = undefined;
    let managedBranchIds = [];

    if (role === 'MANAGER') {
        if (accessCode !== MANAGER_ACCESS_CODE) {
            console.warn(`[REGISTER] Failed: Invalid Manager Code for ${email}`);
            return res.status(403).json({ message: 'Invalid Manager Access Code' });
        }
    } else if (role === 'PHARMACIST') {
        if (!branchName) {
            console.warn(`[REGISTER] Failed: Missing branch name for Pharmacist ${email}`);
            return res.status(400).json({ message: 'Branch name required' });
        }
        
        let branch = await Branch.findOne({ name: new RegExp(`^${branchName}$`, 'i') });
        if (!branch) {
            branch = new Branch({ name: branchName, location: 'New Location' });
            await branch.save();
            console.log(`[REGISTER] Created new branch: ${branchName}`);
        }
        assignedBranchId = branch._id;
    } else if (role === 'OWNER') {
        if (branchName) {
            const branch = new Branch({ name: branchName, location: 'HQ' });
            await branch.save();
            console.log(`[REGISTER] Owner created branch: ${branchName}`);
        }
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        assignedBranchId,
        managedBranchIds
    });

    await user.save();
    console.log(`[REGISTER] Success: User ${email} created.`);

    // Generate Token
    // FIX: Use the fallback JWT_SECRET defined above
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { ...user._doc, password: undefined, id: user._id } });

  } catch (err) {
    console.error("[REGISTER] Critical Error:", err);
    res.status(500).json({ message: "Server error during registration. Check console for details." });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, branchName, accessCode } = req.body;
    console.log(`[LOGIN] Attempt: ${email} as ${role}`);

    const user = await User.findOne({ email });
    if (!user) {
        console.warn(`[LOGIN] Failed: User ${email} not found.`);
        return res.status(400).json({ message: 'User not found. Please register first.' });
    }

    // Informative Role Check
    if (user.role !== role) {
        console.warn(`[LOGIN] Failed: Role mismatch for ${email}. Expected ${user.role}, got ${role}.`);
        return res.status(400).json({ 
            message: `Role mismatch. This email is registered as ${user.role}. Please switch to the ${user.role} tab.` 
        });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
        console.warn(`[LOGIN] Failed: Invalid password for ${email}.`);
        return res.status(400).json({ message: 'Invalid password' });
    }

    // Security Checks
    if (role === 'MANAGER' && accessCode !== MANAGER_ACCESS_CODE) {
        console.warn(`[LOGIN] Failed: Invalid Access Code for Manager ${email}`);
        return res.status(403).json({ message: 'Invalid Access Code' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    console.log(`[LOGIN] Success: ${email} logged in.`);
    res.json({ token, user: { ...user._doc, password: undefined, id: user._id } });

  } catch (err) {
    console.error("[LOGIN] Error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ ...user._doc, id: user._id });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default router;
