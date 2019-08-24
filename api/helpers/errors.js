module.exports = {
  AlreadyExistError,
  NotFoundError,
  AuthenticationError,
  BadRequestError,
  UnavailableVignetteError
}

function AlreadyExistError(message) {
  this.message = message;
}

function NotFoundError(message) {
  this.message = message;
}

function AuthenticationError(message) {
  this.message = message;
}

function BadRequestError(message) {
  this.message = message;
}

function UnavailableVignetteError(message) {
  this.message = message;
}
