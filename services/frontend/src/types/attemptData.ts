export type AttemptData = {
  category: string | null | undefined
  failed: number
  id: string
  passed: number
  passRate: string | null
  realisations: {
    failed: number
    obfuscated?: boolean
    passed: number
    passRate: string | null
    realisation: string
  }[]
}
