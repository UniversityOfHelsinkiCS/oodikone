import CheckIcon from '@mui/icons-material/Check'
import SquareIcon from '@mui/icons-material/CropSquare'
import MinusIcon from '@mui/icons-material/Remove'
import { isNumber, orderBy, sortBy, sumBy, uniqBy } from 'lodash'
import { useCallback, useMemo } from 'react'

import { hiddenNameAndEmailForExcel } from '@/common/columns'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { SortableTable, row } from '@/components/SortableTable'

import { DateFormat } from '@/constants/date'
import { isWithinSixMonths, reformatDate } from '@/util/timeAndDate'

import { getPassedStudents } from './GetPassedStudents'

export const CoursesTable = ({ curriculum, includeSubstitutions, populationCourses, students }) => {
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()

  const { passedStudents, passedSubstitutionStudents } = useMemo(
    () => getPassedStudents(curriculum, populationCourses),
    [curriculum, populationCourses]
  )

  const hasPassedCourse = useCallback(
    (studentNumber, code) => passedStudents[code]?.includes(studentNumber),
    [passedStudents]
  )

  const hasPassedSubstitutionCourse = useCallback(
    (studentNumber, code) => passedSubstitutionStudents[code]?.includes(studentNumber),
    [passedSubstitutionStudents]
  )

  const getUniqueCourseCodes = courses => Array.from(new Set(courses.map(({ code }) => code)))

  const calculatePassedCourses = useCallback((studentNumber, courses, hasPassed) => {
    return sumBy(getUniqueCourseCodes(courses), code => hasPassed(studentNumber, code))
  }, [])

  const totalPassed = useCallback(
    studentNumber => {
      const { defaultProgrammeCourses, secondProgrammeCourses } = curriculum
      const combinedProgrammeCourses = [...defaultProgrammeCourses, ...secondProgrammeCourses]

      const mainPassed = calculatePassedCourses(studentNumber, combinedProgrammeCourses, hasPassedCourse)
      const subPassed = includeSubstitutions
        ? calculatePassedCourses(studentNumber, combinedProgrammeCourses, hasPassedSubstitutionCourse)
        : 0

      return mainPassed + subPassed
    },
    [curriculum, hasPassedCourse, hasPassedSubstitutionCourse, includeSubstitutions, calculatePassedCourses]
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
    const defaultCourses = curriculum?.defaultProgrammeCourses ?? []
    const combinedCourses = curriculum?.secondProgrammeCourses ?? []
    const courses = [...defaultCourses, ...combinedCourses]
    const labelToCourses = courses.reduce((labels, course) => {
      const label = course.label ? course.label.label : ''
      labels[label] = labels[label] ?? []
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
        if (course.visible?.visibility) {
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
      const numericGrade = parseInt(grade, 10)
      if (Number.isInteger(numericGrade)) {
        return numericGrade
      }
      return grade
    }

    const hasActiveEnrollments = (student, code) => {
      if (!student.enrollments) {
        return false
      }
      return student.enrollments.some(enrollment => enrollment.course_code === code)
    }

    const hasCourseInStudyplan = (student, code) => {
      return (
        student?.studyplans?.some(studyplan =>
          studyplan.included_courses?.some(includedCourse => includedCourse === code)
        ) ?? false
      )
    }

    const getCompletionDate = (student, code) => {
      const course = student.courses.find(course => course.course_code === code && course.passed === true)
      return course?.date ?? null
    }

    const getEnrollmentDate = (student, code) => {
      const enrollment = student.enrollments.find(enrollment => enrollment.course_code === code)
      return enrollment.enrollment_date_time
    }

    const findBestGrade = (courses, code) => {
      const course = populationCourses?.find(course => course.course.code === code)
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
                const completionDate = getCompletionDate(student, course.code)

                if (bestGrade) {
                  cellProps.title = `Grade: ${bestGrade}`
                  if (completionDate) {
                    cellProps.title += `\nCompleted on ${reformatDate(completionDate, DateFormat.DISPLAY_DATE)}`
                  }
                } else if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = reformatDate(getEnrollmentDate(student, course.code), DateFormat.DISPLAY_DATE)
                  cellProps.title = `Enrolled on ${enrollmentDate}`
                } else if (hasCourseInStudyplan(student, course.code)) {
                  cellProps.title = 'In primary study plan'
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
                    return 5
                  }
                  return 4
                }
                if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = getEnrollmentDate(student, course.code)
                  if (isWithinSixMonths(enrollmentDate)) {
                    return 3
                  }
                  return 2
                }
                if (hasCourseInStudyplan(student, course.code)) {
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
                const passedSubstitutionCourse = hasPassedSubstitutionCourse(student.studentNumber, course.code)
                if ((bestGrade && passedCourse) || (includeSubstitutions && passedSubstitutionCourse)) {
                  return getNumericGrade(bestGrade)
                }
                if (hasActiveEnrollments(student, course.code)) {
                  return 0
                }
                if (hasCourseInStudyplan(student, course.code)) {
                  return 'HOPS'
                }
                return null
              },
              getRowContent: student => {
                if (student.total) {
                  return getTotalRowVal(student, course.code)
                }
                const bestGrade = findBestGrade(student.courses, course.code)
                const passedCourse = hasPassedCourse(student.studentNumber, course.code)
                const passedSubstitutionCourse = hasPassedSubstitutionCourse(student.studentNumber, course.code)
                if (bestGrade && passedCourse) {
                  return <CheckIcon color="success" sx={{ display: 'block', margin: 'auto' }} />
                } else if (passedSubstitutionCourse) {
                  return (
                    includeSubstitutions && <CheckIcon color="disabled" sx={{ display: 'block', margin: 'auto' }} />
                  )
                } else if (hasActiveEnrollments(student, course.code)) {
                  const enrollmentDate = getEnrollmentDate(student, course.code)
                  const color = isWithinSixMonths(enrollmentDate) ? 'warning' : 'disabled'
                  return <MinusIcon color={color} sx={{ display: 'block', margin: 'auto' }} />
                } else if (hasCourseInStudyplan(student, course.code)) {
                  return <SquareIcon color="disabled" sx={{ display: 'block', margin: 'auto' }} />
                }
                return null
              },
              code: course.code,
            })),
        }))
    )

    return columns
  }, [
    namesVisible,
    curriculum,
    getTextIn,
    includeSubstitutions,
    hasPassedCourse,
    hasPassedSubstitutionCourse,
    populationCourses,
    totalPassed,
  ])

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
            if (includeSubstitutions && hasPassedSubstitutionCourse(student.studentNumber, course.code)) {
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
  }, [includeSubstitutions, curriculum, students, hasPassedCourse, hasPassedSubstitutionCourse])

  return (
    <SortableTable
      columns={columns}
      data={data}
      featureName="courses"
      firstColumnSticky
      onlyExportColumns={hiddenNameAndEmailForExcel}
      tableId="course-of-population-students"
      title="Courses of population's students"
    />
  )
}
