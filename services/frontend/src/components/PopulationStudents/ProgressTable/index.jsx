import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Tab, Item, Icon, Message } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import sendEvent from 'common/sendEvent'
import { getTextIn } from 'common'
import { keyBy } from 'lodash'
import moment from 'moment'

const sendAnalytics = sendEvent.populationStudents
const ProgressTable = ({ criteria, students, months, programme }) => {
  const mandatoryCourses = useSelector(state => state?.populationMandatoryCourses?.data)
  const namesVisible = useSelector(state => state?.settings?.namesVisible)

  const findRowContent = (s, courseCode, year, start, end) => {
    if (courseCode.includes('Credits'))
      return s.criteriaProgress[year] && s.criteriaProgress[year].credits ? (
        <Icon fitted name="check" title="Checked" color="green" />
      ) : null
    const courses = s.courses.filter(
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
    if (courses && courses.some(course => course.passed)) return <Icon fitted name="check" color="yellow" />
    if (courses && courses.some(course => course.passed === false)) return <Icon fitted name="times" color="red" />
    if (s.enrollments && s.enrollments.map(course => course.course_code).includes(courseCode))
      return <Icon fitted name="minus" color="grey" />
    return null
  }

  const findCsvText = (s, courseCode, year) => {
    if (courseCode.includes('Credits'))
      return s.criteriaProgress[year] && s.criteriaProgress[year].credits ? 'Passed' : ''
    const courses = s.courses.filter(
      course =>
        course.course_code === courseCode ||
        (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
    )
    if (courses && courses.some(course => course.passed))
      return `Passed-${moment(courses[0].date).format('YYYY-MM-DD')}`
    if (courses && courses.some(course => course.passed === false))
      return `Failed-${moment(courses[0].date).format('YYYY-MM-DD')}`
    if (s.enrollments && s.enrollments.map(course => course.course_code).includes(courseCode)) {
      const enrollment = s.enrollments.filter(enrollment => enrollment.course_code === courseCode)
      return `Enrollment-${moment(enrollment[0].enrollment_date_time).format('YYYY-MM-DD')}`
    }
    return ''
  }
  const columns = useMemo(() => {
    const studentColumns = []
    if (namesVisible) {
      studentColumns.push(
        {
          key: 'lastname_visible',
          title: 'Last name',
          getRowVal: s => s.lastname,
          cellProps: { title: 'last name' },
          export: false,
          child: true,
        },
        {
          key: 'firstname_visible',
          title: 'Given names',
          getRowVal: s => s.firstnames,
          cellProps: { title: 'first names' },
          export: false,
          child: true,
        }
      )
    }

    studentColumns.push({
      key: 'studentnumber-parent',
      title: 'Student Number',
      cellProps: { title: 'student number', className: 'studentNumber' },
      getRowVal: s => s.studentNumber,
      getRowContent: s => (
        <div>
          <span>{s.studentNumber}</span>
          <Item
            as={Link}
            to={`/students/${s.studentNumber}`}
            onClick={() => {
              sendAnalytics('Student details button clicked', 'Student progress table')
            }}
          >
            <Icon style={{ borderLeft: '1em' }} name="user outline" />
          </Item>
        </div>
      ),
      child: true,
    })

    const courses = keyBy(mandatoryCourses, 'code')
    const labelCriteria = Object.keys(criteria.courses).reduce((acc, year, idx) => {
      acc[year] = [
        {
          code: `Credits`,
          name: {
            fi: `Year ${idx + 1}: ${criteria.credits[year]}`,
            en: `Year ${idx + 1}: ${criteria.credits[year]}`,
            sv: `Year ${idx + 1}: ${criteria.credits[year]}`,
          },
        },
        ...[...criteria.courses[year]]
          .sort((a, b) => a.localeCompare(b))
          .map(courseCode => ({
            code: courseCode,
            name: courses[courseCode] ? courses[courseCode].name : '',
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
      if (enrollmentObj?.enrollmenttype === 1) return 'Present'
      if (enrollmentObj?.enrollmenttype === 2) return 'Absent'
      return 'Inactive'
    }
    const nonCourse = ['Enrollment', 'Criteria', 'Credits']
    const style = { verticalAlign: 'middle', textAlign: 'center' }
    const findProp = (courseCode, s) => {
      const propObj = {
        title: '',
        style,
      }
      const courses = s.courses.filter(
        course =>
          course.course_code === courseCode ||
          (criteria?.allCourses[courseCode] && criteria?.allCourses[courseCode].includes(course.course_code))
      )
      if (nonCourse.includes(courseCode)) return propObj
      if (courses && courses.some(course => course.passed))
        return { ...propObj, title: `Passed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
      if (courses && courses.some(course => course.passed === false))
        return { ...propObj, title: `Failed-${moment(courses[0].date).format('YYYY-MM-DD')}` }
      if (s.enrollments && s.enrollments.map(course => course.course_code).includes(courseCode)) {
        const enrollment = s.enrollments.filter(enrollment => enrollment.course_code === courseCode)
        return {
          ...propObj,
          title: `Enrollment-${moment(enrollment[0].enrollment_date_time).format('YYYY-MM-DD')}`,
        }
      }
      return propObj
    }
    const columns = []

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
        cellProps: s => findProp(m.code, s),
        getRowVal: s => {
          if (m.code.includes('Criteria')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          if (m.code.includes('Enrollment') && m.name.fi.includes('Fall'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx])
          if (m.code.includes('Enrollment') && m.name.fi.includes('Spring'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx + 1])
          return findCsvText(s, m.code, year)
        },
        getRowExportVal: s => {
          if (m.code.includes('Criteria')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          if (m.code.includes('Enrollment') && m.name.fi.includes('Fall'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx])
          if (m.code.includes('Enrollment') && m.name.fi.includes('Spring'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx + 1])
          return findCsvText(s, m.code, year)
        },
        getRowContent: s => {
          if (m.code.includes('Criteria')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          if (m.code.includes('Enrollment') && m.name.fi.includes('Fall'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx])
          if (m.code.includes('Enrollment') && m.name.fi.includes('Spring'))
            return getEnrollmentValue(s.semesterenrollments[enrollStatusIdx + 1])
          return findRowContent(s, m.code, year, start, end)
        },
        child: true,
      }))
    }
    const acaYearStart = moment()
      .subtract(months - 1, 'months')
      .startOf('month')
    const acaYearEnd = moment()
      .subtract(months - 12, 'months')
      .endOf('month')
    columns.push(
      {
        key: 'general',
        title: <b>Labels:</b>,
        textTitle: null,
        parent: true,
        children: studentColumns,
      },
      {
        key: criteriaHeaders[0].title,
        title: (
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div>{criteriaHeaders[0].title}</div>
          </div>
        ),
        textTitle: null,
        parent: true,
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
        parent: true,
        children: [
          {
            key: 'second_academic',
            export: true,
            forceToolsMode: 'none',
            textTitle: ' ',
            cellProps: { style: { display: 'none' } },
            getRowVal: () => ' ',
            child: true,
          },
        ],
      }
    )
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
          parent: true,
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
          parent: true,
          children: [
            {
              key: 'third_academic',
              export: true,
              forceToolsMode: 'none',
              textTitle: '  ',
              cellProps: { style: { display: 'none' } },
              getRowVal: () => ' ',
              child: true,
            },
          ],
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
          parent: true,
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
          parent: true,
          children: [
            {
              key: 'empty-hidden-3',
              export: true,
              forceToolsMode: 'none',
              textTitle: '   ',
              cellProps: { style: { display: 'none' } },
              getRowVal: () => ' ',
              child: true,
            },
          ],
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
            parent: true,
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
            parent: true,
            children: [
              {
                key: 'fifth_academic',
                export: true,
                forceToolsMode: 'none',
                textTitle: ' ',
                cellProps: { style: { display: 'none' } },
                getRowVal: () => ' ',
                child: true,
              },
            ],
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
            parent: true,
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
            parent: true,
            children: [
              {
                key: 'sixth_academic',
                export: true,
                forceToolsMode: 'none',
                textTitle: '  ',
                cellProps: { style: { display: 'none' } },
                getRowVal: () => ' ',
                child: true,
              },
            ],
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
            parent: true,
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
            parent: true,
            children: [
              {
                key: 'empty-hidden-6',
                export: true,
                forceToolsMode: 'none',
                textTitle: '   ',
                cellProps: { style: { display: 'none' } },
                getRowVal: () => ' ',
                child: true,
              },
            ],
          }
        )
      }
    }
    const columnsToHide = [
      {
        key: 'hidden-phoneNumber',
        export: true,
        forceToolsMode: 'none',
        textTitle: `Phone number`,
        headerProps: { style: { display: 'none' } },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.phoneNumber,
        child: true,
      },
      {
        key: 'hidden-email',
        export: true,
        forceToolsMode: 'none',
        textTitle: 'Email',
        headerProps: { style: { display: 'none' } },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.email,
        child: true,
      },
      {
        key: 'hidden-secondary-email',
        export: true,
        forceToolsMode: 'none',
        textTitle: 'Secondary Email',
        headerProps: { style: { display: 'none' } },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.secondaryEmail,
        child: true,
      },
      {
        key: 'lastname-hidden',
        textTitle: 'Last Name',
        export: true,
        forceToolsMode: 'none',
        headerProps: { style: { display: 'none' } },
        getRowVal: s => s.lastname,
        cellProps: { style: { display: 'none' } },
        child: true,
      },
      {
        key: 'firstname-hidden',
        textTitle: 'First Names',
        export: true,
        forceToolsMode: 'none',
        headerProps: { style: { display: 'none' } },
        getRowVal: s => s.firstnames,
        cellProps: { style: { display: 'none' } },
        child: true,
      },
    ]

    columns.push({
      key: 'hiddenFiles',
      title: '',
      mergeHeader: true,
      textTitle: null,
      parent: true,
      children: columnsToHide,
    })

    return columns
  }, [criteria, students, mandatoryCourses, getTextIn, namesVisible])

  const isCriteriaSet =
    criteria && Object.keys(criteria.courses).some(yearCourses => criteria.courses[yearCourses].length > 0)
  const data = useMemo(() => {
    return students
  }, [students])
  return (
    <Tab.Pane>
      <div style={{ display: 'flex' }}>
        <div style={{ maxHeight: '80vh', width: '100%' }}>
          <h5>
            Criteria can be changed{' '}
            <Link
              to={`/study-programme/${programme}?p_m_tab=0&p_tab=3`}
              onClick={() => {
                sendAnalytics('No criteria defined button clicked', 'Degree courses tab')
              }}
            >
              here.
            </Link>{' '}
            Please refresh page after changes.
          </h5>
          <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
            <p>
              <Icon fitted name="check" color="green" />: Student has passed the course.{' '}
              <Icon fitted name="clipboard check" color="green" />: Student has credit transfer for the course. <br />
              <Icon fitted name="times" color="red" />: Student has failed the course.{' '}
              <Icon fitted name="minus" color="grey" />: Student has enrolled, but has not received any grade from the
              course.
            </p>
          </Message>
          {isCriteriaSet ? (
            <SortableTable
              style={{ height: '80vh' }}
              tableId="progress-of-population-students"
              title={`Progress of population's students after predefined criteria`}
              getRowKey={s => s.studentNumber}
              tableProps={{
                collapsing: true,
                basic: true,
                compact: 'very',
                padded: false,
                celled: true,
              }}
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
  )
}

export default ProgressTable
