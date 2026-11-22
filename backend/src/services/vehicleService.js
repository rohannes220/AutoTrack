import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { AppError } from '../utils/AppError.js';
import { isObjectIdString, validateVehicleFields } from '../utils/validate.js';

const DUPLICATE_KEY = 11000;

async function assertOwnerExists(ownerId) {
  if (!(await Customer.exists({ _id: ownerId }))) {
    throw new AppError('owner must be an existing customer', 400);
  }
}

// Turns a violation of the state + plate unique index into a 409.
async function withDuplicatePlateCheck(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err?.code === DUPLICATE_KEY) {
      throw new AppError(
        'A vehicle with this license plate is already registered in this state',
        409,
      );
    }
    throw err;
  }
}

export async function createVehicle(input) {
  const fields = validateVehicleFields(input);
  await assertOwnerExists(fields.owner);
  return withDuplicatePlateCheck(() => Vehicle.create(fields));
}

export async function listVehicles() {
  return Vehicle.find().sort({ state: 1, licensePlate: 1 });
}

export async function updateVehicle(vehicleId, changes) {
  if (!isObjectIdString(vehicleId)) {
    throw new AppError('Invalid vehicle id', 400);
  }
  const fields = validateVehicleFields(changes, { partial: true });
  if (fields.owner) {
    await assertOwnerExists(fields.owner);
  }

  const vehicle = await withDuplicatePlateCheck(() =>
    Vehicle.findByIdAndUpdate(vehicleId, fields, { new: true, runValidators: true }),
  );
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  return vehicle;
}

export async function listCustomerVehicles() {
  throw new Error('Not implemented');
}

export async function getCustomerVehicle() {
  throw new Error('Not implemented');
}
