export const CRITERIA_YEARS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'] as const

export type CriteriaYear = (typeof CRITERIA_YEARS)[number]

/**
 * Converts course codes to course group ids, keeping the order and dropping duplicates.
 * Codes that are not in the mapping are returned in `unmapped`.
 */
export const codesToGroupIds = (codes: readonly string[], groupIdByCode: ReadonlyMap<string, string>) => {
  const groupIds = new Set<string>()
  const unmapped: string[] = []
  for (const code of codes) {
    const groupId = groupIdByCode.get(code)
    if (groupId) {
      groupIds.add(groupId)
    } else {
      unmapped.push(code)
    }
  }
  return { groupIds: [...groupIds], unmapped }
}
