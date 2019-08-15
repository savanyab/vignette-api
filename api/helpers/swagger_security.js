
module.exports = {
  swaggerSecurityHandlers: {
    sessionId: async function (req, authOrSecDef, scopesOrApiKey, callback) {
      if (!scopesOrApiKey || scopesOrApiKey.length === 0) {
        callback(new Error('Session ID missing or not registered'));
      }
      const sessionCollection = req.app.locals.sessionCollection;
      const session = await sessionCollection.findOne({ sessionId: scopesOrApiKey });

      if (!session) {
        callback(new Error('Invalid Session ID'));
      }

      req.app.locals.userId = session.userId;
      req.app.locals.sessionId = scopesOrApiKey;

      callback();


    }
  }

}