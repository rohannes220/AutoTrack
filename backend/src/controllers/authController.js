import { loginCustomer, loginMechanic } from '../services/authService.js';
import { requireStrings } from '../utils/validate.js';

export async function mechanicLogin(req, res) {
  const credentials = requireStrings(req.body, ['email', 'password']);
  const result = await loginMechanic(credentials);
  res.json(result);
}

export async function customerLogin(req, res) {
  const credentials = requireStrings(req.body, ['email', 'password']);
  const result = await loginCustomer(credentials);
  res.json(result);
}
