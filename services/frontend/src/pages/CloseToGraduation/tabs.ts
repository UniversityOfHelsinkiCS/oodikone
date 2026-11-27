import { countMultiSelectFilters, type CloseToGraduationFilters } from '@/pages/CloseToGraduation/filters'

export const TABS = ['bachelor', 'masterAndLicentiate'] as const

export type CloseToGraduationTab = (typeof TABS)[number]

export const isTabDisabled = (
  rowsByTab: Record<CloseToGraduationTab, unknown[]> | undefined,
  tab: CloseToGraduationTab,
  selectedTab: CloseToGraduationTab
) => rowsByTab !== undefined && tab !== selectedTab && rowsByTab[tab].length === 0

export const getInitialTab = (
  rowsByTab: Record<CloseToGraduationTab, unknown[]> | undefined,
  urlFiltersByTab: Record<CloseToGraduationTab, CloseToGraduationFilters>
): CloseToGraduationTab => {
  const hasRows = (tab: CloseToGraduationTab) => (rowsByTab?.[tab].length ?? 0) > 0
  if (!hasRows('bachelor') && hasRows('masterAndLicentiate')) return 'masterAndLicentiate'

  return countMultiSelectFilters(urlFiltersByTab.masterAndLicentiate) >
    countMultiSelectFilters(urlFiltersByTab.bachelor)
    ? 'masterAndLicentiate'
    : 'bachelor'
}
