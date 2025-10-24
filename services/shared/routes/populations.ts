import {
  Name,
  EnrollmentState,
  ProgrammeModuleWithRelevantAttributes,
  UnifyStatus,
  Unarray,
  SemesterEnrollment,
  DegreeProgrammeType,
} from '../types'
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

export type AttainmentDates = {
  latestTotal?: Date
  latestHops?: Date
  earliestHops?: Date
}

export type CloseToGraduationData = {
  student: {
    studentNumber: string
    name: string
    sis_person_id: string
    email: string
    phoneNumber: string
    secondaryEmail: string
    preferredLanguage: string
  }
  studyright: {
    startDate: Date
    semesterEnrollments: SemesterEnrollment[] | null
    isBaMa: boolean
  }
  thesisInfo: {
    grade: string
    attainmentDate: Date
    courseCode: string
  } | null
  programme: {
    code: string
    name: Name
    studyTrack: Name | null
    startedAt: Date
    degreeProgrammeType: DegreeProgrammeType
  }
  faculty: Name
  attainmentDates: AttainmentDates
  numberOfAbsentSemesters: number
  numberOfUsedSemesters: number
  curriculumPeriod: string | null
  credits: {
    hops: number
    all: number
  }
}

export type CourseStats = {
  attempts: number
  course: Course
  enrollments: EnrollmentObject & {
    semesters: Record<string, EnrollmentObject>
  }
  grades: Record<
    string,
    {
      count: number
      status: {
        failingGrade: boolean
        improvedGrade: boolean
        passingGrade: boolean
      }
    }
  >
  stats: {
    passingSemesters: Record<string, number> // Key can also be BEFORE or LATER
  }
  students: {
    all: string[]
    enrolledNoGrade: string[]
    failed: string[]
    improvedPassedGrade: string[]
    markedToSemester: string[]
    passed: string[]
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
export type PopulationstatisticsbycourseResBody = PopulationstatisticsResBody
export type PopulationstatisticsbycourseReqBody = never
export type PopulationstatisticsbycourseParams = {
  coursecodes: string
  from: string
  to: string
  separate: string
  unifyCourses: UnifyStatus
}

// populationstatisticsbystudentnumbers
export type GetCustomPopulationResBody = PopulationstatisticsResBody & {
  studyProgramme?: string | null
  discardedStudentNumbers: string[]
}
export type CustomPopulationQuery = {
  studentNumbers: string[]
  tags?: {
    studyProgramme?: string | null
    year?: string | null
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
