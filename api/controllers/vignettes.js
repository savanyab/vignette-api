const ObjectId = require('mongodb').ObjectId;
const errorHandlers = require('../helpers/error-handlers');
const errors = require('../helpers/errors');
const { BadRequestError, AlreadyExistError, NotFoundError } = errors;
const randomstring = require('randomstring');

module.exports = {
  purchase: purchase,
  getMyVignettes: getMyVignettes,
  deleteExpired: deleteExpired
}

function purchase(req, res) {
  return purchaseAsync(req, res);
}

function getMyVignettes(req, res) {
  return getMyVignettesAsync(req, res);
}

async function purchaseAsync(req, res) {
  const vignetteTypesCollection = req.app.locals.vignetteTypesCollection;
  const vignettesCollection = req.app.locals.vignettesCollection;
  const userId = req.app.locals.userId;
  const vignetteType = req.swagger.params.vignette.value.vignetteType;
  const requestedValidityFrom = req.swagger.params.vignette.value.validFrom;
  const vehicleId = req.swagger.params.vignette.value.vehicleId;

  try {
    checkRequestedValidity(requestedValidityFrom);
    const vehicle = await findVehicle(req, vehicleId);
    await checkIfVehicleHasValidVignette(vignettesCollection, vehicleId);
    await checkIfVignetteIsAvailableForVehicleType(vignetteTypesCollection, vignetteType, vehicle);

    const validityStartDate = new Date(requestedValidityFrom);
    const validityEndDate = getValidityEndDate(validityStartDate, vignetteType);
    const identifier = randomstring.generate(25);

    await vignettesCollection.insertOne({
      "identifier": identifier,
      "licencePlate": vehicle.licencePlate,
      "validFrom": validityStartDate,
      "validTo": validityEndDate,
      "vignetteType": vignetteType,
      "vehicleId": vehicleId,
      "userId": userId.toString()
    });

    const createdVignette = await vignettesCollection.findOne({ "identifier": identifier });

    res.status(201).json(createdVignette)
  } catch (e) {
    errorHandlers(e, res);
  }
}


function checkRequestedValidity(requestedValidityFrom) {
  const today = new Date().setHours(0, 0, 0, 0);
  const validFrom = new Date(requestedValidityFrom).setHours(0, 0, 0, 0);
  const isRequestedValidityStartBeforeToday = (validFrom < today);

  if (isRequestedValidityStartBeforeToday) {
    throw new BadRequestError('Validity cannot start in the past');
  }
}

async function findVehicle(req, vehicleId) {
  const vehiclesCollection = req.app.locals.vehiclesCollection;

  const vehicle = await vehiclesCollection.findOne({ "_id": ObjectId(vehicleId) });

  if (!vehicle) {
    throw new NotFoundError('Please register vehicle before purchase');
  }
  return vehicle;
}

async function checkIfVehicleHasValidVignette(vignettesCollection, vehicleId) {
  const validVignetteForVehicle = await vignettesCollection.findOne({ "vehicleId": vehicleId });

  if (validVignetteForVehicle) {
    throw new AlreadyExistError('There is already a valid vignette for this vehicle');
  }
}

async function checkIfVignetteIsAvailableForVehicleType(vignetteTypesCollection, vignetteType, vehicle) {
  const availableVignette = await vignetteTypesCollection.findOne({
    "vignetteType": vignetteType, "vehicleType": vehicle.vehicleCategory
  });

  if (!availableVignette) {
    throw new BadRequestError("Vignette type not available for this vehicle category")
  }
}

function getValidityEndDate(validFrom, vignetteType) {
  switch (vignetteType) {
    case 'county':
    case 'yearly':
      return new Date(validFrom.getFullYear() + 1, 0, 31);
    case 'monthly':
      return new Date(validFrom.getFullYear(), validFrom.getMonth() + 1, validFrom.getDate());
    case 'weekly':
      return new Date(validFrom.getFullYear(), validFrom.getMonth(), validFrom.getDate() + 7);
  }
}

async function getMyVignettesAsync(req, res) {
  const vignetteType = req.swagger.params.vignetteType.value;
  const userId = req.app.locals.userId;
  try {
    const vignettes = await getVignettes(req, vignetteType, userId);
    res.status(200).json(vignettes);
  } catch (e) {
    errorHandlers(e, res);
  }
}

async function getVignettes(req, vignetteType, userId) {
  const vignettesCollection = req.app.locals.vignettesCollection;
  const today = new Date();

  if (vignetteType) {
    return await vignettesCollection.find({
      "userId": userId.toString(),
      "vignetteType": vignetteType,
      "validTo": { $gt: today }
    }).toArray();
  }

  return await vignettesCollection.find({
    "userId": userId.toString(),
    "validTo": { $gt: today }
  }).toArray();

}

function deleteExpired(req, res) {
  return deleteExpiredAsync(req, res);
}

async function deleteExpiredAsync(req, res) {
  const vignettesCollection = req.app.locals.vignettesCollection;
  const now = new Date();
  try {
    await vignettesCollection.deleteMany({ "validTo": { $lt: now } });
    res.status(200).json({});
  } catch (e) {
    errorHandlers(e, res);
  }
}