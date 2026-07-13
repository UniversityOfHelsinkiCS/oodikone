export type Banner = {
  id: number
  text: string
  color: string
  lightness: 'light' | 'main' | 'dark'
  startDate: Date
  endDate: Date
  lastModifiedBy: string
}
