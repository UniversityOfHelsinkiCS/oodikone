import { isNumber, orderBy, sortBy, sumBy, uniqBy } from 'lodash'
import moment from 'moment'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Icon, Tab } from 'semantic-ui-react'

import { hiddenNameAndEmailForExcel } from '@/common/columns'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable, row } from '@/components/SortableTable'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'

const getMandatoryPassed = (mandatoryCourses, populationCourses, studyGuidanceCourses) => {
  if (!mandatoryCourses || !mandatoryCourses.defaultProgrammeCourses || (!populationCourses && !studyGuidanceCourses)) {
    return {}
  }

  const mandatoryCodes = [
    ...mandatoryCourses.defaultProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
    ...mandatoryCourses.secondProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
  ]

  const popCourses = populationCourses || studyGuidanceCourses

  if (!popCourses.coursestatistics) {
    return {}
  }

  const courseStats = popCourses.coursestatistics
  const mandatoryPassed = mandatoryCodes.reduce((passed, code) => {
    const foundCourse = !!courseStats.find(course => course.course.code === code)
    const passedStudents = foundCourse
      ? Object.keys(courseStats.find(course => course.course.code === code).students.passed)
      : []
    passed[code] = passedStudents
    return passed
  }, {})

  return mandatoryPassed
}

const CoursesTable = ({ curriculum, students, studyGuidanceCourses }) => {
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const mandatoryCourses = curriculum
  const { data: populationCourses, pending } = useSelector(state => state?.populationSelectedStudentCourses)
  const mandatoryPassed = useMemo(
    () => getMandatoryPassed(mandatoryCourses, populationCourses, studyGuidanceCourses),
    [mandatoryCourses, populationCourses, studyGuidanceCourses]
  )

  const hasPassedMandatory = useCallback(
    (studentNumber, code) => mandatoryPassed[code] && mandatoryPassed[code].includes(studentNumber),
    [mandatoryPassed]
  )

  const totalMandatoryPassed = useCallback(
    studentNumber =>
      sumBy(Array.from(new Set(mandatoryCourses.defaultProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedMandatory(studentNumber, code)
      ) +
      sumBy(Array.from(new Set(mandatoryCourses.secondProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedMandatory(studentNumber, code)
      ),
    [mandatoryCourses, hasPassedMandatory]
  )

  const columns = useMemo(() => {
    const nameColumns = []

    nameColumns.push({
      key: 'studentNumber',
      title: 'Student number',
      getRowVal: student => (student.total ? '*' : student.studentNumber),
      getRowContent: student =>
        student.total ? 'Summary' : <StudentInfoItem showSisuLink student={student} tab="Mandatory courses table" />,
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
          : totalMandatoryPassed(student.studentNumber),
    })

    const mandatoryCourseLabels = []
    const defaultCourses = mandatoryCourses?.defaultProgrammeCourses || []
    const combinedCourses = mandatoryCourses?.secondProgrammeCourses || []
    const courses = [...defaultCourses, ...combinedCourses]
    const labelToMandatoryCourses = courses.reduce((labels, course) => {
      const label = course.label ? course.label.label : ''
      labels[label] = labels[label] || []
      if (labels[label].some(label => label.code === course.code)) {
        return labels
      }
      labels[label].push(course)
      if (course.label) {
        mandatoryCourseLabels.push({ ...course.label, code: course.parent_code })
      } else {
        mandatoryCourseLabels.push({ id: 'null', label: '', code: '' })
      }
      return labels
    }, {})

    const sortedLabels = orderBy(
      uniqBy(mandatoryCourseLabels, course => course.label),
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

    const getCourseTitle = mandatoryCourse => {
      return (
        <div
          key={`${mandatoryCourse.code}-${mandatoryCourse.label ? mandatoryCourse.label.label : 'no-label'}`}
          style={{ maxWidth: '15em', overflow: 'hidden', whiteSpace: 'normal', width: 'max-content' }}
        >
          <div key={`${mandatoryCourse.label ? mandatoryCourse.label.label : 'no-label'}-${mandatoryCourse.code}`}>
            {mandatoryCourse.code}
          </div>
          <div
            key={`${mandatoryCourse.label ? mandatoryCourse.label.label : 'no-label'}-${getTextIn(mandatoryCourse.name)}`}
            style={{ color: 'gray', fontWeight: 'normal' }}
          >
            {getTextIn(mandatoryCourse.name)}
          </div>
        </div>
      )
    }

    const getTotalRowVal = (total, code) => total[code]

    const hasActiveEnrollments = (student, code) => {
      if (!student.enrollments) {
        return false
      }
      return student.enrollments.some(enrollment => enrollment.course_code === code && enrollment.state === 'ENROLLED')
    }

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
          children: sortBy(labelToMandatoryCourses[label.label], [
            mandatoryCourse => {
              const codeDigits = mandatoryCourse.code.match(/\d+/)
              return codeDigits ? Number(codeDigits[0]) : Number.MAX_VALUE
            },
            'code',
          ])
            .filter(course => visibleCourseCodes.has(course.code))
            .map(mandatoryCourse => ({
              key: `${mandatoryCourse.label ? mandatoryCourse.label.label : 'no-label'}-${mandatoryCourse.code}`,
              title: getCourseTitle(mandatoryCourse),
              textTitle: mandatoryCourse.code,
              vertical: true,
              forceToolsMode: 'dangling',
              cellProps: student => {
                if (!student.courses) {
                  return null
                }
                const bestGrade = findBestGrade(student.courses, mandatoryCourse.code)
                const gradeText = bestGrade ? `\nGrade: ${bestGrade}` : ''
                const studentCode = student.studentNumber ? `\nStudent number:  ${student.studentNumber}` : ''
                return {
                  title: `${mandatoryCourse.code}, ${getTextIn(mandatoryCourse.name)}${studentCode} ${gradeText}`,
                  style: {
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  },
                }
              },
              headerProps: { title: `${mandatoryCourse.code}, ${getTextIn(mandatoryCourse.name)}` },
              getRowVal: student => {
                if (student.total) {
                  return getTotalRowVal(student, mandatoryCourse.code)
                }
                return hasPassedMandatory(student.studentNumber, mandatoryCourse.code) ? 'Passed' : ''
              },
              getRowExportVal: student => {
                if (student.total) {
                  return getTotalRowVal(student, mandatoryCourse.code)
                }
                const bestGrade = findBestGrade(student.courses, mandatoryCourse.code)
                if (!bestGrade) {
                  if (hasActiveEnrollments(student, mandatoryCourse.code)) {
                    return 0
                  }
                  return ''
                }
                if (bestGrade === 'Hyl.') {
                  return 0
                }
                if (['1', '2', '3', '4', '5'].includes(bestGrade)) {
                  return parseInt(bestGrade, 10)
                }
                return bestGrade
              },
              getRowContent: student => {
                if (student.total) {
                  return getTotalRowVal(student, mandatoryCourse.code)
                }
                if (hasPassedMandatory(student.studentNumber, mandatoryCourse.code)) {
                  return <Icon color="green" fitted name="check" />
                }
                if (hasActiveEnrollments(student, mandatoryCourse.code)) {
                  const enrollmentDate = getEnrollmentDate(student, mandatoryCourse.code)
                  const color = moment(enrollmentDate) > moment().subtract(6, 'months') ? 'yellow' : 'grey'
                  return <Icon color={color} fitted name="minus" />
                }
                return null
              },
              code: mandatoryCourse.code,
            })),
        }))
    )

    return columns
  }, [namesVisible, mandatoryCourses, getTextIn])

  const data = useMemo(() => {
    const totals = students.reduce(
      (total, student) => {
        const passedCourses = new Set()
        if (mandatoryCourses.defaultProgrammeCourses) {
          mandatoryCourses.defaultProgrammeCourses.forEach(mandatoryCourse => {
            if (passedCourses.has(mandatoryCourse.code)) {
              return
            }
            passedCourses.add(mandatoryCourse.code)
            if (hasPassedMandatory(student.studentNumber, mandatoryCourse.code)) {
              ++total[mandatoryCourse.code]
            }
          })
        }
        return total
      },
      mandatoryCourses.defaultProgrammeCourses
        ? mandatoryCourses.defaultProgrammeCourses.reduce(
            (total, mandatoryCourse) => ({ ...total, [mandatoryCourse.code]: 0 }),
            { total: true }
          )
        : { total: true }
    )

    return [row(totals, { ignoreFilters: true, ignoreSorting: true }), ...students]
  }, [students, mandatoryCourses, hasPassedMandatory, mandatoryPassed])

  return (
    <Tab.Pane loading={pending}>
      {mandatoryCourses?.defaultProgrammeCourses.length > 0 && (
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

export const CoursesTabContainer = ({ curriculum, students, studyGuidanceGroup, variant }) => {
  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupCoursesTabContainer curriculum={curriculum} group={studyGuidanceGroup} students={students} />
    )
  }

  return <CoursesTable curriculum={curriculum} students={students} />
}
