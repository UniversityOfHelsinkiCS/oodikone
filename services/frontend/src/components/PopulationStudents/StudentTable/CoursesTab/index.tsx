import { TableOptions, VisibilityState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useToggle } from '@/hooks/toggle'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { Name, ProgrammeCourse } from '@oodikone/shared/types'
import { FormattedCourse } from '@oodikone/shared/types/courseData'
import { FormattedStudent } from '@oodikone/shared/types/studentData'
import { IncludeSubstitutionsToggle } from '../../IncludeSubstitutionsToggle'
import { useGetColumnDefinitions } from './columnDefinitions'

type CoursesTabContainerProps = {
  curriculum: ExtendedCurriculumDetails
  students: FormattedStudent[]
  courses: FormattedCourse[]
}

export type Courses = Record<
  string,
  {
    grade?: string
    completionDate?: string
    substitutedBy?: string
    inHops?: boolean
    enrollmentDate?: Date
    passed?: boolean
  }
>

export type CourseTabStudent = {
  firstNames: string
  lastName: string
  studentNumber: string
  sisuID: string
  totalPlanned: number
  totalPassed: number
} & Courses

export type CourseTabModule = {
  name: Name
  courses: Pick<ProgrammeCourse, 'code' | 'name'>[]
}

const studentMapper = (
  student: FormattedStudent,
  includeSubstitutions: boolean,
  curriculumCourseCodes,
  substituteToPrimaryCodes
) => {
  const courseMap = {}

  // NB: there can be many attainments/enrollments for each course code
  const passedCourses = student.courses.filter(
    course => curriculumCourseCodes.includes(course.course_code) && course.passed
  )
  const enrollments = student.enrollments.filter(enrollment => curriculumCourseCodes.includes(enrollment.course_code))
  const hopsItems = student.studyplans.flatMap(studyPlan =>
    studyPlan.included_courses.filter(code => curriculumCourseCodes.includes(code))
  )

  const passedSubstituteCourses = student.courses.filter(course => !!substituteToPrimaryCodes[course.course_code])
  const substituteEnrollments = student.enrollments.filter(
    enrollment => !!substituteToPrimaryCodes[enrollment.course_code]
  )
  const substituteHopsItems = student.studyplans.flatMap(studyPlan =>
    studyPlan.included_courses.filter(code => !!substituteToPrimaryCodes[code])
  )

  const mapCourses = (coursesToAdd: typeof passedCourses, substitutions: boolean) => {
    for (const course of coursesToAdd) {
      const codes = substitutions ? substituteToPrimaryCodes[course.course_code] : [course.course_code]
      codes.forEach(code => {
        if (!courseMap[code] || compareCourseGrades(courseMap[code], course)) {
          courseMap[code] = {
            grade: course.grade,
            completionDate: course.date,
            passed: course.passed,
            substitutedBy: substitutions ? course.course_code : undefined,
            exportValue: course.grade,
          }
        }
      })
    }
  }

  const mapEnrollments = (enrollmentsToAdd: typeof enrollments, substitutions: boolean) => {
    for (const enrollment of enrollmentsToAdd) {
      const codes = substitutions ? substituteToPrimaryCodes[enrollment.course_code] : [enrollment.course_code]
      codes.forEach(code => {
        if (
          !courseMap[code] ||
          (!!courseMap[code].enrollmentDate &&
            new Date(courseMap[code].enrollmentDate) < new Date(enrollment.enrollment_date_time))
        )
          courseMap[code] = {
            enrollmentDate: enrollment.enrollment_date_time,
            substitutedBy: substitutions ? enrollment.course_code : undefined,
            exportValue: 'HOPS',
          }
      })
    }
  }

  const mapHopsSelections = (selectionsToAdd: typeof hopsItems, substitutions: boolean) => {
    for (const selection of selectionsToAdd) {
      const codes = substitutions ? substituteToPrimaryCodes[selection] : [selection]
      codes.forEach(code => {
        courseMap[code] ??= {
          inHops: true,
          substitutedBy: substitutions ? selection : undefined,
          exportValue: 'HOPS',
        }
      })
    }
  }

  mapCourses(passedCourses, false)
  if (includeSubstitutions) mapCourses(passedSubstituteCourses, true)

  const totalPassed = Object.keys(courseMap).length

  mapEnrollments(enrollments, false)
  if (includeSubstitutions) mapEnrollments(substituteEnrollments, true)

  mapHopsSelections(hopsItems, false)
  if (includeSubstitutions) mapHopsSelections(substituteHopsItems, true)

  const totalPlanned = Object.keys(courseMap).length - totalPassed

  return {
    firstNames: student.firstnames,
    lastName: student.lastname,
    studentNumber: student.studentNumber,
    sisuID: student.sis_person_id,
    totalPassed,
    totalPlanned,
    ...courseMap,
  } as CourseTabStudent
}

const columnHeaderResolver = (acc: Map<string, CourseTabModule>, course: ProgrammeCourse) => {
  const parent = course.parent_code
  if (parent) {
    if (!acc.has(parent)) {
      acc.set(parent, { name: course.parent_name, courses: [] })
    }
    acc.get(parent)!.courses.push({
      code: course.code,
      name: course.name,
    })
  }
  return acc
}

const nonVisible = (course: ProgrammeCourse) => course.visible.visibility

const gradeOrdering = ['0', 'Hyl.', 'TT', 'HT', '1', '2', '3', '4', '5', 'Hyv.']

/**
 * @returns true if current course (the latter) has the same or better grade than old course
 */
const compareCourseGrades = (previous, current) =>
  gradeOrdering.indexOf(previous.grade) <= gradeOrdering.indexOf(current.grade)

export const CoursesTabContainer = ({ curriculum, students, courses }: CoursesTabContainerProps) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const [includeSubstitutions, toggleIncludeSubstitutions] = useToggle(true)

  const columnVisibility: VisibilityState | undefined = useMemo(
    () => (!namesVisible ? { firstNames: false, lastName: false } : undefined),
    [namesVisible]
  )

  const curriculumCourses = useMemo(
    () => [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses].filter(nonVisible),
    [curriculum]
  )

  const curriculumCourseCodes = useMemo(() => curriculumCourses.map(course => course.code), [curriculumCourses])

  const substitutionCourseCodes = useMemo(
    () =>
      courses
        .filter(course => curriculumCourseCodes.includes(course.course.code))
        .flatMap(course => course.course.substitutions),
    [courses, curriculumCourseCodes]
  )

  /**
   * Justification for using array:
   * there are instances where a course substitutes multiple different courses currently present in curriculum
   * g.g. course code TKT20015 -> BSCS2002/TKT10001 in curriculum 2020-2023
   * but most of the time there is only one main code
   */
  const substituteToPrimaryCodes: Record<string, string[]> = useMemo(
    () =>
      courses
        .filter(course => substitutionCourseCodes.includes(course.course.code))
        .reduce((acc, course) => {
          const mainCodes = course.course.substitutions.filter(sub => curriculumCourseCodes.includes(sub))
          // If no mainCode in curriculum, leave blank as nothing would be shown in course tab anyway
          if (mainCodes.length) {
            acc[course.course.code] ??= []
            acc[course.course.code].push(...mainCodes)
          }
          return acc
        }, {}),
    [curriculumCourseCodes, substitutionCourseCodes, courses]
  )

  const coursesByParentModule = useMemo(() => {
    const unsorted = curriculumCourses.reduce(columnHeaderResolver, new Map<string, CourseTabModule>())

    // Sort courses within modules
    for (const parent of unsorted.values()) {
      parent.courses.sort((a, b) => a.code.localeCompare(b.code))
    }

    // Returns fully sorted map
    return new Map(Array.from(unsorted.entries()).sort())
  }, [curriculumCourses])

  /**
   * Adds passed courses by the highest grade / most recent enrollments / hops status of courses
   * taking substitutions into account
   */

  const formattedStudents = useMemo(
    () =>
      students.map(student =>
        studentMapper(student, includeSubstitutions, curriculumCourseCodes, substituteToPrimaryCodes)
      ),
    [students, studentMapper]
  )

  const columns = useGetColumnDefinitions(coursesByParentModule)

  const verticalAccessorKeys = Array.from(coursesByParentModule.entries())
    .flatMap(([parentCode, parent]) => parent.courses.map(course => `${parentCode};${course.code}`))
    .concat(['totalPassed', 'totalPlanned'])

  const tableOptions: Partial<TableOptions<CourseTabStudent>> = {
    initialState: {
      columnPinning: { left: ['studentNumber'] },
    },
    state: {
      useVerticalHeaders: verticalAccessorKeys,
      columnVisibility,
    },
  }

  const keysForExport: string[] = useMemo(() => {
    const squashGroups = column => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey ?? column.id?.split(';')?.[1]]
    }

    const keys = columns.flatMap(squashGroups)
    // Remove duplicates preserving order of initial occurences
    return keys.filter((key, idx) => keys.indexOf(key) === idx)
  }, [columns])

  return (
    <OodiTable
      columns={columns}
      cy="ooditable-courses"
      data={formattedStudents}
      options={tableOptions}
      toolbarContent={
        <>
          <OodiTableExcelExport data={formattedStudents} exportColumnKeys={keysForExport} />
          <StudentNameVisibilityToggle />
          <IncludeSubstitutionsToggle
            includeSubstitutions={includeSubstitutions}
            toggleIncludeSubstitutions={toggleIncludeSubstitutions}
          />
        </>
      }
    />
  )
}
