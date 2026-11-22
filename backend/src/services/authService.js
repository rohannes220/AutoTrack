import bcrypt from 'bcrypt';
import { Customer } from '../models/Customer.js';
import { Mechanic } from '../models/Mechanic.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';

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
  const token = signAccessToken({ sub: id, role: mechanic.role });

  return {
    token,
    mechanic: { id, name: mechanic.name, position: mechanic.position },
  };
}

export async function loginCustomer({ email, password }) {
  const customer = await Customer.findOne({ email: email.trim().toLowerCase() }).select(
    '+passwordHash',
  );

  const passwordMatches = customer && (await bcrypt.compare(password, customer.passwordHash));
  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const id = customer._id.toString();
  const token = signAccessToken({ sub: id, role: customer.role });

  return {
    token,
    customer: { id, name: customer.name },
  };
}
