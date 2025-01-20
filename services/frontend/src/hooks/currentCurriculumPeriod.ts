import { useGetCurriculumPeriodsQuery } from '@/redux/curriculumPeriods'

export const useCurrentCurriculumPeriod = () => {
  const { data: curriculumPeriods = [] } = useGetCurriculumPeriodsQuery()

  const currentCurriculumPeriod = curriculumPeriods.find(
    ({ startDate, endDate }) => new Date(startDate) <= new Date() && new Date(endDate) >= new Date()
  )

  return currentCurriculumPeriod
}
