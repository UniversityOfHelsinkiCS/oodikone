export type CourseProvider = {
  // TODO: RENAME: this is courseGroupId, not code
  coursecode: string
  shares: Array<{ share: number; startDate?: string; endDate?: string }> | null
  // TODO: RENAME: this is organizationId, not code
  organizationcode: string
  createdAt: Date
  updatedAt: Date
}
