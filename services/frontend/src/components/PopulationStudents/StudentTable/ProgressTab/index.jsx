import { keyBy } from 'lodash'
import moment from 'moment'
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Message, Tab } from 'semantic-ui-react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import '@/components/StudentStatistics/StudentInfoCard/studentInfoCard.css'
import { SortableTable } from '@/components/SortableTable'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'

const findRowContent = (student, courseCode, year, start, end, criteria) => {
  if (courseCode.includes('Credits'))
    return student.criteriaProgress[year] && student.criteriaProgress[year].credits ? (
      <Icon color="green" fitted name="check" title="Checked" />
    ) : null
  const courses = student.courses.filter(
    course =>
      course.course_code === courseCode ||
      (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
  )

  if (courses && courses.some(course => course.credittypecode === 9))
    return <Icon color="green" name="clipboard check" />
  if (
    courses &&
    courses.some(course => course.passed) &&
    courses.some(course => moment(course.date).isBetween(moment(start), moment(end)))
  )
    return <Icon color="green" fitted name="check" />
  if (courses && courses.some(course => course.passed)) return <Icon color="grey" fitted name="check" />
  if (courses && courses.some(course => course.passed === false)) return <Icon color="red" fitted name="times" />
  if (student.enrollments && student.enrollments.map(course => course.course_code).includes(courseCode))
    return <Icon color="grey" fitted name="minus" />
  return null
}

const findCsvText = (student, courseCode, year, criteria) => {
  if (courseCode.includes('Credits'))
    return student.criteriaProgress[year] && student.criteriaProgress[year].credits ? 'Passed' : ''
  const courses = student.courses.filter(
    course =>
      course.course_code === courseCode ||
      (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
  )
  if (courses && courses.some(course => course.passed)) return `Passed-${moment(courses[0].date).format('YYYY-MM-DD')}`
  if (courses && courses.some(course => course.passed === false))
    return `Failed-${moment(courses[0].date).format('YYYY-MM-DD')}`
  if (student.enrollments && student.enrollments.map(course => course.course_code).includes(courseCode)) {
    const enrollment = student.enrollments.filter(enrollment => enrollment.course_code === courseCode)
    return `Enrollment-${moment(enrollment[0].enrollment_date_time).format('YYYY-MM-DD')}`
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

export const ProgressTable = ({ curriculum, criteria, students, months, programme, studyGuidanceGroupProgramme }) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const { getTextIn } = useLanguage()
  const isStudyGuidanceGroupProgramme = studyGuidanceGroupProgramme !== ''
  const creditMonths = [12, 24, 36, 48, 60, 72]
  const mandatoryCourses = curriculum
  const defaultCourses = keyBy(mandatoryCourses.defaultProgrammeCourses, 'code')
  const coursesSecondProgramme = keyBy(mandatoryCourses.secondProgrammeCourses, 'code')

  const getCourseName = courseCode => {
    if (defaultCourses[courseCode]) return defaultCourses[courseCode].name
    if (coursesSecondProgramme[courseCode]) return coursesSecondProgramme[courseCode].name
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

  const criteriaHeaders = [
    { title: months < 12 ? 'Academic Year 1 (in progress)' : 'Academic Year 1', year: 'year1', label: 'yearOne' },
    { title: months < 24 ? 'Academic Year 2 (in progress)' : 'Academic Year 2', year: 'year2', label: 'yearTwo' },
    { title: months < 36 ? 'Academic Year 3 (in progress)' : 'Academic Year 3', year: 'year3', label: 'yearThree' },
  ]

  const nonCourse = ['Criteria', 'Credits']
  const style = { verticalAlign: 'middle', textAlign: 'center' }

  const findProp = (info, student) => {
    const propObj = {
      title: '',
      style,
    }
    const courses = student.courses.filter(
      course =>
        course.course_code === info.code ||
        (criteria?.allCourses[info.code] && criteria?.allCourses[info.code].includes(course.course_code))
    )
    if (nonCourse.includes(info.code)) return propObj
    if (courses && courses.some(course => course.passed))
      return { ...propObj, title: `Passed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
    if (courses && courses.some(course => course.passed === false))
      return { ...propObj, title: `Failed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
    if (student.enrollments && student.enrollments.map(course => course.course_code).includes(info.code)) {
      const enrollment = student.enrollments.filter(enrollment => enrollment.course_code === info.code)
      return {
        ...propObj,
        title: `Enrollment-${moment(enrollment[0].enrollment_date_time).format('YYYY-MM-DD')}`,
      }
    }
    return propObj
  }
  const helpTexts = {
    0: 'No information',
    1: 'Active',
    2: 'Absent',
    3: 'Inactive',
  }
  const getSemesterEnrollmentVal = (student, enrollmentIndex) => {
    const fall = student.semesterenrollments[enrollmentIndex]?.enrollmenttype ?? 0
    const spring = student.semesterenrollments[enrollmentIndex + 1]?.enrollmenttype ?? 0
    const fallText = `Fall: ${helpTexts[fall]}`
    const springText = `Spring: ${helpTexts[spring]}`
    return `${fallText} ${springText}`
  }
  const getEnrollmentSortingValue = (student, enrollmentIndex) => {
    const fall = student.semesterenrollments[enrollmentIndex]?.enrollmenttype ?? 0
    const spring = student.semesterenrollments[enrollmentIndex + 1]?.enrollmenttype ?? 0
    const multiply = num => {
      if (num === 1) return 1000
      if (num === 2) return 1
      return 0
    }
    return multiply(fall) + multiply(spring)
  }
  const getSemesterEnrollmentContent = (student, enrollmentIndex) => {
    const enrollmentTypes = {
      0: { className: 'label-none' },
      1: { className: 'label-present' },
      2: { className: 'label-absent' },
      3: { className: 'label-passive' },
    }
    const renderSemester = (enrollment, leftMargin) => {
      const { className } = enrollmentTypes[enrollment]
      return <div className={`enrollment-label${!leftMargin ? '-no-margin' : ''} ${className}`} />
    }
    const fall = student.semesterenrollments[enrollmentIndex]?.enrollmenttype ?? 0
    const spring = student.semesterenrollments[enrollmentIndex + 1]?.enrollmenttype ?? 0
    const fallText = `Fall: ${helpTexts[fall]}`
    const springText = `Spring: ${helpTexts[spring]}`
    return (
      <div title={`${fallText}\n${springText}`}>
        {renderSemester(fall, false)}
        {renderSemester(spring, true)}
      </div>
    )
  }

  const createContent = (labels, year, start, end, enrollStatusIndex) => {
    return labels.map(m => ({
      key: `${year}-${m.code}-${m.name.fi}`,
      title: (
        <div
          key={`${year}-${m.code}-${getTextIn(m.name)}`}
          style={{ maxWidth: '7em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}
        >
          <div key={`${m.code}-${year}`}>{m.code}</div>
          <div key={`${getTextIn(m.name)}`} style={{ color: 'gray', fontWeight: 'normal' }}>
            {getTextIn(m.name)}
          </div>
        </div>
      ),
      textTitle:
        m.name === ''
          ? `${m.code} ${enrollStatusIndex === 0 ? enrollStatusIndex + 1 : enrollStatusIndex}`
          : `${m.code}-${getTextIn(m.name)}`,
      headerProps: { title: `${m.code}, ${year}` },
      cellProps: student => findProp(m, student),
      getRowVal: student => {
        if (m.code.includes('Criteria'))
          return student.criteriaProgress[year] ? student.criteriaProgress[year].totalSatisfied : 0
        if (m.code.includes('Enrollment')) return getEnrollmentSortingValue(student, enrollStatusIndex)
        return findCsvText(student, m.code, year, criteria)
      },
      // the following is hackish, but enrollment col needs to use the getRowVal for sorting
      // and getRowExportVal can't be defined for all the other columns to not override their getRowVal
      getRowExportVal: !m.code.includes('Enrollment')
        ? undefined
        : student => getSemesterEnrollmentVal(student, enrollStatusIndex),
      getRowContent: student => {
        if (m.code.includes('Criteria'))
          return student.criteriaProgress[year] ? student.criteriaProgress[year].totalSatisfied : 0
        if (m.code.includes('Enrollment')) return getSemesterEnrollmentContent(student, enrollStatusIndex)
        return findRowContent(student, m.code, year, start, end, criteria)
      },
    }))
  }
  const acaYearStart = moment()
    .subtract(months - 1, 'months')
    .startOf('month')
  const acaYearEnd = moment()
    .subtract(months - 12, 'months')
    .endOf('month')

  const columns = useMemo(() => {
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
            getRowContent: student => (
              <StudentInfoItem showSisuLink student={student} tab="Progress tab" view="Student progress table" />
            ),
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
      {
        key: criteriaHeaders[0].title,
        title: (
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div>{criteriaHeaders[0].title}</div>
          </div>
        ),
        textTitle: null,
        children: createContent(
          labelCriteria[criteriaHeaders[0].label],
          criteriaHeaders[0].year,
          acaYearStart,
          acaYearEnd,
          0
        ),
      },
      {
        key: 'hidden-1',
        textTitle: null,
        mergeHeader: true,
        children: createEmptyHidden(1),
      },
    ]
    if (months > 12) {
      const startAca2 = moment(acaYearStart).add(1, 'years')
      const endAca2 = moment(acaYearEnd).add(1, 'years')
      columns.push(
        {
          key: criteriaHeaders[1].title,
          title: (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <div>{criteriaHeaders[1].title}</div>
            </div>
          ),
          textTitle: null,
          children: createContent(
            labelCriteria[criteriaHeaders[1].label],
            criteriaHeaders[1].year,
            startAca2,
            endAca2,
            1
          ),
        },
        {
          key: 'hidden-2',
          textTitle: null,
          mergeHeader: true,
          children: createEmptyHidden(2),
        }
      )
    }
    if (months > 24) {
      const startAca3 = moment(acaYearStart).add(24, 'months')
      const endAca3 = moment(acaYearEnd).add(24, 'months')
      columns.push(
        {
          key: criteriaHeaders[2].title,
          title: (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <div>{criteriaHeaders[2].title}</div>
            </div>
          ),
          textTitle: null,
          children: createContent(
            labelCriteria[criteriaHeaders[2].label],
            criteriaHeaders[2].year,
            startAca3,
            endAca3,
            2
          ),
        },
        {
          key: 'hidden-3',
          textTitle: null,
          mergeHeader: true,
          children: createEmptyHidden(3),
        }
      )
    }
    // Lääkkis and HammasLääkkis do not have separate bachelor programme.
    // Eläinlääkkis do have separate bachelor and master programmes, but we like to see it as one.
    if (['MH30_001', 'MH30_003', 'KH90_001'].includes(programme)) {
      criteriaHeaders.push(
        { title: months < 48 ? 'Academic Year 4 (in progress)' : 'Academic Year 4', year: 'year4', label: 'yearFour' },
        { title: months < 60 ? 'Academic Year 5 (in progress)' : 'Academic Year 5', year: 'year5', label: 'yearFive' },
        { title: months < 72 ? 'Academic Year 6 (in progress)' : 'Academic Year 6', year: 'year6', label: 'yearSix' }
      )
      if (months > 36) {
        const startAca4 = moment(acaYearStart).add(3, 'years')
        const endAca4 = moment(acaYearEnd).add(3, 'years')
        columns.push(
          {
            key: criteriaHeaders[3].title,
            title: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div>{criteriaHeaders[3].title}</div>
              </div>
            ),
            textTitle: null,
            children: createContent(
              labelCriteria[criteriaHeaders[3].label],
              criteriaHeaders[3].year,
              startAca4,
              endAca4,
              3
            ),
          },
          {
            key: 'hidden-4',
            textTitle: null,
            mergeHeader: true,
            children: createEmptyHidden(4),
          }
        )
      }

      if (months > 48) {
        const startAca5 = moment(acaYearStart).add(4, 'years')
        const endAca5 = moment(acaYearEnd).add(4, 'years')
        columns.push(
          {
            key: criteriaHeaders[4].title,
            title: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div>{criteriaHeaders[4].title}</div>
              </div>
            ),
            textTitle: null,
            children: createContent(
              labelCriteria[criteriaHeaders[4].label],
              criteriaHeaders[4].year,
              startAca5,
              endAca5,
              4
            ),
          },
          {
            key: 'hidden-5',
            textTitle: null,
            mergeHeader: true,
            children: createEmptyHidden(5),
          }
        )
      }
      if (months > 60) {
        const startAca6 = moment(acaYearStart).add(5, 'years')
        const endAca6 = moment(acaYearEnd).add(5, 'years')
        columns.push(
          {
            key: criteriaHeaders[5].title,
            title: (
              <div key={criteriaHeaders[5].title} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div>{criteriaHeaders[5].title}</div>
              </div>
            ),
            textTitle: null,
            children: createContent(
              labelCriteria[criteriaHeaders[5].label],
              criteriaHeaders[5].year,
              startAca6,
              endAca6,
              5
            ),
          },
          {
            key: 'hidden-6',
            textTitle: null,
            mergeHeader: true,
            children: createEmptyHidden(6),
          }
        )
      }
    }

    columns.push({
      key: 'hiddenFiles',
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
  }, [criteria, students, mandatoryCourses, getTextIn, namesVisible])

  const isCriteriaSet =
    criteria && Object.keys(criteria.courses).some(yearCourses => criteria.courses[yearCourses].length > 0)
  const data = useMemo(() => {
    return students
  }, [students])
  return (
    <>
      {!isStudyGuidanceGroupProgramme && (
        <h5>
          Criteria can be changed <Link to={`/study-programme/${programme}?p_m_tab=0&p_tab=3`}>here.</Link> Please
          refresh page after changes.
        </h5>
      )}
      <Message style={{ fontSize: '16px', maxWidth: '700px' }}>
        <p>
          <Icon color="green" fitted name="check" />: Student has passed the course in the academic year. <br />
          <Icon color="grey" fitted name="check" />: Student has passed the course outside of the corresponding academic
          year. <br /> <Icon color="green" fitted name="clipboard check" />: Student has credit transfer for the course.
          <br />
          <Icon color="red" fitted name="times" />: Student has failed the course. <br />
          <Icon color="grey" fitted name="minus" />: Student has enrolled, but has not received any grade from the
          course.
          <br />
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
