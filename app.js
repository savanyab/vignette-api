'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app;
const swaggerSecurity = require('./api/helpers/swagger_security.js');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost';

var config = {
  appRoot: __dirname, // required config
  swaggerSecurityHandlers: swaggerSecurity.swaggerSecurityHandlers
}


SwaggerExpress.create(config, function (err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  try {
    MongoClient.connect(url, (err, client) => {
      const db = client.db('vignette');
      const usersCollection = db.collection('users');
      const vehiclesCollection = db.collection('vehicles');
      const sessionCollection = db.collection('sessions');
      app.locals.usersCollection = usersCollection;
      app.locals.vehiclesCollection = vehiclesCollection;
      app.locals.sessionCollection = sessionCollection;
      const port = process.env.PORT || 10010;
      app.listen(port);
    });
  } catch (err) {
    console.log(err);
  }
  if (swaggerExpress.runner.swagger.paths['/hello']) {
    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  }
});
