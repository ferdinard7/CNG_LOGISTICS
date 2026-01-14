import Joi from "joi";

const imageId = Joi.string().trim().min(3).required();

export const submitRiderKycSchema = Joi.object({
  nin: Joi.string().pattern(/^\d{11}$/).required(),
  motorcycleType: Joi.string().trim().min(2).max(50).required(),
  motorcycleMake: Joi.string().trim().min(2).max(50).required(),
  motorcycleModel: Joi.string().trim().min(1).max(50).required(),
  motorcycleYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).required(),
  motorcyclePlate: Joi.string().trim().min(3).max(20).required(),

  ninDocUrl: Joi.string().uri().required(),
  motorcycleRegDocUrl: Joi.string().uri().required(),
});

export const submitTruckKycSchema = Joi.object({
  driversLicenseNumber: Joi.string().trim().min(5).max(50).required(),
  vehicleMake: Joi.string().trim().min(2).max(50).required(),
  vehicleModel: Joi.string().trim().min(1).max(50).required(),
  vehicleYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).required(),
  vehiclePlate: Joi.string().trim().min(3).max(20).required(),

  driversLicenseDocUrl: Joi.string().uri().required(),
  vehicleRegDocUrl: Joi.string().uri().required(),
});


export const riderKycSchema = Joi.object({
  motorcycle_kyc: Joi.object({
    motorcycle_info: Joi.object({
      motorcycle_type: Joi.string().valid("standard", "scooter", "delivery_bike").required(),
      motorcycle_color: Joi.string().trim().required(),
      vin: Joi.string().trim().required(),
    }).required(),

    rider_documents: Joi.object({
      nin_document: Joi.object({
        front: imageId,
        back: imageId,
      }).required(),
      motorcycle_photos: Joi.array().items(imageId).min(1).required(),
      rider_on_motorcycle_photo: imageId,
    }).required(),

    compliance_declarations: Joi.object({
      has_valid_vehicle_papers: Joi.boolean().valid(true).required(),
      has_valid_insurance: Joi.boolean().valid(true).required(),
      vehicle_in_good_condition: Joi.boolean().valid(true).required(),
    }).required(),
  }).required(),
});

export const vehicleKycSchema = Joi.object({
  vehicle_kyc: Joi.object({
    vehicle_info: Joi.object({
      vehicle_type: Joi.string().valid("pickup", "van", "light_truck").required(),
      vehicle_color: Joi.string().trim().required(),
      vin: Joi.string().trim().required(),
      vehicle_trim: Joi.string().trim().required(),
      body_type: Joi.string().trim().required(),
      load_capacity: Joi.string().trim().required(),
    }).required(),

    vehicle_documents: Joi.object({
      drivers_license: Joi.object({
        front: imageId,
        back: imageId,
      }).required(),
      vehicle_photos: Joi.array().items(imageId).min(1).required(),
      driver_in_vehicle_photo: imageId,
    }).required(),

    compliance_declarations: Joi.object({
      has_valid_vehicle_papers: Joi.boolean().valid(true).required(),
      has_valid_insurance: Joi.boolean().valid(true).required(),
      vehicle_in_good_condition: Joi.boolean().valid(true).required(),
    }).required(),
  }).required(),
});