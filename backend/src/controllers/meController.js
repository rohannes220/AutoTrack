import { getCustomerVehicle, listCustomerVehicles } from '../services/vehicleService.js';

// Ownership always comes from the verified token (req.user), never from the request.
export async function listMyVehicles(req, res) {
  const vehicles = await listCustomerVehicles(req.user.id);
  res.json({ vehicles });
}

export async function getMyVehicle(req, res) {
  const vehicle = await getCustomerVehicle(req.user.id, req.params.vehicleId);
  res.json({ vehicle });
}
