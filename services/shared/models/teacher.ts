import type { Credit } from './credit'

export type Teacher = {
  id: string
  name: string
  credits: Credit[]
  createdAt: Date
  updatedAt: Date
}
