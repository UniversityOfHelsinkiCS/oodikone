import { isNumber, orderBy, sortBy, sumBy, uniqBy } from 'lodash'
import moment from 'moment'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Icon, Tab } from 'semantic-ui-react'

import { reformatDate } from '@/common'
import { hiddenNameAndEmailForExcel } from '@/common/columns'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable, row } from '@/components/SortableTable'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'

const getCourseCodes = curriculum => {
  return [
    ...curriculum.defaultProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
    ...curriculum.secondProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
  ]
}

const getPassedStudents = (curriculum, populationCourses, studyGuidanceCourses) => {
  if (!curriculum || !curriculum.defaultProgrammeCourses || (!populationCourses && !studyGuidanceCourses)) {
    return {}
  }

  const courseCodes = getCourseCodes(curriculum)

  const { coursestatistics } = populationCourses || studyGuidanceCourses
  if (!coursestatistics) {
    return {}
  }

  const passedStudents = courseCodes.reduce((passed, courseCode) => {
    passed[courseCode] = []
    const course = coursestatistics.find(course => course.course.code === courseCode)
    if (course) {
      passed[courseCode] = Object.keys(course.students.passed)
    }
    return passed
  }, {})

  return passedStudents
}

const getPassedSubstitutionStudents = (curriculum, populationCourses, studyGuidanceCourses) => {
  if (!curriculum || !curriculum.defaultProgrammeCourses || (!populationCourses && !studyGuidanceCourses)) {
    return {}
  }

  const courseCodes = getCourseCodes(curriculum)

  const { coursestatistics } = populationCourses || studyGuidanceCourses
  if (!coursestatistics) {
    return {}
  }

  const passedStudents = courseCodes.reduce((passed, courseCode) => {
    const course = coursestatistics.find(course => course.course.code === courseCode)
    if (!course) {
      return passed
    }
    const { substitutions } = course.course
    passed[courseCode] = []
    substitutions.forEach(code => {
      const course = coursestatistics.find(course => course.course.code === code)
      if (course) {
        const students = Object.keys(course.students.passed)
        if (students.length > 0) {
          passed[courseCode].push(...students)
        }
      }
    })
    return passed
  }, {})

  return passedStudents
}

const CoursesTable = ({ curriculum, showSubstitutions, students, studyGuidanceCourses }) => {
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const { data: populationCourses, pending } = useSelector(state => state?.populationSelectedStudentCourses)

  const passedStudents = useMemo(
    () => getPassedStudents(curriculum, populationCourses, studyGuidanceCourses),
    [curriculum, populationCourses, studyGuidanceCourses]
  )

  const passedSubstitutionStudents = useMemo(
    () => getPassedSubstitutionStudents(curriculum, populationCourses, studyGuidanceCourses),
    [curriculum, populationCourses, studyGuidanceCourses]
  )

  const hasPassedCourse = useCallback(
    (studentNumber, code) => passedStudents[code] && passedStudents[code].includes(studentNumber),
    [passedStudents]
  )

  const hasPassedSubstitutionCourse = useCallback(
    (studentNumber, code) =>
      passedSubstitutionStudents[code] && passedSubstitutionStudents[code].includes(studentNumber),
    [passedSubstitutionStudents]
  )

  const totalPassed = useCallback(
    studentNumber =>
      sumBy(Array.from(new Set(curriculum.defaultProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedCourse(studentNumber, code)
      ) +
      sumBy(Array.from(new Set(curriculum.secondProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedCourse(studentNumber, code)
      ) +
      (showSubstitutions
        ? sumBy(Array.from(new Set(curriculum.defaultProgrammeCourses.map(({ code }) => code))), code =>
            hasPassedSubstitutionCourse(studentNumber, code)
          ) +
          sumBy(Array.from(new Set(curriculum.secondProgrammeCourses.map(({ code }) => code))), code =>
            hasPassedSubstitutionCourse(studentNumber, code)
          )
        : 0),
    [curriculum, hasPassedCourse, hasPassedSubstitutionCourse, showSubstitutions]
  )

  const columns = useMemo(() => {
    const nameColumns = []

    nameColumns.push({
      key: 'studentNumber',
      title: 'Student number',
      getRowVal: student => (student.total ? '*' : student.studentNumber),
      getRowContent: student => (student.total ? 'Summary' : <StudentInfoItem showSisuLink student={student} />),
    })

    if (namesVisible) {
      nameColumns.push(
        {
          key: 'lastName',
          title: 'Last name',
          getRowVal: student => (student.total ? null : student.lastname),
          export: false,
        },
        {
          key: 'givenNames',
          title: 'Given names',
          getRowVal: student => (student.total ? null : student.firstnames),
          export: false,
        }
      )
    }

    nameColumns.push({
      key: 'totalPassed',
      title: 'Total passed',
      filterType: 'range',
      vertical: true,
      getRowVal: student =>
        student.total
          ? Object.values(student)
              .filter(isNumber)
              .reduce((total, courses) => total + courses, 0)
          : totalPassed(student.studentNumber),
    })

    const courseLabels = []
    const defaultCourses = curriculum?.defaultProgrammeCourses || []
    const combinedCourses = curriculum?.secondProgrammeCourses || []
    const courses = [...defaultCourses, ...combinedCourses]
    const labelToCourses = courses.reduce((labels, course) => {
      const label = course.label ? course.label.label : ''
      labels[label] = labels[label] || []
      if (labels[label].some(label => label.code === course.code)) {
        return labels
      }
      labels[label].push(course)
      if (course.label) {
        courseLabels.push({ ...course.label, code: course.parent_code })
      } else {
        courseLabels.push({ id: 'null', label: '', code: '' })
      }
      return labels
    }, {})

    const sortedLabels = orderBy(
      uniqBy(courseLabels, course => course.label),
      [label => label.orderNumber],
      ['asc']
    )

    const { visibleLabels, visibleCourseCodes } = courses.reduce(
      (total, course) => {
        if (course.visible && course.visible.visibility) {
          total.visibleLabels.add(course.parent_code)
          total.visibleCourseCodes.add(course.code)
        }
        return total
      },
      { visibleLabels: new Set(), visibleCourseCodes: new Set() }
    )

    const getLabel = course => (course.label ? course.label.label : 'no-label')

    const getCourseTitle = course => {
      return (
        <div
          key={`${course.code}-${getLabel(course)}`}
          style={{ maxWidth: '15em', overflow: 'hidden', whiteSpace: 'normal', width: 'max-content' }}
        >
          <div key={`${getLabel(course)}-${course.code}`}>{course.code}</div>
          <div key={`${getLabel(course)}-${getTextIn(course.name)}`} style={{ color: 'gray', fontWeight: 'normal' }}>
            {getTextIn(course.name)}
          </div>
        </div>
      )
    }

    const getTotalRowVal = (total, code) => total[code]

    const getNumericGrade = grade => {
      if (grade === 'Hyl.') {
        return 0
      }
      if (['1', '2', '3', '4', '5'].includes(grade)) {
        return parseInt(grade, 10)
      }
      return null
    }

    const hasActiveEnrollments = (student, code) => {
      if (!student.enrollments) {
        return false
      }
      return student.enrollments.some(enrollment => enrollment.course_code === code && enrollment.state === 'ENROLLED')
    }

    const isWithinSixMonths = date => moment(date) > moment().subtract(6, 'months')

    const hasPassedSubstitution = (bestGrade, passedCourse) => showSubstitutions && bestGrade && !passedCourse

    const getEnrollmentDate = (student, code) =>
      student.enrollments.find(enrollment => enrollment.course_code === code && enrollment.state === 'ENROLLED')
        .enrollment_date_time

    const findBestGrade = (courses, code) => {
      const course = populationCourses?.coursestatistics?.find(course => course.course.code === code)
      if (!course) {
        return null
      }

      const { substitutions } = course.course
      const courseAttainments = courses.filter(
        course =>
          [code, `AY${code}`, `A${code}`].includes(course.course_code) ||
          substitutions.some(substitution =>
            [substitution, `AY${substitution}`, substitution.startsWith('A') && substitution.substring(1)].includes(
              course.course_code
            )
          )
      )

      if (courseAttainments.length === 0) {
        return null
      }

      const bestGrade = sortBy(courseAttainments, element => {
        const order = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4, HT: 5, TT: 6, 'Hyv.': 7, 'Hyl.': 8 }
        return order[element.grade]
      })[0].grade

      return bestGrade
    }

    const columns = []

    columns.push(
      {
        key: 'general',
        title: <b>Labels</b>,
        textTitle: null,
        children: nameColumns,
      },
      ...sortedLabels
        .filter(({ code }) => visibleLabels.has(code))
        .map(label => ({
          key: label.id + label.code,
          title: (
            <div key={label.code} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div key={`${label.code}-${label.id}`}>{label.code}</div>
              <div key={`${label.code}${label.id}`} style={{ color: 'gray', fontWeight: 'normal' }}>
                {label.id}
              </div>
            </div>
          ),
          textTitle: label.code,
          thickBorders: true,
          children: sortBy(labelToCourses[label.label], [
            course => {
              const codeDigits = course.code.match(/\d+/)
              return codeDigits ? Number(codeDigits[0]) : Number.MAX_VALUE
            },
            'code',
          ])
            .filter(course => visibleCourseCodes.has(course.code))
            .map(course => ({
              key: `${getLabel(course)}-${course.code}`,
              title: getCourseTitle(course),
              textTitle: course.code,
              vertical: true,
              forceToolsMode: 'dangling',
              cellProps: student => {
                if (!student.courses) {
                  return null
                }
                const cellProps = {
                  title: null,
                  style: {
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  },
                }
                const bestGrade = findBestGrade(student.courses, course.code)
                if (bestGrade) {
                  cellProps.title = `Grade: ${bestGrade}`
                } else if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = reformatDate(getEnrollmentDate(student, course.code), 'DD.MM.YYYY')
                  cellProps.title = `Enrolled on ${enrollmentDate}`
                }
                return cellProps
              },
              headerProps: { title: `${course.code}, ${getTextIn(course.name)}` },
              getRowVal: student => {
                if (student.total) {
                  return getTotalRowVal(student, course.code)
                }
                const bestGrade = findBestGrade(student.courses, course.code)
                if (bestGrade) {
                  if (hasPassedCourse(student.studentNumber, course.code)) {
                    return 4
                  }
                  return 3
                }
                if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = getEnrollmentDate(student, course.code)
                  if (isWithinSixMonths(enrollmentDate)) {
                    return 2
                  }
                  return 1
                }
                return 0
              },
              getRowExportVal: student => {
                if (student.total) {
                  return getTotalRowVal(student, course.code)
                }
                const bestGrade = findBestGrade(student.courses, course.code)
                const passedCourse = hasPassedCourse(student.studentNumber, course.code)
                if ((bestGrade && passedCourse) || hasPassedSubstitution(bestGrade, passedCourse)) {
                  return getNumericGrade(bestGrade)
                }
                if (hasActiveEnrollments(student, course.code)) {
                  return 0
                }
                return null
              },
              getRowContent: student => {
                if (student.total) {
                  return getTotalRowVal(student, course.code)
                }
                const bestGrade = findBestGrade(student.courses, course.code)
                const passedCourse = hasPassedCourse(student.studentNumber, course.code)
                if (bestGrade && passedCourse) {
                  return <Icon color="green" fitted name="check" />
                }
                if (hasPassedSubstitution(bestGrade, passedCourse)) {
                  return <Icon color="grey" fitted name="check" />
                }
                if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = getEnrollmentDate(student, course.code)
                  const color = isWithinSixMonths(enrollmentDate) ? 'yellow' : 'grey'
                  return <Icon color={color} fitted name="minus" />
                }
                return null
              },
              code: course.code,
            })),
        }))
    )

    return columns
  }, [namesVisible, curriculum, getTextIn])

  const data = useMemo(() => {
    const totals = students.reduce(
      (total, student) => {
        const passedCourses = new Set()
        if (curriculum.defaultProgrammeCourses) {
          curriculum.defaultProgrammeCourses.forEach(course => {
            if (passedCourses.has(course.code)) {
              return
            }
            passedCourses.add(course.code)
            if (hasPassedCourse(student.studentNumber, course.code)) {
              ++total[course.code]
            }
          })
        }
        return total
      },
      curriculum.defaultProgrammeCourses
        ? curriculum.defaultProgrammeCourses.reduce((total, course) => ({ ...total, [course.code]: 0 }), {
            total: true,
          })
        : { total: true }
    )

    return [row(totals, { ignoreFilters: true, ignoreSorting: true }), ...students]
  }, [students, curriculum, hasPassedCourse, passedStudents])

  return (
    <Tab.Pane loading={pending}>
      {curriculum?.defaultProgrammeCourses.length > 0 && (
        <SortableTable
          columns={columns}
          data={data}
          featureName="courses"
          firstColumnSticky
          onlyExportColumns={hiddenNameAndEmailForExcel}
          tableId="course-of-population-students"
          title="Courses of population's students"
        />
      )}
    </Tab.Pane>
  )
}

const StudyGuidanceGroupCoursesTabContainer = ({ curriculum, group, students }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const populationsCourses = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: groupStudentNumbers,
    year: group?.tags?.year,
  }).data
  if (populationsCourses.pending) {
    return null
  }
  return <CoursesTable curriculum={curriculum} students={students} studyGuidanceCourses={populationsCourses} />
}

export const CoursesTabContainer = ({ curriculum, showSubstitutions, students, studyGuidanceGroup, variant }) => {
  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupCoursesTabContainer curriculum={curriculum} group={studyGuidanceGroup} students={students} />
    )
  }

  return <CoursesTable curriculum={curriculum} showSubstitutions={showSubstitutions} students={students} />
}
