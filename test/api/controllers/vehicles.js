const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../../app');
const url = 'mongodb://localhost';
let db;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

describe('vehicles controller', function () {
  this.timeout(5000);
  const validSessionId = 'jxIDyQUwbBjqiVR6KnlR';

  before(function (done) {
    MongoClient.connect(url, (err, client) => {
      db = client.db('test');
      if (err) return console.log(err);
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
    sampleVehicle = await db.collection('vehicles').insertOne({
      "licencePlate": "ABC-123",
      "vehicleCategory": "car"
    });
    await db.collection('userVehicles').insertOne({
      "userId": userId,
      "vehicleId": sampleVehicle.ops[0]._id
    });
    done();
  });

  afterEach(async function () {
    await db.collection('vehicles').deleteMany({});
    await db.collection('userVehicles').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('sessions').deleteMany({});
  });

  describe('POST /vehicles', function () {
    it('should save new vehicle to vehicles and userVehicles collections when requested with new vehicle data', function (done) {
      request(app)
        .post('/vehicles')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .send({ "licencePlate": "DEF-123", "vehicleCategory": "car" })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(async function (err, res) {
          const createdVehicle = await db.collection("vehicles").findOne({ "licencePlate": "DEF-123" });
          const userVehicle = await db.collection('userVehicles').findOne({ "userId": app.locals.userId, "vehicleId": createdVehicle._id });
        
          expect(userVehicle).to.exist;
          expect(res.body.vehicle.licencePlate).to.equal("DEF-123");
          expect(res.body.vehicle.vehicleCategory).to.equal("car");
          done();
        });
    });

    it('should save vehicle to userVehicles collection when requested with already existing vehicle data', function (done) {
      request(app)
        .post('/vehicles')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .send({ "licencePlate": "ABC-123", "vehicleCategory": "car" })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(async function (err, res) {
          const updatedVehicles = await db.collection("vehicles").find({ "licencePlate": "ABC-123" }).toArray();
          const userVehicles = await db.collection('userVehicles').find({ "userId": app.locals.userId, "vehicleId": updatedVehicles[0]._id }).toArray();
          
          expect(updatedVehicles.length).to.equal(1);
          expect(userVehicles.length).to.equal(1);

          expect(res.body.vehicle.licencePlate).to.equal("ABC-123");
          expect(res.body.vehicle.vehicleCategory).to.equal("car");
          done();
        });
    });
  });

  describe('DELETE /vehicles', function () {
    it('should delete vehicle from userVehicles collection when requested with existing vehicleId', async function (done) {
      const sampleVehicle = await db.collection('vehicles').findOne({ "licencePlate": "ABC-123" });
      request(app)
        .delete('/vehicles/' + sampleVehicle._id)
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(async function (err, res) {
          const userVehicle = await db.collection('userVehicles').findOne({ "userId": app.locals.userId, "vehicleId": sampleVehicle._id });
          expect(userVehicle).to.not.exist;
          expect(res.body).to.be.empty;
          done();
        });
    });
  });
});
