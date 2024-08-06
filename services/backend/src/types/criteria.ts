export type Criteria = {
  courses: {
    yearOne: string[]
    yearTwo: string[]
    yearThree: string[]
    yearFour: string[]
    yearFive: string[]
    yearSix: string[]
  }
  allCourses: Record<string, string[]>
  credits: {
    yearOne: number
    yearTwo: number
    yearThree: number
    yearFour: number
    yearFive: number
    yearSix: number
  }
}
