import { useGetSemestersQuery } from '@/redux/semesters'
import type { Semester, Year } from '@/redux/semesters'

export type SemestersData = {
  currentSemester: Semester | null
  semesters: Record<string, Semester>
  years: Record<string, Year>
  isLoading: boolean
}

const NO_SEMESTERS: SemestersData['semesters'] = {}
const NO_YEARS: SemestersData['years'] = {}

export const useSemesters = (): SemestersData => {
  const { data, isFetching } = useGetSemestersQuery()

  const currentSemester =
    Object.values(data?.semesters ?? {}).find(
      semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
    ) ?? null

  return {
    currentSemester,
    semesters: data?.semesters ?? NO_SEMESTERS,
    years: data?.years ?? NO_YEARS,
    isLoading: isFetching,
  }
}
