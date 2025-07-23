export type ProgressCriteria = {
  allCourses: Record<string, string[]>
  courses: {
    yearOne: string[]
    yearTwo: string[]
    yearThree: string[]
    yearFour: string[]
    yearFive: string[]
    yearSix: string[]
  }
  credits: {
    yearOne: number
    yearTwo: number
    yearThree: number
    yearFour: number
    yearFive: number
    yearSix: number
  }
}

type CoursesSatisfied = Record<string, string | null>

export type CriteriaYear = {
  credits: boolean
  totalSatisfied: number
  coursesSatisfied: CoursesSatisfied
}
