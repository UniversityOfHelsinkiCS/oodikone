export type CourseProvider = {
  coursecode: string
  shares: Array<{ share: number; startDate?: string; endDate?: string }> | null
  organizationcode: string
  createdAt: Date
  updatedAt: Date
}
