import mongoose from 'mongoose';

const mechanicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['mechanic'], default: 'mechanic', immutable: true },
    assignedRepairs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repair' }],
  },
  { timestamps: true },
);

export const Mechanic = mongoose.model('Mechanic', mechanicSchema);
