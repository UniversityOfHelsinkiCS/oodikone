import { AsyncLocalStorage } from 'node:async_hooks'

type ClockContext = {
  now?: Date
}

export const clockStorage = new AsyncLocalStorage<ClockContext>()

export function now(): Date {
  return clockStorage.getStore()?.now ?? new Date()
}
