const randomstring = require('randomstring');
const errorHandlers = require('../helpers/error-handlers');
const errors = require('../helpers/errors');
const { AuthenticationError, BadRequestError } = errors;

module.exports = {
  login: login,
  logout: logout,
  signup: signup
}

function signup(req, res) {
  return signupAsync(req, res);
}

async function signupAsync(req, res) {
  const email = req.swagger.params.user.value.email;
  const password = req.swagger.params.user.value.password;
  const usersCollection = req.app.locals.usersCollection;
  try {
    const user = await usersCollection.findOne({ "email": email });
    if (user) {
      throw new BadRequestError('Email already taken');
    }
    await usersCollection.insert({ "email": email, "password": password });
    const newUser = await usersCollection.findOne({ "email": email });
    res.status(201);
    res.json({ "id": newUser._id, "email": newUser.email }); 
  } catch (e) {
    console.log(e)
    errorHandlers(e, res);
    
  }
}

function login(req, res) {
  return loginAsync(req, res);
}

async function loginAsync(req, res) {
  const email = req.swagger.params.credentials.value.email;
  const password = req.swagger.params.credentials.value.password;
  const usersCollection = req.app.locals.usersCollection;
  const generatedSessionId = randomstring.generate(20);
  const sessionCollection = req.app.locals.sessionCollection;

  try {
    const user = await usersCollection.findOne({ "email": email });

    if (!user || user.password !== password) {
      throw new AuthenticationError('Invalid email or password');
    }

    await sessionCollection.insertOne({ "userId": user._id, "sessionId": generatedSessionId });

    const session = await sessionCollection.findOne({ sessionId: generatedSessionId });

    res.json({ "sessionID": session.sessionId });

  } catch (e) {
    errorHandlers(e, res);
  }
}

function logout(req, res) {
  return logoutAsync(req, res);
}

async function logoutAsync(req, res) {
  const userId = req.app.locals.userId;
  const sessionCollection = req.app.locals.sessionCollection;

  try {
    await sessionCollection.deleteMany({ userId: userId });
    res.status(200).json({});
  } catch (e) {
    errorHandlers(e, res);
  }
}