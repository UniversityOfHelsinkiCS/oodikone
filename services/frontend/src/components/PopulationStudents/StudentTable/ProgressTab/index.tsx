import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { createColumnHelper } from '@tanstack/react-table'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { range, keyBy } from 'lodash-es'
import { useMemo } from 'react'

import { Link } from '@/components/common/Link'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/common/StudentNameVisibilityToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { DateFormat } from '@/constants/date'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { useGetSemestersQuery } from '@/redux/semesters'
import { CheckIcon, CloseIcon, RemoveIcon, SwapHorizIcon } from '@/theme'
import { isMedicalProgramme } from '@/util/studyProgramme'
import { formatDate } from '@/util/timeAndDate'
import { Semester } from '@oodikone/shared/models'
import { CreditTypeCode, FormattedStudent, Name, ProgressCriteria, SemesterEnrollment } from '@oodikone/shared/types'
import { StudentCourse } from '@oodikone/shared/types/studentData'
import { TableInfo } from './info'
import './index.css'

dayjsExtend(isBetween)
dayjsExtend(isSameOrBefore)
dayjsExtend(isSameOrAfter)

const columnHelper = createColumnHelper<FormattedStudent>()

const getCourses = (
  courseCode: string,
  criteria: ProgressCriteria | undefined,
  student: FormattedStudent
): StudentCourse[] => {
  return student.courses.filter(
    course => course.course_code === courseCode || criteria?.allCourses[courseCode]?.includes(course.course_code)
  )
}

const hasCreditTransfer = (courses: StudentCourse[]) =>
  courses?.some(course => course.credittypecode === CreditTypeCode.APPROVED)

const hasPassedDuringAcademicYear = (courses: StudentCourse[], start: dayjs.Dayjs, end: dayjs.Dayjs) => {
  return (
    courses.some(course => course.passed) &&
    courses.some(course => dayjs(course.date).isBetween(dayjs(start), dayjs(end)))
  )
}

const hasPassedOutsideAcademicYear = (courses: StudentCourse[]) => courses?.some(course => course.passed)

const hasFailed = (courses: StudentCourse[]) => courses?.some(course => course.passed === false)

const hasEnrolled = (student: FormattedStudent, courseCode: string) => {
  return student.enrollments?.map(course => course.course_code).includes(courseCode)
}

const getEnrollment = (student: FormattedStudent, courseCode: string) => {
  return student.enrollments.filter(enrollment => enrollment.course_code === courseCode)
}

const getRowContent = (
  student: FormattedStudent,
  courseCode: string,
  year: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  criteria: ProgressCriteria | undefined
) => {
  if (courseCode.includes('Credits')) {
    if (student.criteriaProgress[year]?.credits) {
      return <CheckIcon color="success" />
    }
    return null
  }

  const courses = getCourses(courseCode, criteria, student)

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

  if (hasEnrolled(student, courseCode)) {
    return <RemoveIcon color="disabled" />
  }

  return null
}

const getExcelText = (
  courseCode: string,
  criteria: ProgressCriteria | undefined,
  student: FormattedStudent,
  year: string
) => {
  if (courseCode.includes('Credits')) {
    return student.criteriaProgress[year]?.credits ? 'Passed' : ''
  }

  const courses = getCourses(courseCode, criteria, student)

  if (hasPassedOutsideAcademicYear(courses)) {
    return `Passed ${formatDate(courses[0].date, DateFormat.ISO_DATE)}`
  }

  if (hasFailed(courses)) {
    return `Failed ${formatDate(courses[0].date, DateFormat.ISO_DATE)}`
  }

  if (hasEnrolled(student, courseCode)) {
    const enrollment = getEnrollment(student, courseCode)
    return `Enrollment ${formatDate(enrollment[0].enrollment_date_time, DateFormat.ISO_DATE)}`
  }

  return ''
}

const getCriteriaHeaders = (months: number, programme: string) => {
  const criteriaHeaders = [
    { title: months < 12 ? 'Academic year 1 (in progress)' : 'Academic year 1', year: 'year1', label: 'yearOne' },
    { title: months < 24 ? 'Academic year 2 (in progress)' : 'Academic year 2', year: 'year2', label: 'yearTwo' },
    { title: months < 36 ? 'Academic year 3 (in progress)' : 'Academic year 3', year: 'year3', label: 'yearThree' },
  ]
  if (isMedicalProgramme(programme)) {
    criteriaHeaders.push(
      { title: months < 48 ? 'Academic year 4 (in progress)' : 'Academic year 4', year: 'year4', label: 'yearFour' },
      { title: months < 60 ? 'Academic year 5 (in progress)' : 'Academic year 5', year: 'year5', label: 'yearFive' },
      { title: months < 72 ? 'Academic year 6 (in progress)' : 'Academic year 6', year: 'year6', label: 'yearSix' }
    )
  }
  return criteriaHeaders
}

type Label = {
  code: string
  name: Name
}

export const ProgressTable = ({
  curriculum,
  students,
  months,
  programme,
  studyGuidanceGroupProgramme,
}: {
  curriculum?: ExtendedCurriculumDetails | null
  students: FormattedStudent[]
  months: number
  programme: string
  studyGuidanceGroupProgramme: string
}) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const { getTextIn } = useLanguage()
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: programme }, { skip: !programme })
  const { data } = useGetSemestersQuery()
  // HACK: We want data to be semesters or empty object, but eslint doesn't like it. {} accepts also 0 and "" but that isn't possible here
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const { semesters: allSemesters }: { semesters: Record<string, Semester> | {} } = data ?? { semesters: {} }
  const isStudyGuidanceGroupProgramme = studyGuidanceGroupProgramme !== ''
  const creditMonths = [12, 24, 36, 48, 60, 72]
  const defaultCourses = keyBy(curriculum?.defaultProgrammeCourses, 'code')
  const coursesSecondProgramme = keyBy(curriculum?.secondProgrammeCourses, 'code')

  const getCourseName = (courseCode: string): Name => {
    if (defaultCourses[courseCode]) {
      return defaultCourses[courseCode].name
    }
    if (coursesSecondProgramme[courseCode]) {
      return coursesSecondProgramme[courseCode].name
    }
    return { fi: '', sv: '', en: '' }
  }

  const labelCriteria = Object.keys(criteria?.courses ?? {}).reduce<Record<string, Label[]>>((acc, year, index) => {
    acc[year] = [
      {
        code: 'Credits',
        name: {
          fi: `${creditMonths[index]} mos.: ${criteria?.credits[year]}`,
          en: `${creditMonths[index]} mos.: ${criteria?.credits[year]}`,
          sv: `${creditMonths[index]} mos.: ${criteria?.credits[year]}`,
        },
      },
      ...[...(criteria?.courses[year] ?? [])]
        .sort((a: string, b: string) => a.localeCompare(b))
        .map((courseCode: string) => ({
          code: courseCode,
          name: getCourseName(courseCode),
        })),
      {
        code: 'Criteria',
        name: {
          fi: `Year ${index + 1}: Fullfilled`,
          en: `Year ${index + 1}: Fullfilled`,
          sv: `Year ${index + 1}: Fullfilled`,
        },
      },
      {
        code: 'Enrollment',
        name: { en: `Year ${index + 1}` },
      },
    ]
    return acc
  }, {})

  const criteriaHeaders = getCriteriaHeaders(months, programme)

  const studentNumberToSemesterEnrollmentsMap = students.reduce<Record<string, SemesterEnrollment[] | null>>(
    (acc, student) => {
      const correctStudyRight = student.studyRights.find(studyRight =>
        studyRight.studyRightElements.some(element => element.code === programme)
      )
      if (correctStudyRight) {
        acc[student.studentNumber] = correctStudyRight.semesterEnrollments
      }
      return acc
    },
    {}
  )

  const helpTexts = {
    0: 'No information',
    1: 'Active',
    2: 'Absent',
    3: 'Passive',
  }

  const getSemesterEnrollmentStatus = (student: FormattedStudent, semesters: number[]) => {
    const fall =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.min(...semesters)
      )?.type ?? 0

    const spring =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.max(...semesters)
      )?.type ?? 0

    return { fall, spring }
  }

  const getSemesterEnrollmentVal = (student: FormattedStudent, semesters: number[]) => {
    const { fall, spring } = getSemesterEnrollmentStatus(student, semesters)
    return [helpTexts[fall], helpTexts[spring]]
  }

  const getSemesterEnrollmentContent = (student: FormattedStudent, semesters: number[]) => {
    const enrollmentTypes = {
      0: { className: 'label-none' },
      1: { className: 'label-present' },
      2: { className: 'label-absent' },
      3: { className: 'label-passive' },
    }
    const fall =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.min(...semesters)
      )?.type ?? 0
    const spring =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.max(...semesters)
      )?.type ?? 0

    const fallText = `Fall: ${helpTexts[fall]}`
    const springText = `Spring: ${helpTexts[spring]}`
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem' }}>
        <div className={`enrollment-label ${enrollmentTypes[fall]?.className}`} title={fallText} />
        <div className={`enrollment-label ${enrollmentTypes[spring]?.className}`} title={springText} />
      </div>
    )
  }

  const getSortingValue = (student: FormattedStudent, label: Label, year: string) => {
    // Values:
    // -1 Course completed
    // 0 Failed
    // 1 Enrolled
    // 2 None of aove
    const criteriaCourses = student.criteriaProgress[year]?.coursesSatisfied
    const course = criteriaCourses?.[label.code]

    if (course) return -1
    if (student.courses.find(course => course.course_code === label.code)?.passed === false) return 0
    if (!course && hasEnrolled(student, label.code)) return 1
    return 2
  }

  const createContent = (labels: Label[], year: string, start: dayjs.Dayjs, end: dayjs.Dayjs, semesters: number[]) => {
    return (
      labels?.map(label =>
        columnHelper.accessor(() => undefined, {
          id: `${year}-${label.code}-${label.name.fi}`,
          header: getTextIn(label.name) ?? label.code,
          cell: ({ row: { original: student } }) => {
            const title = label.code.includes('Criteria')
              ? `${student.criteriaProgress[year]?.totalSatisfied ?? 0} criteria fullfilled`
              : getExcelText(label.code, criteria, student, year)

            const content = label.code.includes('Criteria')
              ? (student.criteriaProgress[year]?.totalSatisfied ?? 0)
              : label.code.includes('Enrollment')
                ? getSemesterEnrollmentContent(student, semesters)
                : getRowContent(student, label.code, year, start, end, criteria)

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
                return +rowB.original.criteriaProgress[year].credits - +rowA.original.criteriaProgress[year].credits

              case 'Criteria':
                // NOTE: rowB rowA order
                return (
                  rowB.original.criteriaProgress[year].totalSatisfied -
                  rowA.original.criteriaProgress[year].totalSatisfied
                )

              case 'Enrollment': {
                const semestersA = getSemesterEnrollmentStatus(rowA.original, semesters)
                const semestersB = getSemesterEnrollmentStatus(rowB.original, semesters)
                return semestersA.fall + semestersA.spring - (semestersB.fall + semestersB.spring)
              }

              default:
                return getSortingValue(rowA.original, label, year) - getSortingValue(rowB.original, label, year)
            }
          },
        })
      ) ?? []
    )
  }

  const generateYearColumns = (startYear: dayjs.Dayjs, endYear: dayjs.Dayjs, criteriaIndex: number) => {
    const semesters = Object.values<Semester>(allSemesters)
      .filter(
        semester =>
          dayjs(semester.startdate).isSameOrAfter(startYear) && dayjs(semester.enddate).isSameOrBefore(endYear)
      )
      .map(semester => semester.semestercode)

    return columnHelper.group({
      id: criteriaHeaders[criteriaIndex].title,
      header: criteriaHeaders[criteriaIndex].title,
      columns: createContent(
        labelCriteria[criteriaHeaders[criteriaIndex].label],
        criteriaHeaders[criteriaIndex].year,
        startYear,
        endYear,
        semesters
      ),
    })
  }

  const academicYearStart = dayjs()
    .subtract(months - 1, 'months')
    .startOf('month')
  const academicYearEnd = dayjs()
    .subtract(months - 12, 'months')
    .endOf('month')

  // HACK: Have fun with this one.
  const excelData = useMemo(
    () =>
      students.map(student => ({
        'Student number': student.studentNumber,
        'Last name': student.lastname,
        'First names': student.firstnames,
        ...Object.fromEntries(
          range(0, isMedicalProgramme(programme) ? 6 : 3)
            .filter(year => year * 12 < months)
            .flatMap(year => {
              const startYear = dayjs(academicYearStart).add(year, 'years')
              const endYear = dayjs(academicYearEnd).add(year, 'years')

              const semesters = Object.values<Semester>(allSemesters)
                .filter(
                  semester =>
                    dayjs(semester.startdate).isSameOrAfter(startYear) &&
                    dayjs(semester.enddate).isSameOrBefore(endYear)
                )
                .map(semester => semester.semestercode)

              return (
                labelCriteria[criteriaHeaders[year].label]?.flatMap(label =>
                  label.code === 'Criteria'
                    ? [[getTextIn(label.name), student.criteriaProgress[`year${year + 1}`]?.totalSatisfied ?? 0]]
                    : label.code === 'Enrollment'
                      ? (() => {
                          const [fall, spring] = getSemesterEnrollmentVal(student, semesters)
                          return [
                            [`${getTextIn(label.name)} - FALL`, fall],
                            [`${getTextIn(label.name)} - SPRING`, spring],
                          ]
                        })()
                      : [[getTextIn(label.name), student.criteriaProgress[`year${year + 1}`]?.credits ? 'Passed' : '']]
                ) ?? []
              )
            })
            .filter(([key, _]) => !!key)
        ),
      })),
    [students, allSemesters, programme, labelCriteria]
  )

  const accessorKeys = useMemo(
    () => [
      'Student number',
      'Last name',
      'First names',
      ...range(0, isMedicalProgramme(programme) ? 6 : 3)
        .filter(year => year * 12 < months)
        .flatMap(year => {
          return (
            labelCriteria[criteriaHeaders[year].label]?.flatMap(label => {
              const labelName = getTextIn(label.name) ?? ''
              return label.code === 'Enrollment' ? [`${labelName} - FALL`, `${labelName} - SPRING`] : [labelName]
            }) ?? []
          )
        })
        .filter(key => !!key),
    ],
    [programme, labelCriteria]
  )

  const columns = useMemo(() => {
    const columns = [
      columnHelper.group({
        header: 'Student',
        columns: [
          columnHelper.accessor('studentNumber', {
            header: 'Student number',
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
      generateYearColumns(academicYearStart, academicYearEnd, 0),
    ]

    const addYearColumns = (year: number) => {
      if (months > year * 12) {
        columns.push(
          generateYearColumns(
            dayjs(academicYearStart).add(year, 'years'),
            dayjs(academicYearEnd).add(year, 'years'),
            year
          )
        )
      }
    }

    addYearColumns(1)
    addYearColumns(2)

    if (isMedicalProgramme(programme)) {
      addYearColumns(3)
      addYearColumns(4)
      addYearColumns(5)
    }

    return columns
  }, [criteria, students, curriculum, getTextIn, namesVisible])

  const isCriteriaSet =
    criteria && Object.keys(criteria.courses).some(yearCourses => criteria.courses[yearCourses].length > 0)

  const tableOptions = {}

  if (!students.length) return null

  return (
    <>
      {!isStudyGuidanceGroupProgramme && (
        <h5>
          Criteria can be changed <Link to={`/study-programme/${programme}?tab=3`}>here.</Link> Please refresh page
          after changes.
        </h5>
      )}
      <TableInfo />
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: '100%' }}>
          {isCriteriaSet ? (
            <OodiTable
              columns={columns}
              data={students}
              options={tableOptions}
              toolbarContent={
                <>
                  <OodiTableExcelExport data={excelData} exportColumnKeys={accessorKeys} />
                  <StudentNameVisibilityToggle />
                </>
              }
            />
          ) : (
            <Typography variant="h6">There is no criteria set for this programme.</Typography>
          )}
        </Box>
      </Box>
    </>
  )
}
