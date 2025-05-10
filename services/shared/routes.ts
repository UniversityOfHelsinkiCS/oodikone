export interface GenericError {
  error: string
}

export type CanError<T, E = GenericError> = T | E
