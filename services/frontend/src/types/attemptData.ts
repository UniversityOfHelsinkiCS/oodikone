import { Name } from '@oodikone/shared/types'

export type AttemptData = {
  category: string | null | undefined
  failed: number
  courseCode: string
  groupId: string
  passed: number
  passRate: string | null
  realisations: {
    failed: number
    obfuscated?: boolean
    passed: number
    passRate: string | null
    realisation: string | Name
  }[]
}
