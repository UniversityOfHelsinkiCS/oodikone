import { Credit, Enrollment, Course } from '../models'
import {
  Name,
  ProgrammeModuleWithRelevantAttributes,
  Unarray,
  SemesterEnrollment,
  DegreeProgrammeType,
  ProgressCriteria,
  Unification,
} from '../types'
import { FormattedStudent } from '../types/studentData'

export type CourseStats = Pick<Course, 'code' | 'name' | 'isStudyModule' | 'substitutionGroups'>

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
  courses: CourseStats[]
  enrollments: Pick<
    Enrollment,
    'course_code' | 'state' | 'enrollment_date_time' | 'semestercode' | 'studentnumber' | 'studyright_id'
  >[]
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
  years: string[] | string
  semesters: string[] | string
  programme: string
  combinedProgramme?: string
  studyTrack?: string
  studentStatuses?: string[] | string
}

// populationstatisticsbycourse
export type PopulationstatisticsbycourseResBody = PopulationstatisticsResBody & {
  mainCourseCodes: string[]
  allCourseCodes: string[]
}
export type PopulationstatisticsbycourseReqBody = never
export type PopulationstatisticsbycourseParams = {
  courses: string | string[] | undefined
  from: string | undefined
  to: string | undefined
  separate: string | undefined
  unifyCourses: Unification | string | undefined
  substitutions: string | undefined
}

// populationstatisticsbystudentnumbers
export type CustomPopulationByStudentNumbersQuery = {
  studentNumbers: string[]

  tags?: {
    studyProgramme?: string | null
    year?: string | null
  }
}
export type CustomPopulationByStudentNumbersResBody = PopulationstatisticsResBody & {
  studyProgramme?: string | null
  discardedStudentNumbers: string[]
}

// populationstatisticsbyprogrammecodes
export type CustomPopulationByProgrammesQuery = {
  programmes: string | string[]
  years: string | string[]
}
export type CustomPopulationByProgrammesResBody = PopulationstatisticsResBody

// populationstatistics/studyprogrammes
export type PopulationstatisticsStudyprogrammesResBody = Record<
  'allProgrammes' | 'filteredProgrammes',
  Record<string, Unarray<ProgrammeModuleWithRelevantAttributes[]>>
>
