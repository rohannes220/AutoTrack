import mongoose from 'mongoose';

// A customer account is created by a mechanic with a temporary password (PRD §12).
// Vehicles and repairs reference the customer; the customer stores no reference arrays.
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer'], default: 'customer', immutable: true },
  },
  { timestamps: true },
);

export const Customer = mongoose.model('Customer', customerSchema);
