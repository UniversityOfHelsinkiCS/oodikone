import { StudyProgrammeCourse } from '../types'

export type YearStats = StudyProgrammeCourse['years'][number]

export const createEmptyStats = (isStudyModule = false): YearStats => ({
  allCredits: 0,
  allStudents: 0,
  allPassed: 0,
  allNotPassed: 0,
  degreeStudents: 0,
  degreeStudentsCredits: 0,
  exchangeStudents: 0,
  exchangeStudentsCredits: 0,
  otherUniversityStudents: 0,
  otherUniversityCredits: 0,
  otherStudents: 0,
  otherStudentsCredits: 0,
  openStudents: 0,
  openStudentsCredits: 0,
  separateStudents: 0,
  separateStudentsCredits: 0,
  transferStudents: 0,
  transferStudentsCredits: 0,
  isStudyModule,
})

export const yearStatNumberKeys = [
  'allCredits',
  'allStudents',
  'allPassed',
  'allNotPassed',
  'degreeStudents',
  'degreeStudentsCredits',
  'exchangeStudents',
  'exchangeStudentsCredits',
  'otherUniversityStudents',
  'otherUniversityCredits',
  'otherStudents',
  'otherStudentsCredits',
  'openStudents',
  'openStudentsCredits',
  'separateStudents',
  'separateStudentsCredits',
  'transferStudents',
  'transferStudentsCredits',
] as const
