import { loginMechanic } from '../services/authService.js';
import { requireStrings } from '../utils/validate.js';

export async function mechanicLogin(req, res) {
  const credentials = requireStrings(req.body, ['email', 'password']);
  const result = await loginMechanic(credentials);
  res.json(result);
}
