export const shouldBeHidden = (showPercentages: boolean, value: number | string) => {
  return !showPercentages && typeof value === 'string' && value.includes('%')
}

export const getCellKey = (name: string | number, index: number) => `${name}-cell-${index}`

export const getRowKey = (name: string | number, index: number) => `${name}-row-${index}`
