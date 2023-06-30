import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Tab, Icon, Message } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import { keyBy } from 'lodash'
import moment from 'moment'
import StudentInfoItem from 'components/common/StudentInfoItem'
import useLanguage from '../../../LanguagePicker/useLanguage'
import '../../../StudentStatistics/StudentInfoCard/studentInfoCard.css'

const findRowContent = (student, courseCode, year, start, end, criteria) => {
  if (courseCode.includes('Credits'))
    return student.criteriaProgress[year] && student.criteriaProgress[year].credits ? (
      <Icon fitted name="check" title="Checked" color="green" />
    ) : null
  const courses = student.courses.filter(
    course =>
      course.course_code === courseCode ||
      (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
  )

  if (courses && courses.some(course => course.credittypecode === 9))
    return <Icon name="clipboard check" color="green" />
  if (
    courses &&
    courses.some(course => course.passed) &&
    courses.some(course => moment(course.date).isBetween(moment(start), moment(end)))
  )
    return <Icon fitted name="check" color="green" />
  if (courses && courses.some(course => course.passed)) return <Icon fitted name="check" color="grey" />
  if (courses && courses.some(course => course.passed === false)) return <Icon fitted name="times" color="red" />
  if (student.enrollments && student.enrollments.map(course => course.course_code).includes(courseCode))
    return <Icon fitted name="minus" color="grey" />
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

const ProgressTable = ({ criteria, students, months, programme, studyGuidanceGroupProgramme }) => {
  const mandatoryCourses = useSelector(state => state?.populationMandatoryCourses?.data)
  const namesVisible = useSelector(state => state?.settings?.namesVisible)
  const { getTextIn } = useLanguage()
  const isStudyGuidanceGroupProgramme = studyGuidanceGroupProgramme !== ''
  const credtiMonths = [12, 24, 36, 48, 60, 72]
  const defaultCourses = keyBy(mandatoryCourses.defaultProgrammeCourses, 'code')
  const coursesSecondProgramme = keyBy(mandatoryCourses.secondProgrammeCourses, 'code')
  const getCourseName = courseCode => {
    if (defaultCourses[courseCode]) return defaultCourses[courseCode].name
    if (coursesSecondProgramme[courseCode]) return coursesSecondProgramme[courseCode].name
    return ''
  }
  const labelCriteria = Object.keys(criteria.courses).reduce((acc, year, idx) => {
    acc[year] = [
      {
        code: `Credits`,
        name: {
          fi: `${credtiMonths[idx]} mos.: ${criteria.credits[year]}`,
          en: `${credtiMonths[idx]} mos.: ${criteria.credits[year]}`,
          sv: `${credtiMonths[idx]} mos.: ${criteria.credits[year]}`,
        },
      },
      ...[...criteria.courses[year]]
        .sort((a, b) => a.localeCompare(b))
        .map(courseCode => ({
          code: courseCode,
          name: getCourseName(courseCode),
        })),
      {
        code: `Criteria`,
        name: {
          fi: `Year ${idx + 1}: Fullfilled`,
          en: `Year ${idx + 1}: Fullfilled`,
          sv: `Year ${idx + 1}: Fullfilled`,
        },
      },
      {
        code: `Enrollment`,
        name: { fi: `Year ${idx + 1}: Fall`, en: `Year ${idx + 1}: Fall`, sv: `Year ${idx + 1}: Fall` },
      },
      {
        code: `Enrollment`,
        name: { fi: `Year ${idx + 1}: Spring`, en: `Year ${idx + 1}: Spring`, sv: `Year ${idx + 1}: Spring` },
      },
    ]
    return acc
  }, {})

  const criteriaHeaders = [
    { title: months < 12 ? 'Academic Year 1 (in progress)' : 'Academic Year 1', year: 'year1', label: 'yearOne' },
    { title: months < 24 ? 'Academic Year 2 (in progress)' : 'Academic Year 2', year: 'year2', label: 'yearTwo' },
    { title: months < 36 ? 'Academic Year 3 (in progress)' : 'Academic Year 3', year: 'year3', label: 'yearThree' },
  ]

  const getEnrollmentValue = enrollmentObj => {
    if (enrollmentObj?.enrollmenttype === 1) return 'No info'
    if (enrollmentObj?.enrollmenttype === 1) return 'Present'
    if (enrollmentObj?.enrollmenttype === 2) return 'Absent'
    return 'Inactive'
  }

  const nonCourse = ['Criteria', 'Credits']
  const style = { verticalAlign: 'middle', textAlign: 'center' }

  const helpTexts = {
    0: 'No information',
    1: 'Active',
    2: 'Student has enrolled as absent.',
    3: 'Student has not enrolled to semester and is counted as inactive.',
  }

  const findProp = (info, s, enrollStatusIdx) => {
    const propObj = {
      title: '',
      style,
    }
    const courses = s.courses.filter(
      course =>
        course.course_code === info.code ||
        (criteria?.allCourses[info.code] && criteria?.allCourses[info.code].includes(course.course_code))
    )
    if (nonCourse.includes(info.code)) return propObj
    // Semester Enrollment - naming things is hard
    if (info.code === 'Enrollment') {
      if (info.name.en.includes('Fall') && s.semesterenrollments?.length > enrollStatusIdx) {
        return { ...propObj, title: helpTexts[s.semesterenrollments[enrollStatusIdx]] }
      }
      if (s.semesterenrollments?.length < enrollStatusIdx + 1) {
        return { ...propObj, title: helpTexts[s.semesterenrollments[enrollStatusIdx + 1]] }
      }
      return { ...propObj, title: helpTexts[0] }
    }
    if (courses && courses.some(course => course.passed))
      return { ...propObj, title: `Passed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
    if (courses && courses.some(course => course.passed === false))
      return { ...propObj, title: `Failed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
    if (s.enrollments && s.enrollments.map(course => course.course_code).includes(info.code)) {
      const enrollment = s.enrollments.filter(enrollment => enrollment.course_code === info.code)
      return {
        ...propObj,
        title: `Enrollment-${moment(enrollment[0].enrollment_date_time).format('YYYY-MM-DD')}`,
      }
    }
    return propObj
  }

  const enrolmentTypes = {
    1: { className: 'label-present' },
    2: { className: 'label-absent' },
    3: { className: 'label-passive' },
  }

  const renderSemester = enrollmentObj => {
    if (!enrollmentObj) return ''
    const { className } = enrolmentTypes[enrollmentObj.enrollmenttype]
    return <div className={`enrollment-label-no-margin ${className}`}> </div>
  }

  const createContent = (labels, year, start, end, enrollStatusIdx) => {
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
          ? `${m.code} ${enrollStatusIdx === 0 ? enrollStatusIdx + 1 : enrollStatusIdx}`
          : `${m.code}-${getTextIn(m.name)}`,
      headerProps: { title: `${m.code}, ${year}` },
      cellProps: s => findProp(m, s, enrollStatusIdx),
      getRowVal: s => {
        if (m.code.includes('Criteria')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
        if (m.code.includes('Enrollment') && m.name.en.includes('Fall')) {
          return s.semesterenrollments.length > enrollStatusIdx
            ? getEnrollmentValue(s.semesterenrollments[enrollStatusIdx])
            : 'No info'
        }
        if (m.code.includes('Enrollment') && m.name.en.includes('Spring')) {
          return s.semesterenrollments.length > enrollStatusIdx + 1
            ? getEnrollmentValue(s.semesterenrollments[enrollStatusIdx + 1])
            : 'No info'
        }
        return findCsvText(s, m.code, year, criteria)
      },
      getRowContent: s => {
        if (m.code.includes('Criteria')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
        if (m.code.includes('Enrollment') && m.name.en.includes('Fall'))
          return s.semesterenrollments.length > enrollStatusIdx
            ? renderSemester(s.semesterenrollments[enrollStatusIdx])
            : ''
        if (m.code.includes('Enrollment') && m.name.en.includes('Spring'))
          return s.semesterenrollments.length > enrollStatusIdx + 1
            ? renderSemester(s.semesterenrollments[enrollStatusIdx + 1])
            : ''
        return findRowContent(s, m.code, year, start, end, criteria)
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
            title: 'Student Number',
            cellProps: { title: 'student number', className: 'studentNumber' },
            getRowVal: s => s.studentNumber,
            getRowContent: s => (
              <StudentInfoItem student={s} view="Student progress table" tab="Progress tab" showSisuLink />
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
            title: 'Last Name',
            export: true,
            forceToolsMode: namesVisible ? '' : 'none',
            getRowVal: s => s.lastname,
            displayColumn: namesVisible,
          },
          {
            key: 'firstname-hidden',
            title: 'First Names',
            export: true,
            forceToolsMode: namesVisible ? '' : 'none',
            getRowVal: s => s.firstnames,
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
          textTitle: `Phone number`,
          getRowVal: s => s.phoneNumber,
        },
        {
          key: 'hidden-email',
          export: true,
          displayColumn: false,
          textTitle: 'Email',
          getRowVal: s => s.email,
        },
        {
          key: 'hidden-secondary-email',
          export: true,
          displayColumn: false,
          textTitle: 'Secondary Email',
          getRowVal: s => s.secondaryEmail,
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
          <Icon fitted name="check" color="green" />: Student has passed the course in the academic year. <br />
          <Icon fitted name="check" color="grey" />: Student has passed the course outside of the corresponding academic
          year. <br /> <Icon fitted name="clipboard check" color="green" />: Student has credit transfer for the course.
          <br />
          <Icon fitted name="times" color="red" />: Student has failed the course. <br />
          <Icon fitted name="minus" color="grey" />: Student has enrolled, but has not received any grade from the
          course.
          <br />
          <span className="enrollment-label-no-margin label-present" />: Student has an active semester enrollment.{' '}
          <br />
          <span className="enrollment-label-no-margin label-absent" />: Student has enrolled as absent. <br />
          <span className="enrollment-label-no-margin label-passive" />: Student has no semester enrollment.
        </p>
      </Message>
      <Tab.Pane>
        <div style={{ display: 'flex' }}>
          <div style={{ maxHeight: '80vh', width: '100%' }}>
            {isCriteriaSet ? (
              <SortableTable
                style={{ height: '80vh' }}
                tableId="progress-of-population-students"
                title={`Progress of population's students after predefined criteria`}
                columns={columns}
                data={data}
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

export default ProgressTable
