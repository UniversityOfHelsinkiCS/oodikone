import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { createColumnHelper } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { Link } from '@/components/common/Link'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { CopyStudentNumbersHeader } from '@/components/OodiTable/common/CopyStudentNumbersHeader'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { FilterDegreeCoursesModal } from '@/components/PopulationComponents/PopulationCourses/FilterDegreeCoursesModal'
import { TableInfo } from '@/components/PopulationComponents/Students/Table/ProgressTab/info'
import {
  getCellText,
  getCourseGroups,
  getCriteriaHeaders,
  hasCreditTransfer,
  hasEnrolled,
  hasFailed,
  hasPassedDuringAcademicYear,
  hasPassedOutsideAcademicYear,
  IdToGroupId,
  Label,
} from '@/components/PopulationComponents/Students/Table/ProgressTab/util'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { CheckIcon, CloseIcon, EditIcon, RemoveIcon, SwapHorizIcon } from '@/theme'
import { FormattedStudent, ProgrammeCourse, ProgressCriteria, SemesterEnrollment } from '@oodikone/shared/types'
import { keyBy } from '@oodikone/shared/util'
import '@/components/PopulationComponents/Students/Table/ProgressTab/index.css'

const columnHelper = createColumnHelper<FormattedStudent>()

const helpTexts = {
  0: 'No information',
  1: 'Active',
  2: 'Absent',
  3: 'Passive',
}

const enrollmentClassNames = {
  0: 'label-none',
  1: 'label-present',
  2: 'label-absent',
  3: 'label-passive',
}

const getRowContent = (
  student: FormattedStudent,
  label: Label,
  year: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  criteria: ProgressCriteria | undefined,
  idToGroupId: IdToGroupId
) => {
  if (label.code === 'Credits') {
    if (student.criteriaProgress[year]?.credits) {
      return <CheckIcon color="success" />
    }
    return null
  }
  if (!label.groupId) return null

  const courses = getCourseGroups(label.groupId, criteria, student, idToGroupId)

  if (hasCreditTransfer(courses)) {
    return <SwapHorizIcon color="success" />
  }

  if (hasPassedDuringAcademicYear(courses, start, end)) {
    return <CheckIcon color="success" />
  }

  if (hasPassedOutsideAcademicYear(courses)) {
    return <CheckIcon color="disabled" />
  }

  if (hasFailed(courses)) {
    return <CloseIcon color="error" />
  }

  if (hasEnrolled(student, label.groupId, idToGroupId)) {
    return <RemoveIcon color="disabled" />
  }

  return null
}

const getSemesterEnrollmentStatus = (
  semesterEnrollments: SemesterEnrollment[] | null | undefined,
  semesters: number[]
) => {
  const fall = semesterEnrollments?.find(semester => semester.semester === Math.min(...semesters))?.type ?? 0
  const spring = semesterEnrollments?.find(semester => semester.semester === Math.max(...semesters))?.type ?? 0
  return { fall, spring }
}

const getSemesterEnrollmentContent = (
  semesterEnrollments: SemesterEnrollment[] | null | undefined,
  semesters: number[]
) => {
  const { fall, spring } = getSemesterEnrollmentStatus(semesterEnrollments, semesters)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem' }}>
      <div className={`enrollment-label ${enrollmentClassNames[fall]}`} title={`Fall: ${helpTexts[fall]}`} />
      <div className={`enrollment-label ${enrollmentClassNames[spring]}`} title={`Spring: ${helpTexts[spring]}`} />
    </div>
  )
}

/** Start and end of the student's nth (0-indexed) academic year, counting from the population's start */
const getAcademicYear = (months: number, yearIndex: number) => ({
  start: dayjs()
    .subtract(months - 1, 'months')
    .startOf('month')
    .add(yearIndex, 'years'),
  end: dayjs()
    .subtract(months - 12, 'months')
    .endOf('month')
    .add(yearIndex, 'years'),
})

/** Column title in the Excel export, unique over all years */
const getExcelKey = (label: Label, yearIndex: number) => `Year ${yearIndex + 1}: ${label.name}`

export const ProgressTable = ({
  idToGroupIdMap,
  students,
  months,
  programme,
  studyGuidanceGroupProgramme,
}: {
  idToGroupIdMap: IdToGroupId
  students: FormattedStudent[]
  months: number
  programme: string
  studyGuidanceGroupProgramme: string
}) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const { getTextIn } = useLanguage()
  const { curriculum } = useCurriculum()
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: programme }, { skip: !programme })
  const { semesters: allSemesters } = useSemesters()
  const isStudyGuidanceGroupProgramme = studyGuidanceGroupProgramme !== ''

  const labelCriteria = useMemo(() => {
    const courses: Record<string, ProgrammeCourse | undefined> = {
      ...keyBy(curriculum?.secondProgrammeCourses, 'group_id'),
      ...keyBy(curriculum?.defaultProgrammeCourses, 'group_id'),
    }

    return Object.keys(criteria?.courses ?? {}).reduce<Record<string, Label[]>>((acc, year, index) => {
      acc[year] = [
        {
          code: 'Credits',
          name: `At least ${criteria?.credits[year] ?? 0} credits during first ${(index + 1) * 12} months`,
        },
        ...(criteria?.courses[year] ?? [])
          .map((courseGroupId: string): Label => {
            const course = courses[courseGroupId]
            const code = course?.code ?? courseGroupId
            return {
              code,
              groupId: courseGroupId,
              name: `${code} ${course ? getTextIn(course.name) : 'Unknown course'}`,
            }
          })
          .sort((a, b) => a.code.localeCompare(b.code)),
        {
          code: 'Criteria',
          name: `Year ${index + 1} criteria fulfilled`,
        },
        {
          code: 'Enrollment',
          name: 'Semester enrollments',
        },
      ]
      return acc
    }, {})
  }, [criteria, curriculum, getTextIn])

  const criteriaHeaders = useMemo(
    () => getCriteriaHeaders(months, programme).filter((_, yearIndex) => yearIndex === 0 || yearIndex * 12 < months),
    [months, programme]
  )

  const semesterEnrollmentsByStudent = useMemo(
    () =>
      students.reduce<Record<string, SemesterEnrollment[] | null>>((acc, student) => {
        const correctStudyRight = student.studyRights.find(studyRight =>
          studyRight.studyRightElements.some(element => element.code === programme)
        )
        if (correctStudyRight) {
          acc[student.studentNumber] = correctStudyRight.semesterEnrollments
        }
        return acc
      }, {}),
    [students, programme]
  )

  /** Academic year date range and its semester codes for each shown year */
  const academicYears = useMemo(
    () =>
      criteriaHeaders.map((_, yearIndex) => {
        const { start, end } = getAcademicYear(months, yearIndex)
        const semesters = Object.values(allSemesters)
          .filter(
            semester => dayjs(semester.startdate).isSameOrAfter(start) && dayjs(semester.enddate).isSameOrBefore(end)
          )
          .map(semester => semester.semestercode)
        return { start, end, semesters }
      }),
    [criteriaHeaders, months, allSemesters]
  )

  const excelData = useMemo(
    () =>
      students.map(student => ({
        'Student number': student.studentNumber,
        'Last name': student.lastname,
        'First names': student.firstnames,
        ...Object.fromEntries(
          criteriaHeaders.flatMap(({ year, label: yearLabel }, yearIndex) =>
            (labelCriteria[yearLabel] ?? []).flatMap(label => {
              const key = getExcelKey(label, yearIndex)
              switch (label.code) {
                case 'Criteria':
                  return [[key, student.criteriaProgress[year]?.totalSatisfied ?? 0]]

                case 'Enrollment': {
                  const { fall, spring } = getSemesterEnrollmentStatus(
                    semesterEnrollmentsByStudent[student.studentNumber],
                    academicYears[yearIndex].semesters
                  )
                  return [
                    [`${key} - FALL`, helpTexts[fall]],
                    [`${key} - SPRING`, helpTexts[spring]],
                  ]
                }

                default:
                  return [[key, getCellText(label, criteria, student, year, idToGroupIdMap)]]
              }
            })
          )
        ),
      })),
    [students, criteriaHeaders, labelCriteria, semesterEnrollmentsByStudent, academicYears, criteria, idToGroupIdMap]
  )

  const accessorKeys = useMemo(
    () => [
      'Student number',
      'Last name',
      'First names',
      ...criteriaHeaders.flatMap(({ label: yearLabel }, yearIndex) =>
        (labelCriteria[yearLabel] ?? []).flatMap(label => {
          const key = getExcelKey(label, yearIndex)
          return label.code === 'Enrollment' ? [`${key} - FALL`, `${key} - SPRING`] : [key]
        })
      ),
    ],
    [criteriaHeaders, labelCriteria]
  )

  const columns = useMemo(() => {
    const getSortingValue = (student: FormattedStudent, label: Label, year: string) => {
      // Values:
      // -1 Course completed
      // 0 Failed
      // 1 Enrolled
      // 2 None of above
      if (!label.groupId) return 2
      if (student.criteriaProgress[year]?.coursesSatisfied?.[label.groupId]) return -1
      if (student.courses.find(course => idToGroupIdMap[course.course_id] === label.groupId)?.passed === false) return 0
      if (hasEnrolled(student, label.groupId, idToGroupIdMap)) return 1
      return 2
    }

    const createContent = (labels: Label[], year: string, yearIndex: number) => {
      const { start, end, semesters } = academicYears[yearIndex]
      return labels.map(label =>
        columnHelper.accessor(() => undefined, {
          id: `${year}-${label.groupId ?? label.code}`,
          header: label.name,
          cell: ({ row: { original: student } }) => {
            const title =
              label.code === 'Criteria'
                ? `${student.criteriaProgress[year]?.totalSatisfied ?? 0} criteria fulfilled`
                : getCellText(label, criteria, student, year, idToGroupIdMap)

            const content =
              label.code === 'Criteria'
                ? (student.criteriaProgress[year]?.totalSatisfied ?? 0)
                : label.code === 'Enrollment'
                  ? getSemesterEnrollmentContent(semesterEnrollmentsByStudent[student.studentNumber], semesters)
                  : getRowContent(student, label, year, start, end, criteria, idToGroupIdMap)

            return (
              <Tooltip title={title}>
                <Typography component="div" sx={{ m: 'auto', width: 'fit-content' }}>
                  {content}
                </Typography>
              </Tooltip>
            )
          },
          invertSorting: true,
          sortingFn: (rowA, rowB) => {
            switch (label.code) {
              case 'Credits':
                // NOTE: Convert boolean to int: (true -> 1, false -> 0) with + operator
                // Also notice rowB rowA order
                return (
                  +!!rowB.original.criteriaProgress[year]?.credits - +!!rowA.original.criteriaProgress[year]?.credits
                )

              case 'Criteria':
                // NOTE: rowB rowA order
                return (
                  (rowB.original.criteriaProgress[year]?.totalSatisfied ?? 0) -
                  (rowA.original.criteriaProgress[year]?.totalSatisfied ?? 0)
                )

              case 'Enrollment': {
                const semestersA = getSemesterEnrollmentStatus(
                  semesterEnrollmentsByStudent[rowA.original.studentNumber],
                  semesters
                )
                const semestersB = getSemesterEnrollmentStatus(
                  semesterEnrollmentsByStudent[rowB.original.studentNumber],
                  semesters
                )
                return semestersA.fall + semestersA.spring - (semestersB.fall + semestersB.spring)
              }

              default:
                return getSortingValue(rowA.original, label, year) - getSortingValue(rowB.original, label, year)
            }
          },
        })
      )
    }

    return [
      columnHelper.group({
        header: 'Student',
        columns: [
          columnHelper.accessor('studentNumber', {
            header: ({ table }) => (
              <CopyStudentNumbersHeader getStudentNumber={row => row.studentNumber} table={table} />
            ),
            cell: ({ row }) => (
              <StudentInfoItem sisPersonId={row.original.sis_person_id} studentNumber={row.original.studentNumber} />
            ),
          }),
          ...(namesVisible
            ? [
                columnHelper.accessor(() => undefined, {
                  header: 'Last name',
                  cell: ({ row }) => row.original.lastname,
                }),
                columnHelper.accessor(() => undefined, {
                  header: 'First names',
                  cell: ({ row }) => row.original.firstnames,
                }),
              ]
            : []),
        ],
      }),
      ...criteriaHeaders.map(({ title, year, label }, yearIndex) =>
        columnHelper.group({
          id: title,
          header: title,
          columns: createContent(labelCriteria[label] ?? [], year, yearIndex),
        })
      ),
    ]
  }, [
    criteria,
    criteriaHeaders,
    labelCriteria,
    academicYears,
    semesterEnrollmentsByStudent,
    namesVisible,
    idToGroupIdMap,
  ])

  const isCriteriaSet =
    criteria &&
    (Object.keys(criteria.courses).some(yearCourses => criteria.courses[yearCourses].length > 0) ||
      Object.values(criteria.credits).some(creditCriteria => creditCriteria > 0))

  return (
    <>
      {!isStudyGuidanceGroupProgramme && (
        <h5>
          Criteria can be changed <Link to={`/study-programme/${programme}?tab=3`}>here.</Link> Please refresh page
          after changes.
        </h5>
      )}
      <TableInfo />
      <Box sx={{ width: '100%' }}>
        {isCriteriaSet ? (
          <OodiTable
            columns={columns}
            data={students}
            toolbarContent={
              <>
                <OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />
                <FilterDegreeCoursesModal
                  degreeProgramme={programme}
                  initialTab="criteria"
                  icon={<EditIcon />}
                  text="Modify criteria"
                />
                <StudentNameVisibilityToggle />
              </>
            }
          />
        ) : (
          <Typography variant="h6">
            There is no criteria set for this programme. You can create one{' '}
            <Link to={`/study-programme/${programme}?tab=3`}>here</Link>.
          </Typography>
        )}
      </Box>
    </>
  )
}
