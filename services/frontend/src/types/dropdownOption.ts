export type DropdownOption = {
  description: string
  key: string
  size: number
  students: Record<string, string[]> | string[]
  text: string
  value: string
}
