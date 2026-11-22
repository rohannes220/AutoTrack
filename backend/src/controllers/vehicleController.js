import { createVehicle, listVehicles, updateVehicle } from '../services/vehicleService.js';

export async function create(req, res) {
  const vehicle = await createVehicle(req.body);
  res.status(201).json({ vehicle });
}

export async function list(req, res) {
  const vehicles = await listVehicles();
  res.json({ vehicles });
}

export async function update(req, res) {
  const vehicle = await updateVehicle(req.params.vehicleId, req.body);
  res.json({ vehicle });
}
