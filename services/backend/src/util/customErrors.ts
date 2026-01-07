import type { GenericApplicationError } from '@oodikone/shared/routes'

export class ApplicationError extends Error {
  status: number
  extra: Record<string, unknown>

  constructor(message, status = 500, extra = {}) {
    super(message)

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.status = status
    this.extra = extra
  }

  toJSON(): GenericApplicationError {
    return {
      error: this.message,
      ...this.extra,
    }
  }
}
