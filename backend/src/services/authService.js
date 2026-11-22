import bcrypt from 'bcrypt';
import { Customer } from '../models/Customer.js';
import { Mechanic } from '../models/Mechanic.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';

// One message for unknown email and wrong password, so responses don't reveal which emails exist.
const INVALID_CREDENTIALS = 'Invalid email or password';

// Finds the account in `Model` by normalized email and checks the password.
// Returns the account and a signed token, or throws the shared 401.
async function authenticate(Model, { email, password }) {
  const account = await Model.findOne({ email: email.trim().toLowerCase() }).select(
    '+passwordHash',
  );

  const passwordMatches = account && (await bcrypt.compare(password, account.passwordHash));
  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const id = account._id.toString();
  const token = signAccessToken({ sub: id, role: account.role });
  return { account, id, token };
}

export async function loginMechanic(credentials) {
  const { account: mechanic, id, token } = await authenticate(Mechanic, credentials);
  return {
    token,
    mechanic: { id, name: mechanic.name, position: mechanic.position },
  };
}

export async function loginCustomer(credentials) {
  const { account: customer, id, token } = await authenticate(Customer, credentials);
  return {
    token,
    customer: { id, name: customer.name },
  };
}
