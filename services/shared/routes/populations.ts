import { Credit, Enrollment } from '../models'
import {
  Name,
  ProgrammeModuleWithRelevantAttributes,
  UnifyStatus,
  Unarray,
  SemesterEnrollment,
  DegreeProgrammeType,
  ProgressCriteria,
} from '../types'
import { FormattedStudent } from '../types/studentData'

export type CourseStats = {
  code: string
  name: Name
  substitutions: string[]
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

export type PopulationCourseStats = {
  courses: Pick<CourseStats, 'code' | 'name' | 'substitutions'>[]
  enrollments: Pick<Enrollment, 'course_code' | 'state' | 'enrollment_date_time' | 'semestercode' | 'studentnumber'>[]
  credits: Pick<
    Credit,
    | 'grade'
    | 'credits'
    | 'credittypecode'
    | 'attainment_date'
    | 'isStudyModule'
    | 'student_studentnumber'
    | 'course_code'
    | 'language'
    | 'studyright_id'
  >[]
}

// populationstatistics
export type PopulationstatisticsResBody = {
  students: Omit<FormattedStudent, 'criteriaProgress' | 'courses' | 'enrollments'>[]
  criteria: ProgressCriteria
  coursestatistics: PopulationCourseStats
}
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
