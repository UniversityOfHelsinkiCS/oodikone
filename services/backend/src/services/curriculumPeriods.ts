import { CurriculumPeriod } from '../models'

export type CurriculumPeriods = Awaited<ReturnType<typeof getCurriculumPeriods>>

export const getCurriculumPeriods = async () => {
  const curriculumPeriods = await CurriculumPeriod.findAll()
  const result = curriculumPeriods.reduce<
    Record<string, Pick<CurriculumPeriod, 'id' | 'name' | 'universityOrgId' | 'startDate' | 'endDate'>>
  >((acc, curriculumPeriod) => {
    const { id, name, universityOrgId, startDate, endDate } = curriculumPeriod
    acc[id] = { id, name, universityOrgId, startDate, endDate }
    return acc
  }, {})
  return result
}
