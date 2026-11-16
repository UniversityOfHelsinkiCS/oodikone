export type CourseProvider = {
  courseGroupId: string
  shares: Array<{ share: number; startDate?: string; endDate?: string }> | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
}
