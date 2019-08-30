const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../../app');
const url = 'mongodb://localhost';
let db;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const vignetteTypes = {
  "weeklyCar": { "vignetteType": "weekly", "vehicleType": "car" },
  "weeklyMotorcycle": { "vignetteType": "weekly", "vehicleType": "motorcycle" },
  "weeklyBus": { "vignetteType": "weekly", "vehicleType": "bus" },
  "weeklyTruck": { "vignetteType": "weekly", "vehicleType": "truck" },
  "monthlyCar": { "vignetteType": "monthly", "vehicleType": "car" },
  "monthlyMotorcycle": { "vignetteType": "monthly", "vehicleType": "motorcycle" },
  "monthlyBus": { "vignetteType": "monthly", "vehicleType": "bus" },
  "monthlyTruck": { "vignetteType": "monthly", "vehicleType": "truck" },
  "yearlyCar": { "vignetteType": "yearly", "vehicleType": "car" },
  "yearlyBus": { "vignetteType": "yearly", "vehicleType": "bus" },
  "yearlyTruck": { "vignetteType": "yearly", "vehicleType": "truck" },
  "countyCar": { "vignetteType": "county", "vehicleType": "car" },
  "countyBus": { "vignetteType": "county", "vehicleType": "bus" },
  "countyTruck": { "vignetteType": "county", "vehicleType": "truck" }
}

describe('vignettes controller', function () {
  this.timeout(5000);
  const validSessionId = 'jxIDyQUwbBjqiVR6KnlR';

  before(function (done) {
    MongoClient.connect(url, (err, client) => {
      db = client.db('test');
      if (err) return console.log(err);

      db.collection('vignetteTypes').insertMany([
        vignetteTypes.weeklyCar,
        vignetteTypes.weeklyMotorcycle,
        vignetteTypes.weeklyBus,
        vignetteTypes.weeklyTruck,
        vignetteTypes.monthlyCar,
        vignetteTypes.monthlyMotorcycle,
        vignetteTypes.monthlyBus,
        vignetteTypes.monthlyTruck,
        vignetteTypes.yearlyCar,
        vignetteTypes.yearlyBus,
        vignetteTypes.yearlyTruck,
        vignetteTypes.countyCar,
        vignetteTypes.countyBus,
        vignetteTypes.countyTruck
      ]);
      done();
    });
  });

  beforeEach(async function (done) {
    const user = await db.collection('users').insertOne({
      "email": "user1@gmail.com",
      "password": "password1"
    });
    const userId = user.ops[0]._id;
    await db.collection('sessions').insertOne({
      "userId": ObjectId(userId),
      "sessionId": validSessionId
    });
    const sampleCar = await db.collection('vehicles').insertOne({
      "licencePlate": "ABC-123",
      "vehicleCategory": "car"
    });
    await db.collection('userVehicles').insertOne({
      "userId": userId,
      "vehicleId": sampleCar.ops[0]._id
    });
    done();
  });

  afterEach(async function () {
    await db.collection('vehicles').deleteMany({});
    await db.collection('userVehicles').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('sessions').deleteMany({});
    await db.collection('vignettes').deleteMany({});
  });

  describe('POST /purchase', function () {
    it('should create monthly vignette for car when all requested data are valid', async function (done) {
      const car = await db.collection('vehicles').findOne({ "licencePlate": "ABC-123" });
      request(app)
        .post('/purchase')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .send({
          "vignetteType": "monthly",
          "validFrom": "2019-12-31",
          "vehicleId": car._id
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(async function (err, res) {
          const createdVignette = await db.collection('vignettes').findOne({
            "vehicleId": car._id.toString(),
            "userId": app.locals.userId.toString()
          });

          expect(res.body.identifier).to.not.be.empty;
          expect(res.body.licencePlate).to.equal(car.licencePlate);
          expect(res.body.vehicleId).to.equal(createdVignette.vehicleId);
          expect(res.body.userId).to.equal(createdVignette.userId);
          expect(res.body.vignetteType).to.equal(createdVignette.vignetteType);
          done();
        });
    });

    it('should return not found error when vehicleId is not found', async function (done) {
      request(app)
        .post('/purchase')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .send({
          "vignetteType": "monthly",
          "validFrom": "2019-12-31",
          "vehicleId": "5d698b135bb37c0c08ba9a22"
        })
        .expect('Content-Type', /json/)
        .expect(404)
        .end(async function (err, res) {
          expect(res.body.message).to.equal('Please register vehicle before purchase');
          done();
        });
    });

    it('should retun 400 error when requesting yearly vignette for motorcycle', async function (done) {
      const sampleMotorcycle = await db.collection('vehicles').insertOne({
        "licencePlate": "DEF-123",
        "vehicleCategory": "motorcycle"
      });
      request(app)
        .post('/purchase')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .send({
          "vignetteType": "yearly",
          "validFrom": "2019-12-31",
          "vehicleId": sampleMotorcycle.ops[0]._id
        })
        .expect('Content-Type', /json/)
        .expect(400)
        .end(async function (err, res) {
          expect(res.body.message).to.equal('Vignette type not available for this vehicle category');
          done();
        });
    });
  });
});
