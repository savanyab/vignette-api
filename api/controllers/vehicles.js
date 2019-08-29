const ObjectId = require('mongodb').ObjectId;
const errorHandlers = require('../helpers/error-handlers');
const errors = require('../helpers/errors');

module.exports = {
  saveVehicle: saveVehicle,
  deleteVehicle: deleteVehicle
}

function saveVehicle(req, res) {
  return saveVehicleAsync(req, res);
}

async function saveVehicleAsync(req, res) {
  const licencePlate = req.swagger.params.vehicle.value.licencePlate.toUpperCase();
  const vehicleCategory = req.swagger.params.vehicle.value.vehicleCategory;
  const userId = req.app.locals.userId;
  const vehiclesCollection = req.app.locals.vehiclesCollection;
  const userVehiclesCollection = req.app.locals.userVehiclesCollection;

  try {
    await vehiclesCollection.findOneAndUpdate(
      { "licencePlate": licencePlate },
      {
        $setOnInsert: { "licencePlate": licencePlate, "vehicleCategory": vehicleCategory },
      },
      {
        returnOriginal: false,
        upsert: true
      }
    );
    const vehicle = await vehiclesCollection.findOne({ "licencePlate": licencePlate });
    const vehicleId = vehicle._id;

    await userVehiclesCollection.findOneAndUpdate(
      {
        "vehicleId": vehicleId,
        "userId": userId
      },
      {
        $setOnInsert: { "vehicleId": vehicleId, "userId": userId },
      },
      {
        returnOriginal: false,
        upsert: true,
      }
    );
    
    res.status(201).json({ vehicle });
  } catch (e) {
    errorHandlers(e, res);
  }
}

function deleteVehicle(req, res) {
  return deleteVehicleAsync(req, res);
}

async function deleteVehicleAsync(req, res) {
  try {
    const userId = req.app.locals.userId;
    const vehicleId = req.swagger.params.vehicleId.value;
    const userVehiclesCollection = req.app.locals.userVehiclesCollection;

    await userVehiclesCollection.deleteOne({"vehicleId": ObjectId(vehicleId), "userId": userId });

    res.status(200).json({});
  } catch (e) {
    errorHandlers(e, res);
  }

}