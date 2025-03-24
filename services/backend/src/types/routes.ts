export type CanError<T, E = string> = T | { error: E }
