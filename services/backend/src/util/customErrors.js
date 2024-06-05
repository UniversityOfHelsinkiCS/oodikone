class ApplicationError extends Error {
  constructor(message = 'Something went wrong. Please try again.', status = 500, extra = {}) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.status = status
    this.extra = extra
  }

  toJSON() {
    return {
      message: this.message,
      ...this.extra,
    }
  }
}

module.exports = {
  ApplicationError,
}
