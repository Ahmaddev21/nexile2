import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['OWNER', 'MANAGER', 'PHARMACIST'], 
    required: true 
  },
  assignedBranchId: { type: String }, // For Pharmacists
  managedBranchIds: [{ type: String }], // For Managers
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);