import { Name, EnrollmentState, ProgrammeModuleWithRelevantAttributes, UnifyStatus, Unarray } from '../types'
import { FormattedStudent } from '../types/studentData'

type Course = {
  code: string
  name: Name
  substitutions: string[]
}

type EnrollmentObject = {
  [EnrollmentState.ENROLLED]: string[]
  [EnrollmentState.REJECTED]: string[]
}

export type CourseStats = {
  course: Course
  attempts: number
  enrollments: EnrollmentObject & {
    semesters: { [semester: string]: EnrollmentObject }
  }
  grades: {
    [grade: string]: {
      count: number
      status: {
        passingGrade: boolean
        failingGrade: boolean
        improvedGrade: boolean
      }
    }
  }
  /**
   * all: string[]
   * passed: string[]
   * failed: string[]
   * improvedPassedGrade: string[]
   * markedToSemester: string[]
   * enrolledNoGrade: string[]
   */
  students: {
    [key: string]: string[]
  }
  stats: {
    passingSemesters: {
      [semester: string]: number
    }
  }
}

// populationstatistics
export type PopulationstatisticsResBody = { students: FormattedStudent[]; coursestatistics: CourseStats[] }
export type PopulationstatisticsReqBody = never
export type PopulationstatisticsQuery = {
  years: string[]
  semesters: string[]
  programme: string
  combinedProgramme?: string
  studyTrack?: string
  studentStatuses?: string[]
}

// populationstatisticsbycourse
export type PopulationstatisticsbycourseResBody = { students: any; coursestatistics: CourseStats[] }
export type PopulationstatisticsbycourseReqBody = never
export type PopulationstatisticsbycourseParams = {
  coursecodes: string
  from: string
  to: string
  separate: string
  unifyCourses: UnifyStatus
}

// populationstatisticsbystudentnumbers
export type PostByStudentNumbersResBody = {
  students: any
  studyProgramme?: string | null
  discardedStudentNumbers: string[]
}
export type PostByStudentNumbersReqBody = {
  studentnumberlist: string[]
  tags?: {
    studyProgramme: string | null
    year: string | null
  }
}

// populationstatistics/studyprogrammes
export type PopulationstatisticsStudyprogrammesResBody = Record<
  string,
  Unarray<ProgrammeModuleWithRelevantAttributes[]>
>

// populationstatistics/maxYearsToCreatePopulationFrom
export type PopulationstatisticsMaxYearsToCreatePopulationFormResBody = {
  openCourses: number
  uniCourses: number
  unifyCourses: number
}
export type PopulationstatisticsMaxYearsToCreatePopulationFormQuery = { courseCodes: string }
