import { useGetSemestersQuery } from '@/redux/semesters'
import type { Semester, Year } from '@/redux/semesters'

export type SemestersData = {
  currentSemester: Semester | null
  semesters: Record<string, Semester>
  years: Record<string, Year>
  isLoading: boolean
}

export const useSemesters = (): SemestersData => {
  const { data, isFetching } = useGetSemestersQuery()

  const currentSemester =
    Object.values(data?.semesters ?? {}).find(
      semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
    ) ?? null

  return {
    currentSemester,
    semesters: data?.semesters ?? {},
    years: data?.years ?? {},
    isLoading: isFetching,
  }
}
