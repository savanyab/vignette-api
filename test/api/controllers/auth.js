const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../../app');
const url = 'mongodb://localhost';
let db;
const MongoClient = require('mongodb').MongoClient;

describe('auth controller', function () {
  this.timeout(10000);

  before(function (done) {
    MongoClient.connect(url, (err, client) => {
      db = client.db('test');
      if (err) return console.log(err);
      done();
    });
  });

  beforeEach(async function (done) {
    await db.collection('users').insertOne({
      "email": "user1@gmail.com",
      "password": "password1"
    });
    
    done();
  });

  afterEach(async function () {
    await db.collection('users').deleteMany({});
    await db.collection('sessions').deleteMany({});
  });

  describe('POST /signup', function () {
    it('should sign up new user when requested with not taken email', function (done) {
      request(app)
        .post('/signup')
        .set('Accept', 'application/json')
        .send({ "email": "user2@gmail.com", "password": "password2" })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(async function (err, res) {
          const createdUser = await db.collection("users").find({ "email": "user2@gmail.com" }).toArray();
          expect(createdUser.length).to.equal(1);
          expect(createdUser[0]._id.toString()).to.equal(res.body.id);
          expect(res.body.email).to.equal("user2@gmail.com");
          done();
        });
    });

    it('should return 400 error when requested with taken email', function (done) {
      request(app)
        .post('/signup')
        .set('Accept', 'application/json')
        .send({ "email": "user1@gmail.com", "password": "password2" })
        .expect('Content-Type', /json/)
        .expect(400)
        .end(async function (err, res) {
          expect(res.body.message).to.equal('Email already taken');
          done();
        });
    });
  });

  describe('POST /login', function () {
    it('should save session when requested with correct credentials', function (done) {
      request(app)
        .post('/login')
        .set('Accept', 'application/json')
        .send({ "email": "user1@gmail.com", "password": "password1" })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(async function (err, res) {
          const loggedInUser = await db.collection('users').findOne({ "email": "user1@gmail.com" });
          const session = await db.collection('sessions').findOne({ "userId": loggedInUser._id });
          expect(session.sessionId).to.equal(res.body.sessionID);
          done();
        });
    });

    it('should return 401 error when requested with not registered email', function (done) {
      request(app)
        .post('/login')
        .set('Accept', 'application/json')
        .send({ "email": "nonregistered@gmail.com", "password": "password2" })
        .expect('Content-Type', /json/)
        .expect(401)
        .end(async function (err, res) {
          expect(res.body.message).to.equal("Invalid email or password");
          done();
        });
    });

    it('should return 401 error when requested with registered email and incorrect password', function (done) {
      request(app)
        .post('/login')
        .set('Accept', 'application/json')
        .send({ "email": "user1@gmail.com", "password": "incorrectpassword" })
        .expect('Content-Type', /json/)
        .expect(401)
        .end(async function (err, res) {
          expect(res.body.message).to.equal("Invalid email or password");
          done();
        });
    });
  });

  describe('GET /logout', function () {
    const validSessionId = 'jxIDyQUwbBjqiVR6KnlR';
    
    beforeEach(async function () {
      const loggedInUser = await db.collection('users').findOne({ "email": "user1@gmail.com" });
      await db.collection('sessions').insertOne({
        "userId": loggedInUser._id,
        "sessionId": validSessionId
      });
    });

    it('should log out user', function (done) {
      request(app)
        .get('/logout')
        .set('Accept', 'application/json')
        .set('sessionID', validSessionId)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(async function (err, res) {
          const session = await db.collection("sessions").findOne({ "sessionId": validSessionId });
          expect(session).to.equal(null);
          expect(res.body).to.be.empty;
          done();
        });
    });
  });
});
