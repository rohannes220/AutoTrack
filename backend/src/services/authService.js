import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Mechanic } from '../models/Mechanic.js';
import { AppError } from '../utils/AppError.js';

// One message for unknown email and wrong password, so responses don't reveal which emails exist.
const INVALID_CREDENTIALS = 'Invalid email or password';

export async function loginMechanic({ email, password }) {
  const mechanic = await Mechanic.findOne({ email: email.trim().toLowerCase() }).select(
    '+passwordHash',
  );

  const passwordMatches = mechanic && (await bcrypt.compare(password, mechanic.passwordHash));
  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const id = mechanic._id.toString();
  const token = jwt.sign({ role: mechanic.role }, env.jwtSecret, {
    subject: id,
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    mechanic: { id, name: mechanic.name, position: mechanic.position },
  };
}
