import { TableOptions, VisibilityState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { IncludeSubstitutionsToggle } from '@/components/PopulationComponents/Students/IncludeSubstitutionsToggle'
import { useGetColumnDefinitions } from '@/components/PopulationComponents/Students/Table/CoursesTab/columnDefinitions'
import { useToggle } from '@/hooks/toggle'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { CreditTypeCode, Name, ProgrammeCourse } from '@oodikone/shared/types'
import { FormattedStudent, StudentCourse } from '@oodikone/shared/types/studentData'

type CoursesTabContainerProps = {
  curriculum: ExtendedCurriculumDetails
  students: FormattedStudent[]
  courses: FilteredCourse[]
  idToGroupIdMap: Record<string, string>
}

export type SubstitutedByEntry = {
  code: string
  grade?: string
  date?: Date
}

export type Courses = Record<
  string,
  {
    grade?: string
    completionDate?: string
    substitutedBy?: SubstitutedByEntry[]
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
  courses: (Pick<ProgrammeCourse, 'code' | 'name'> & { groupId: string })[]
}

const studentMapper = (
  student: FormattedStudent,
  includeSubstitutions: boolean,
  curriculumGroupIds: string[],
  substitutionsForGroupId: Record<string, string[][]>,
  idToGroupIdMap: Record<string, string>,
  codeToGroupId: Record<string, string>,
  groupIdToCode: Record<string, string>
) => {
  const courseMap = {}

  // NB: there can be many attainments/enrollments for each course group
  // All passed courses that are included in curriculum
  const passedCourses = student.courses.filter(
    course => curriculumGroupIds.includes(idToGroupIdMap[course.course_id]) && course.passed
  )
  const enrollments = student.enrollments.filter(enrollment =>
    curriculumGroupIds.includes(idToGroupIdMap[enrollment.course_id])
  )
  const hopsGroupIds = student.studyplans.flatMap(studyPlan =>
    studyPlan.included_courses
      .map(code => codeToGroupId[code] ?? code)
      .filter(groupId => curriculumGroupIds.includes(groupId))
  )

  // All passed courses including random AY-codes etc, translated to their groupId
  const allPassedGroupIds = student.courses
    .filter(course => course.passed)
    .map(course => idToGroupIdMap[course.course_id])
    .filter(Boolean)

  const substitutionsToCurriculumGroups = curriculumGroupIds.reduce<Record<string, string[][]>>((acc, groupId) => {
    const substitutionsToCurriculumGroup = substitutionsForGroupId[groupId]
    if (substitutionsToCurriculumGroup) {
      acc[groupId] = substitutionsToCurriculumGroup
    }
    return acc
  }, {})

  /** curriculumGroupId -> passedSubstGroup */
  const curriculumGroupsToPassedSubstitutionGroups = Object.keys(substitutionsToCurriculumGroups).reduce<
    Record<string, SubstitutedByEntry[]>
  >((acc, groupId) => {
    const passedSubstitutionGroups = substitutionsToCurriculumGroups[groupId].filter(substGroup =>
      substGroup.every(sgGroupId => allPassedGroupIds.includes(sgGroupId))
    )
    // TODO: Implement better logic to select the most optimal substitution_groups, now we select shortest and first group
    // Also this .find (and at(0)!) should never be undefined because the groupIds are student's completed courses => they exist under student.courses
    const passedSubstitutionGroupCourses = passedSubstitutionGroups
      .map(sg =>
        sg.map((sgGroupId): SubstitutedByEntry => {
          const course = student.courses.find(c => idToGroupIdMap[c.course_id] === sgGroupId)!
          return { code: groupIdToCode[sgGroupId] ?? sgGroupId, grade: course.grade, date: course.date }
        })
      )
      .toSorted((a, b) => b.length - a.length)
      .at(0)! // We know that this will exist
    if (passedSubstitutionGroups.length) {
      acc[groupId] = passedSubstitutionGroupCourses
    }
    return acc
  }, {})

  const enrollmentGroupIds = enrollments.map(e => idToGroupIdMap[e.course_id])
  const enrollmentsWithSubstitutions = Object.keys(substitutionsToCurriculumGroups).reduce<
    Record<string, { codes: SubstitutedByEntry[]; enrollmentDate: Date }>
  >((acc, groupId) => {
    const enrolledSubstitutionGroups = substitutionsToCurriculumGroups[groupId].filter(substGroup =>
      substGroup.every(sgGroupId => enrollmentGroupIds.includes(sgGroupId))
    )
    // TODO: Same as above
    const enrolledSubstitutionGroupEnrollments = enrolledSubstitutionGroups
      .map(sg => sg.map(sgGroupId => student.enrollments.find(e => idToGroupIdMap[e.course_id] === sgGroupId)!))
      .toSorted((a, b) => b.length - a.length)
      .at(0)! // We know that this will exist
    if (enrolledSubstitutionGroupEnrollments?.length) {
      acc[groupId] = {
        codes: enrolledSubstitutionGroupEnrollments.map(e => ({
          code: groupIdToCode[idToGroupIdMap[e.course_id]] ?? e.course_id,
        })),
        enrollmentDate: enrolledSubstitutionGroupEnrollments[0].enrollment_date_time,
      }
    }

    return acc
  }, {})

  const hopsGroupIdsWithSubstitutions = Object.keys(substitutionsToCurriculumGroups).reduce<
    Record<string, SubstitutedByEntry[]>
  >((acc, groupId) => {
    // TODO: Same as above
    const hopsSubstitutionGroup = substitutionsToCurriculumGroups[groupId]
      .filter(substGroup => substGroup.every(sgGroupId => hopsGroupIds.includes(sgGroupId)))
      .toSorted((a, b) => b.length - a.length)
      .at(0)
    if (hopsSubstitutionGroup?.length) {
      acc[groupId] = hopsSubstitutionGroup.map(sgGroupId => ({ code: groupIdToCode[sgGroupId] ?? sgGroupId }))
    }
    return acc
  }, {})

  const mapSubstitutionCourses = (coursesToAdd: typeof curriculumGroupsToPassedSubstitutionGroups) => {
    for (const [groupId, substitutionGroup] of Object.entries(coursesToAdd)) {
      courseMap[groupId] ??= {
        substitutedBy: substitutionGroup,
        exportValue: `Substitutes ${groupIdToCode[groupId] ?? groupId}`,
      }
    }
  }

  const mapCourses = (coursesToAdd: typeof passedCourses) => {
    for (const course of coursesToAdd) {
      const groupId = idToGroupIdMap[course.course_id]

      if (!courseMap[groupId] || compareCourseGrades(courseMap[groupId], course)) {
        courseMap[groupId] = {
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
    for (const [groupId, { codes, enrollmentDate }] of Object.entries(enrollmentsToAdd)) {
      courseMap[groupId] ??= {
        substitutedBy: codes,
        enrollmentDate,
        exportValue: 'HOPS',
      }
    }
  }

  const mapEnrollments = (enrollmentsToAdd: typeof enrollments) => {
    for (const enrollment of enrollmentsToAdd) {
      const groupId = idToGroupIdMap[enrollment.course_id]
      if (
        !courseMap[groupId] ||
        (!!courseMap[groupId].enrollmentDate &&
          new Date(courseMap[groupId].enrollmentDate) < new Date(enrollment.enrollment_date_time))
      )
        courseMap[groupId] = {
          enrollmentDate: enrollment.enrollment_date_time,
          substitutedBy: undefined,
          exportValue: 'HOPS',
        }
    }
  }

  const mapHopsSelections = (selectionsToAdd: typeof hopsGroupIds) => {
    for (const groupId of selectionsToAdd) {
      courseMap[groupId] ??= {
        inHops: true,
        substitutedBy: undefined,
        exportValue: 'HOPS',
      }
    }
  }

  const mapSubstitutionHopsSelections = (selectionsToAdd: typeof hopsGroupIdsWithSubstitutions) => {
    for (const [groupId, substitutionGroup] of Object.entries(selectionsToAdd)) {
      courseMap[groupId] ??= {
        inHops: true,
        substitutedBy: substitutionGroup,
        exportValue: 'HOPS',
      }
    }
  }

  mapCourses(passedCourses)
  if (includeSubstitutions) mapSubstitutionCourses(curriculumGroupsToPassedSubstitutionGroups)

  mapEnrollments(enrollments)
  if (includeSubstitutions) mapSubstitutionEnrollments(enrollmentsWithSubstitutions)

  mapHopsSelections(hopsGroupIds)
  if (includeSubstitutions) mapSubstitutionHopsSelections(hopsGroupIdsWithSubstitutions)

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

const nonVisible = (course: ProgrammeCourse) => course.visible.visibility

const gradeOrdering = ['0', 'Hyl.', 'TT', 'HT', '1', '2', '3', '4', '5', 'Hyv.']

/**
 * @returns true if current course (the latter) has the same or better grade than old course
 */
const compareCourseGrades = (previous: StudentCourse, current: StudentCourse) =>
  gradeOrdering.indexOf(previous.grade) <= gradeOrdering.indexOf(current.grade)

export const CoursesTabContainer = ({ curriculum, students, courses, idToGroupIdMap }: CoursesTabContainerProps) => {
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

  // Curriculum courses only carry a code, so resolve each to the groupId of the matching course in this
  // population (if the course has no data in the population there is nothing to resolve, so fall back to
  // the code itself - it is only ever used as a unique key at that point, never for matching student data).
  const codeToGroupId: Record<string, string> = useMemo(
    () => Object.fromEntries(courses.map(({ course }) => [course.code, course.groupId])),
    [courses]
  )
  const groupIdToCode: Record<string, string> = useMemo(
    () => Object.fromEntries(courses.map(({ course }) => [course.groupId, course.code])),
    [courses]
  )

  const curriculumGroupIds = useMemo(
    () => curriculumCourses.map(course => codeToGroupId[course.code] ?? course.code),
    [curriculumCourses, codeToGroupId]
  )

  // All substitutionGroups (already groupIds) for a given curriculum course's groupId
  const substitutionsForGroupId: Record<string, string[][]> = useMemo(
    () =>
      courses.reduce((acc, { course }) => {
        const substitutionGroups = course.substitutionGroups ?? []
        if (substitutionGroups.length) {
          acc[course.groupId] ??= []
          acc[course.groupId].push(...substitutionGroups.filter(group => group.length))
        }
        return acc
      }, {}),
    [courses]
  )

  const coursesByParentModule = useMemo(() => {
    const unsorted = curriculumCourses.reduce((acc, course) => {
      const parent = course.parent_code
      if (parent) {
        if (!acc.has(parent)) {
          acc.set(parent, { name: course.parent_name, courses: [] })
        }
        acc.get(parent)!.courses.push({
          code: course.code,
          name: course.name,
          groupId: codeToGroupId[course.code] ?? course.code,
        })
      }
      return acc
    }, new Map<string, CourseTabModule>())

    // Sort courses within modules
    for (const parent of unsorted.values()) {
      parent.courses.sort((a, b) => a.code.localeCompare(b.code))
    }

    // Returns fully sorted map
    return new Map(Array.from(unsorted.entries()).sort())
  }, [curriculumCourses, codeToGroupId])

  /**
   * Adds passed courses by the highest grade / most recent enrollments / hops status of courses
   * taking substitutions into account
   */

  const formattedStudents = useMemo(
    () =>
      students.map(student =>
        studentMapper(
          student,
          includeSubstitutions,
          curriculumGroupIds,
          substitutionsForGroupId,
          idToGroupIdMap,
          codeToGroupId,
          groupIdToCode
        )
      ),
    [
      students,
      includeSubstitutions,
      curriculumGroupIds,
      substitutionsForGroupId,
      idToGroupIdMap,
      codeToGroupId,
      groupIdToCode,
    ]
  )

  const columns = useGetColumnDefinitions(coursesByParentModule)

  const verticalAccessorKeys = Array.from(coursesByParentModule.entries())
    .flatMap(([parentCode, parent]) => parent.courses.map(course => `${parentCode};${course.groupId}`))
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
