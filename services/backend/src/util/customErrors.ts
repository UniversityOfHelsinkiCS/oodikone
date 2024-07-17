export class ApplicationError extends Error {
  status: number

  extra: Record<string, unknown>

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
