import { CourseStats } from '../routes/populations'

// Used by filterView and its children
export type FormattedCourse = Omit<CourseStats, 'stats' | 'students'> & {
  stats: {
    attempts: number
    failed: number
    improvedPassedGrade: number
    passed: number
    passedOfPopulation: number
    passingSemesters: Record<string, number> // Key can also be BEFORE or LATER
    passingSemestersCumulative: Record<string, number>
    perStudent: number
    percentage: number
    percentageWithEnrollments: number
    students: number
    totalEnrolledNoGrade: number
    totalStudents: number
    triedOfPopulation: number
  }
  students: {
    // TODO: after migrating courses tab make these just be an array..
    all: Record<string, true>
    enrolledNoGrade: Record<string, true>
    failed: Record<string, true>
    improvedPassedGrade: Record<string, true>
    markedToSemester: Record<string, true>
    passed: Record<string, true>
  }
}
