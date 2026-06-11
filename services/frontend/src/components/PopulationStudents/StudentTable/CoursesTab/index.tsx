import { TableOptions, VisibilityState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useToggle } from '@/hooks/toggle'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { CreditTypeCode, Name, ProgrammeCourse } from '@oodikone/shared/types'
import { FormattedStudent, StudentCourse } from '@oodikone/shared/types/studentData'
import { IncludeSubstitutionsToggle } from '../../IncludeSubstitutionsToggle'
import { useGetColumnDefinitions } from './columnDefinitions'

type CoursesTabContainerProps = {
  curriculum: ExtendedCurriculumDetails
  students: FormattedStudent[]
  courses: FilteredCourse[]
}

export type Courses = Record<
  string,
  {
    grade?: string
    completionDate?: string
    substitutedBy?: StudentCourse[] | string[]
    inHops?: boolean
    enrollmentDate?: Date
    passed?: boolean
    credittypecode?: CreditTypeCode
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
  curriculumCourseCodes: string[],
  substitutionsForCourseCode: Record<string, string[][]>
) => {
  const courseMap = {}

  // NB: there can be many attainments/enrollments for each course code
  // All passed courses that are included in curriculum
  const passedCourses = student.courses.filter(
    course => curriculumCourseCodes.includes(course.course_code) && course.passed
  )
  const enrollments = student.enrollments.filter(enrollment => curriculumCourseCodes.includes(enrollment.course_code))
  const hopsItems = student.studyplans.flatMap(studyPlan =>
    studyPlan.included_courses.filter(code => curriculumCourseCodes.includes(code))
  )

  // All passed courses including random AY-codes etc
  const allPassedCourseCodes = student.courses.filter(course => course.passed).map(course => course.course_code)
  const substitutionsToCurriculumCourses = curriculumCourseCodes.reduce<Record<string, string[][]>>((acc, code) => {
    const substitutionsToCurriculumCourse = substitutionsForCourseCode[code]
    if (substitutionsToCurriculumCourse) {
      acc[code] = substitutionsToCurriculumCourse
    }
    return acc
  }, {})

  /** curriculumCourseCode -> passedSubstGroup */
  const curriculumCoursesToPassedSubstitutionGroups = Object.keys(substitutionsToCurriculumCourses).reduce<
    Record<string, StudentCourse[]>
  >((acc, code) => {
    const passedSubstitutionGroups = substitutionsToCurriculumCourses[code].filter(substGroup =>
      substGroup.every(sgCode => allPassedCourseCodes.includes(sgCode))
    )
    // TODO: Implement better logic to select the most optimal substitution_groups, now we select shortest and first group
    // Also this .find (and at(0)!) should never be undefined because the codes are student's completed courses => they exist under student.courses
    const passedSubstitutionGroupCourses = passedSubstitutionGroups
      .map(sg => sg.map(code => student.courses.find(course => course.course_code === code)!))
      .toSorted((a, b) => b.length - a.length)
      .at(0)! // We know that this will exist
    if (passedSubstitutionGroups.length) {
      acc[code] = passedSubstitutionGroupCourses
    }
    return acc
  }, {})

  const enrollmentCodes = enrollments.map(e => e.course_code)
  const enrollmentsWithSubstitutions = Object.keys(substitutionsToCurriculumCourses).reduce<
    Record<string, FormattedStudent['enrollments']>
  >((acc, code) => {
    const enrolledSubstitutionGroups = substitutionsToCurriculumCourses[code].filter(substGroup =>
      substGroup.every(sgCode => enrollmentCodes.includes(sgCode))
    )
    // TODO: Same as above
    const enrolledSubstitutionGroupCourses = enrolledSubstitutionGroups
      .map(sg => sg.map(code => student.enrollments.find(course => course.course_code === code)!))
      .toSorted((a, b) => b.length - a.length)
      .at(0)! // We know that this will exist
    if (enrolledSubstitutionGroupCourses?.length) {
      acc[code] = enrolledSubstitutionGroupCourses
    }

    return acc
  }, {})

  const hopsItemsWithSubstitutions = Object.keys(substitutionsToCurriculumCourses).reduce<Record<string, string[]>>(
    (acc, code) => {
      // TODO: Same as above
      const hopsSubstitutionGroups = substitutionsToCurriculumCourses[code]
        .filter(substGroup => substGroup.every(sgCode => hopsItems.includes(sgCode)))
        .toSorted((a, b) => b.length - a.length)
        .at(0)!
      if (hopsSubstitutionGroups?.length) {
        acc[code] = hopsSubstitutionGroups
      }
      return acc
    },
    {}
  )

  const mapSubstitutionCourses = (coursesToAdd: typeof curriculumCoursesToPassedSubstitutionGroups) => {
    for (const [code, substitutionGroup] of Object.entries(coursesToAdd)) {
      courseMap[code] ??= {
        substitutedBy: substitutionGroup,
        exportValue: `Substitutes ${code}`,
      }
    }
  }

  const mapCourses = (coursesToAdd: typeof passedCourses) => {
    for (const course of coursesToAdd) {
      const code = course.course_code

      if (!courseMap[code] || compareCourseGrades(courseMap[code], course)) {
        courseMap[code] = {
          grade: course.grade,
          completionDate: course.date,
          passed: course.passed,
          substitutedBy: undefined,
          credittypecode: course.credittypecode,
          exportValue: course.grade,
        }
      }
    }
  }

  const mapSubstitutionEnrollments = (enrollmentsToAdd: typeof enrollmentsWithSubstitutions) => {
    for (const [code, substitutionGroup] of Object.entries(enrollmentsToAdd)) {
      courseMap[code] ??= {
        substitutedBy: substitutionGroup,
        enrollmentDate: substitutionGroup.at(0)!.enrollment_date_time,
        exportValue: 'HOPS',
      }
    }
  }

  const mapEnrollments = (enrollmentsToAdd: typeof enrollments) => {
    for (const enrollment of enrollmentsToAdd) {
      const code = enrollment.course_code
      if (
        !courseMap[code] ||
        (!!courseMap[code].enrollmentDate &&
          new Date(courseMap[code].enrollmentDate) < new Date(enrollment.enrollment_date_time))
      )
        courseMap[code] = {
          enrollmentDate: enrollment.enrollment_date_time,
          substitutedBy: undefined,
          exportValue: 'HOPS',
        }
    }
  }

  const mapHopsSelections = (selectionsToAdd: typeof hopsItems) => {
    for (const selection of selectionsToAdd) {
      const code = selection
      courseMap[code] ??= {
        inHops: true,
        substitutedBy: undefined,
        exportValue: 'HOPS',
      }
    }
  }

  const mapSubstitutionHopsSelections = (selectionsToAdd: typeof hopsItemsWithSubstitutions) => {
    for (const [code, substitutionGroup] of Object.entries(selectionsToAdd)) {
      courseMap[code] ??= {
        inHops: true,
        substitutedBy: substitutionGroup,
        exporValue: 'HOPS',
      }
    }
  }

  mapCourses(passedCourses)
  if (includeSubstitutions) mapSubstitutionCourses(curriculumCoursesToPassedSubstitutionGroups)

  mapEnrollments(enrollments)
  if (includeSubstitutions) mapSubstitutionEnrollments(enrollmentsWithSubstitutions)

  mapHopsSelections(hopsItems)
  if (includeSubstitutions) mapSubstitutionHopsSelections(hopsItemsWithSubstitutions)

  const totalPassed = Object.values(courseMap).reduce(
    (acc: number, course: any) => (course.substitutedBy?.length > 0 || !!course?.passed ? acc + 1 : acc),
    0
  )
  const totalPlanned = Object.keys(courseMap).length - totalPassed

  return {
    firstNames: student.firstnames,
    lastName: student.lastname,
    email: student.email,
    secondaryEmail: student.secondaryEmail,
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
const compareCourseGrades = (previous: StudentCourse, current: StudentCourse) =>
  gradeOrdering.indexOf(previous.grade) <= gradeOrdering.indexOf(current.grade)

export const CoursesTabContainer = ({ curriculum, students, courses }: CoursesTabContainerProps) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const [includeSubstitutions, toggleIncludeSubstitutions] = useToggle(true)

  const columnVisibility: VisibilityState = useMemo(
    () => ({ firstNames: namesVisible, lastName: namesVisible, email: false, secondaryEmail: false }),
    [namesVisible]
  )

  const curriculumCourses = useMemo(
    () => [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses].filter(nonVisible),
    [curriculum]
  )

  const curriculumCourseCodes = useMemo(() => curriculumCourses.map(course => course.code), [curriculumCourses])

  // All substitution_groups entries as codes
  const substitutionGroupsCourseCodes = useMemo(
    () =>
      courses
        .filter(course => curriculumCourseCodes.includes(course.course.code))
        .flatMap(course => course.course.substitution_groups?.map(sbGr => sbGr) ?? []),
    [courses, curriculumCourseCodes]
  )

  // All substitutionGroups for a given course code => course.substitution_groups
  const substitutionsForCourseCode: Record<string, string[][]> = useMemo(
    () =>
      courses.reduce((acc, course) => {
        const substitutionGroups = course.course.substitution_groups ?? []
        if (substitutionGroups.length) {
          acc[course.course.code] ??= []
          acc[course.course.code].push(...substitutionGroups.filter(group => group.length))
        }
        return acc
      }, {}),
    [substitutionGroupsCourseCodes, courses]
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
        studentMapper(student, includeSubstitutions, curriculumCourseCodes, substitutionsForCourseCode)
      ),
    [students, studentMapper, includeSubstitutions]
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
