import { useGetSemestersQuery } from '@/redux/semesters'

export const useCurrentSemester = () => {
  const { data: semesterData } = useGetSemestersQuery()
  if (!semesterData) {
    return null
  }

  const currentSemester = Object.values(semesterData.semesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )

  return currentSemester
}
