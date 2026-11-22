import mongoose from 'mongoose';
import { FIRST_MODEL_YEAR, US_STATE_CODES } from '../utils/usStates.js';

// A customer's vehicle. The owner link lives here only; Customer stores no vehicle array.
const vehicleSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: FIRST_MODEL_YEAR },
    color: { type: String, required: true, trim: true },
    state: { type: String, required: true, uppercase: true, trim: true, enum: US_STATE_CODES },
    licensePlate: { type: String, required: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  },
);

// A license plate is unique within its state (PRD US-04).
vehicleSchema.index({ state: 1, licensePlate: 1 }, { unique: true });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
