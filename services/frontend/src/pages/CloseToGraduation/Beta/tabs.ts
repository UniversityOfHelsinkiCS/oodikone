export const TABS = ['bachelor', 'masterAndLicentiate'] as const

export type CloseToGraduationTab = (typeof TABS)[number]
