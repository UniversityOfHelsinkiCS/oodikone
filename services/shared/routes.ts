// eslint-disable-next-line import-x/no-unused-modules
export interface GenericError {
  error: string
}

export interface GenericApplicationError extends GenericError, Record<string, unknown> {}

export type CanError<T, E = GenericError> = T | E
