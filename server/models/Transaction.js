import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  branchId: { type: String, required: true },
  userId: { type: String, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'ONLINE'], required: true }
});

export default mongoose.model('Transaction', transactionSchema);