import { keyBy } from 'lodash'
import moment from 'moment'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Icon, Message, Tab } from 'semantic-ui-react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import './index.css'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { SortableTable } from '@/components/SortableTable'
import { ISO_DATE_FORMAT } from '@/constants/date'
import { useGetSemestersQuery } from '@/redux/semesters'
import { isMedicalProgramme } from '@/util/studyProgramme'

const getCourses = (courseCode, criteria, student) => {
  return student.courses.filter(
    course =>
      course.course_code === courseCode ||
      (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
  )
}

const hasCreditTransfer = courses => courses && courses.some(course => course.credittypecode === 9)

const hasPassedDuringAcademicYear = (courses, start, end) => {
  return (
    courses &&
    courses.some(course => course.passed) &&
    courses.some(course => moment(course.date).isBetween(moment(start), moment(end)))
  )
}

const hasPassedOutsideAcademicYear = courses => courses && courses.some(course => course.passed)

const hasFailed = courses => courses && courses.some(course => course.passed === false)

const hasEnrolled = (student, courseCode) => {
  return student.enrollments && student.enrollments.map(course => course.course_code).includes(courseCode)
}

const getEnrollment = (student, courseCode) => {
  return student.enrollments.filter(enrollment => enrollment.course_code === courseCode)
}

const getRowContent = (student, courseCode, year, start, end, criteria) => {
  if (courseCode.includes('Credits')) {
    if (student.criteriaProgress[year] && student.criteriaProgress[year].credits) {
      return <Icon color="green" fitted name="check" title="Checked" />
    }
    return null
  }

  const courses = getCourses(courseCode, criteria, student)

  if (hasCreditTransfer(courses)) {
    return <Icon color="green" name="clipboard check" />
  }

  if (hasPassedDuringAcademicYear(courses, start, end)) {
    return <Icon color="green" fitted name="check" />
  }

  if (hasPassedOutsideAcademicYear(courses)) {
    return <Icon color="grey" fitted name="check" />
  }

  if (hasFailed(courses)) {
    return <Icon color="red" fitted name="times" />
  }

  if (hasEnrolled(student, courseCode)) {
    return <Icon color="grey" fitted name="minus" />
  }

  return null
}

const getExcelText = (courseCode, criteria, student, year) => {
  if (courseCode.includes('Credits')) {
    return student.criteriaProgress[year] && student.criteriaProgress[year].credits ? 'Passed' : ''
  }

  const courses = getCourses(courseCode, criteria, student)

  if (hasPassedOutsideAcademicYear(courses)) {
    return `Passed-${moment(courses[0].date).format(ISO_DATE_FORMAT)}`
  }

  if (hasFailed(courses)) {
    return `Failed-${moment(courses[0].date).format(ISO_DATE_FORMAT)}`
  }

  if (hasEnrolled(student, courseCode)) {
    const enrollment = getEnrollment(student, courseCode)
    return `Enrollment-${moment(enrollment[0].enrollment_date_time).format(ISO_DATE_FORMAT)}`
  }

  return ''
}

const createEmptyHidden = nthHiddenColumn => {
  return [
    {
      key: `empty-hidden-${nthHiddenColumn}`,
      export: true,
      displayColumn: false,
      textTitle: '   ',
      getRowVal: () => ' ',
    },
  ]
}

const getCriteriaHeaders = (months, programme) => {
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

export const ProgressTable = ({ curriculum, criteria, students, months, programme, studyGuidanceGroupProgramme }) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const { getTextIn } = useLanguage()
  const { data: semestersAndYears } = useGetSemestersQuery()
  const isStudyGuidanceGroupProgramme = studyGuidanceGroupProgramme !== ''
  const creditMonths = [12, 24, 36, 48, 60, 72]
  const defaultCourses = keyBy(curriculum.defaultProgrammeCourses, 'code')
  const coursesSecondProgramme = keyBy(curriculum.secondProgrammeCourses, 'code')

  const getCourseName = courseCode => {
    if (defaultCourses[courseCode]) {
      return defaultCourses[courseCode].name
    }
    if (coursesSecondProgramme[courseCode]) {
      return coursesSecondProgramme[courseCode].name
    }
    return ''
  }

  const labelCriteria = Object.keys(criteria.courses).reduce((acc, year, index) => {
    acc[year] = [
      {
        code: 'Credits',
        name: {
          fi: `${creditMonths[index]} mos.: ${criteria.credits[year]}`,
          en: `${creditMonths[index]} mos.: ${criteria.credits[year]}`,
          sv: `${creditMonths[index]} mos.: ${criteria.credits[year]}`,
        },
      },
      ...[...criteria.courses[year]]
        .sort((a, b) => a.localeCompare(b))
        .map(courseCode => ({
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

  const nonCourse = ['Criteria', 'Credits']

  const getProp = (info, student) => {
    const propObj = {
      title: '',
      style: { textAlign: 'center', verticalAlign: 'middle' },
    }

    const courses = getCourses(info.code, criteria, student)
    if (nonCourse.includes(info.code)) {
      return propObj
    }

    if (hasPassedOutsideAcademicYear(courses)) {
      return { ...propObj, title: `Passed-${moment(courses[0].date).format(ISO_DATE_FORMAT)}` }
    }

    if (hasFailed(courses)) {
      return { ...propObj, title: `Failed-${moment(courses[0].date).format(ISO_DATE_FORMAT)}` }
    }

    if (hasEnrolled(student, info.code)) {
      const enrollment = getEnrollment(student, info.code)
      return {
        ...propObj,
        title: `Enrollment-${moment(enrollment[0].enrollment_date_time).format(ISO_DATE_FORMAT)}`,
      }
    }

    return propObj
  }

  const studentNumberToSemesterEnrollmentsMap = students.reduce((acc, student) => {
    const correctStudyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === programme)
    )
    if (correctStudyRight) {
      acc[student.studentNumber] = correctStudyRight.semesterEnrollments
    }
    return acc
  }, {})

  const helpTexts = {
    0: 'No information',
    1: 'Active',
    2: 'Absent',
    3: 'Inactive',
  }

  const getSemesterEnrollmentVal = (student, semesters) => {
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
    return `${fallText} ${springText}`
  }

  const getEnrollmentSortingValue = (student, semesters) => {
    const fall =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.min(...semesters)
      )?.type ?? 0
    const spring =
      studentNumberToSemesterEnrollmentsMap[student.studentNumber]?.find(
        semester => semester.semester === Math.max(...semesters)
      )?.type ?? 0
    const multiply = num => {
      if (num === 1) return 1000
      if (num === 2) return 1
      return 0
    }
    return multiply(fall) + multiply(spring)
  }

  const getSemesterEnrollmentContent = (student, semesters) => {
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
        <div className={`enrollment-label-no-margin ${enrollmentTypes[fall]?.className}`} title={fallText} />
        <div className={`enrollment-label-no-margin ${enrollmentTypes[spring]?.className}`} title={springText} />
      </div>
    )
  }

  const createContent = (labels, year, start, end, semesters) => {
    return labels.map(label => ({
      key: `${year}-${label.code}-${label.name.fi}`,
      title: (
        <div
          key={`${year}-${label.code}-${getTextIn(label.name)}`}
          style={{ maxWidth: '7em', overflow: 'hidden', whiteSpace: 'normal', width: 'max-content' }}
        >
          <div key={`${label.code}-${year}`}>{label.code}</div>
          <div key={`${getTextIn(label.name)}`} style={{ color: 'gray', fontWeight: 'normal' }}>
            {getTextIn(label.name)}
          </div>
        </div>
      ),
      textTitle: `${label.code}-${getTextIn(label.name)}`,
      headerProps: { title: `${label.code}, ${year}` },
      cellProps: student => getProp(label, student),
      getRowVal: student => {
        if (label.code.includes('Criteria')) {
          return student.criteriaProgress[year] ? student.criteriaProgress[year].totalSatisfied : 0
        }
        if (label.code.includes('Enrollment')) {
          return getEnrollmentSortingValue(student, semesters)
        }
        return getExcelText(label.code, criteria, student, year)
      },
      // the following is hackish, but enrollment col needs to use the getRowVal for sorting
      // and getRowExportVal can't be defined for all the other columns to not override their getRowVal
      getRowExportVal: !label.code.includes('Enrollment')
        ? undefined
        : student => getSemesterEnrollmentVal(student, semesters),
      getRowContent: student => {
        if (label.code.includes('Criteria')) {
          return student.criteriaProgress[year] ? student.criteriaProgress[year].totalSatisfied : 0
        }
        if (label.code.includes('Enrollment')) {
          return getSemesterEnrollmentContent(student, semesters)
        }
        return getRowContent(student, label.code, year, start, end, criteria)
      },
    }))
  }

  const academicYearStart = moment()
    .subtract(months - 1, 'months')
    .startOf('month')
  const academicYearEnd = moment()
    .subtract(months - 12, 'months')
    .endOf('month')

  const columns = useMemo(() => {
    const generateYearColumns = (startYear, endYear, criteriaIndex) => {
      const semesters = Object.values(semestersAndYears?.semesters || {})
        .filter(
          semester =>
            moment(semester.startdate).isSameOrAfter(startYear) &&
            moment(semester.enddate).isSameOrBefore(endYear.add(1, 'day'))
        )
        .map(semester => semester.semestercode)
      return {
        key: criteriaHeaders[criteriaIndex].title,
        title: (
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div>{criteriaHeaders[criteriaIndex].title}</div>
          </div>
        ),
        textTitle: null,
        children: createContent(
          labelCriteria[criteriaHeaders[criteriaIndex].label],
          criteriaHeaders[criteriaIndex].year,
          startYear,
          endYear,
          semesters
        ),
      }
    }

    const generateHiddenColumn = index => ({
      key: `hidden-${index}`,
      textTitle: null,
      mergeHeader: true,
      children: createEmptyHidden(index),
    })

    const columns = [
      {
        key: 'general',
        title: <b>Student</b>,
        textTitle: null,
        children: [
          {
            key: 'studentnumber-parent',
            title: 'Student number',
            cellProps: { title: 'student number', className: 'studentNumber' },
            getRowVal: student => student.studentNumber,
            getRowContent: student => <StudentInfoItem showSisuLink student={student} />,
          },
        ],
      },
      {
        key: 'names',
        title: '',
        mergeHeader: !namesVisible,
        textTitle: null,
        children: [
          {
            key: 'lastname-hidden',
            title: 'Last name',
            export: true,
            forceToolsMode: namesVisible ? '' : 'none',
            getRowVal: student => student.lastname,
            displayColumn: namesVisible,
          },
          {
            key: 'firstname-hidden',
            title: 'First names',
            export: true,
            forceToolsMode: namesVisible ? '' : 'none',
            getRowVal: student => student.firstnames,
            displayColumn: namesVisible,
          },
        ],
      },
      generateYearColumns(academicYearStart, academicYearEnd, 0),
      generateHiddenColumn(1),
    ]

    const addYearColumns = year => {
      if (months > year * 12) {
        columns.push(
          generateYearColumns(
            moment(academicYearStart).add(year, 'years'),
            moment(academicYearEnd).add(year, 'years'),
            year
          ),
          generateHiddenColumn(year + 1)
        )
      }
    }

    addYearColumns(1)
    addYearColumns(2)

    if (isMedicalDegree(programme)) {
      addYearColumns(3)
      addYearColumns(4)
      addYearColumns(5)
    }

    columns.push({
      key: 'hiddenFields',
      title: '',
      mergeHeader: true,
      textTitle: null,
      children: [
        {
          key: 'hidden-phoneNumber',
          export: true,
          displayColumn: false,
          textTitle: 'Phone number',
          getRowVal: student => student.phoneNumber,
        },
        {
          key: 'hidden-email',
          export: true,
          displayColumn: false,
          textTitle: 'Email',
          getRowVal: student => student.email,
        },
        {
          key: 'hidden-secondary-email',
          export: true,
          displayColumn: false,
          textTitle: 'Secondary email',
          getRowVal: student => student.secondaryEmail,
        },
      ],
    })

    return columns
  }, [criteria, students, curriculum, getTextIn, namesVisible])

  const isCriteriaSet =
    criteria && Object.keys(criteria.courses).some(yearCourses => criteria.courses[yearCourses].length > 0)
  const data = useMemo(() => {
    return students
  }, [students])

  return (
    <>
      {!isStudyGuidanceGroupProgramme && (
        <h5>
          Criteria can be changed <Link to={`/study-programme/${programme}?tab=3`}>here.</Link> Please refresh page
          after changes.
        </h5>
      )}
      <Message style={{ fontSize: '16px', maxWidth: '700px' }}>
        <p>
          <Icon color="green" fitted name="check" />: Student has passed the course in the academic year. <br />
          <Icon color="grey" fitted name="check" />: Student has passed the course outside of the corresponding academic
          year. <br />
          <Icon color="green" fitted name="clipboard check" />: Student has credit transfer for the course. <br />
          <Icon color="red" fitted name="times" />: Student has failed the course. <br />
          <Icon color="grey" fitted name="minus" />: Student has enrolled, but has not received any grade from the
          course. <br />
          <span className="enrollment-label-no-margin label-present" />: Student has an active semester enrollment.
          <br />
          <span className="enrollment-label-no-margin label-absent" />: Student has enrolled as absent. <br />
          <span className="enrollment-label-no-margin label-passive" />: Inactive: Student did not enroll at all. <br />
          <span className="enrollment-label-no-margin label-none" />: Student has no enrollment, but also no study right
          for the semester.
        </p>
      </Message>
      <Tab.Pane>
        <div style={{ display: 'flex' }}>
          <div style={{ maxHeight: '80vh', width: '100%' }}>
            {isCriteriaSet ? (
              <SortableTable
                columns={columns}
                data={data}
                featureName="progress"
                style={{ height: '80vh' }}
                tableId="progress-of-population-students"
                title="Progress of population'student students after predefined criteria"
              />
            ) : (
              <div>
                <h3>There is no criteria set for this programme.</h3>
              </div>
            )}
          </div>
        </div>
      </Tab.Pane>
    </>
  )
}
