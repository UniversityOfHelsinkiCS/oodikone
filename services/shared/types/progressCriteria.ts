export type ProgressCriteria = {
  /** Course group id => substitution groups (each entry is an array of course group ids) */
  allCourseGroups: Record<string, string[][]>
  /** Course group ids of the criteria courses for each year */
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
