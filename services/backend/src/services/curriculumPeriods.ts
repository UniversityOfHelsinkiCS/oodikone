import { CurriculumPeriodModel } from '../models'

export type CurriculumPeriods = Awaited<ReturnType<typeof getCurriculumPeriods>>

export const getCurriculumPeriods = async () => {
  const curriculumPeriods = await CurriculumPeriodModel.findAll()
  const result = curriculumPeriods.reduce<
    Record<string, Pick<CurriculumPeriodModel, 'id' | 'name' | 'universityOrgId' | 'startDate' | 'endDate'>>
  >((acc, curriculumPeriod) => {
    const { id, name, universityOrgId, startDate, endDate } = curriculumPeriod
    acc[id] = { id, name, universityOrgId, startDate, endDate }
    return acc
  }, {})
  return result
}
