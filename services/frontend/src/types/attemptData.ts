export type AttemptData = {
  category: string | null | undefined
  failed: number
  id: string
  passed: number
  passRate: string
  realisations: {
    failed: number
    obfuscated: boolean | undefined
    passed: number
    passRate: string
    realisation: string
  }[]
}
