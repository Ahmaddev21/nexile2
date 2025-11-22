import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  barcode: { type: String },
  batchNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  branchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);