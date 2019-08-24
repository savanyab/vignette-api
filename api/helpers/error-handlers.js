const { NotFoundError, AlreadyExistError, AuthenticationError, BadRequestError } = require('../helpers/errors');

module.exports =  function (err, res) {
  if (err instanceof NotFoundError) {
    return handleNotFound(err, res);
  }
  if (err instanceof AlreadyExistError) {
    return handleBadRequest(err, res);
  }
  if (err instanceof AuthenticationError) {
    return handleAuthenticationError(err, res);
  }
  if (err instanceof BadRequestError) {
    return handleBadRequest(err, res);
  }
  return handleOtherErrors(err, res);
}


function handleOtherErrors(err, res) {
  res.status(500).send(err);
}

function handleBadRequest(err, res) {
  res.status(400).send(err);
}

function handleNotFound(err, res) {
  res.status(404).send(err);
}

function handleAuthenticationError(err, res) {
  res.status(401).send(err);
}
