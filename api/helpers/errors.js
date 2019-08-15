module.exports = {
  ResourceTakenError,
  NotFoundError,
  AuthenticationError
}

function ResourceTakenError(message) {
  this.message = message;
}

function NotFoundError(message) {
  this.message = message;
}

function AuthenticationError(message) {
  this.message = message;
}
