const { NotFoundError, ResourceTakenError, AuthenticationError } = require('../helpers/errors');

module.exports =  function (err, res) {
  if (err instanceof NotFoundError) {
    handleNotFound(err, res);
  }
  if (err instanceof ResourceTakenError) {
    handleResourceTaken(err, res);
  }
  if (err instanceof AuthenticationError) {
    handleAuthenticationError(err, res);
  }
  handleOtherErrors(err, res);
}


function handleOtherErrors(err, res) {
  res.status(500).send(err);
}

function handleResourceTaken(err, res) {
  res.status(400).send(err);
}

function handleNotFound(err, res) {
  res.status(404).send(err);
}

function handleAuthenticationError(err, res) {
  res.status(401).send(err);
}
