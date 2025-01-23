export type AttemptData = {
  category: string | null | undefined
  failed: number
  id: string
  passed: number
  passrate: string
  realisations: {
    failed: number
    obfuscated: boolean | undefined
    passed: number
    passrate: string
    realisation: string
  }[]
}
