import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Tab, Item, Icon, Message } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import sendEvent from 'common/sendEvent'
import { getTextIn } from 'common'
import { keyBy } from 'lodash'

const sendAnalytics = sendEvent.populationStudents
const ProgressTable = ({ criteria, students, months, programme }) => {
  const mandatoryCourses = useSelector(state => state?.populationMandatoryCourses?.data)
  const namesVisible = useSelector(state => state?.settings?.namesVisible)
  const findRowContent = (s, courseCode, year, label) => {
    if (courseCode.includes('Credits'))
      return s.criteriaProgress[year] && s.criteriaProgress[year].credits ? (
        <Icon fitted name="check" title="Checked" color="green" />
      ) : null
    const courses = s.courses.filter(
      course => course.course_code === courseCode || criteria.allCourses[label][courseCode].includes(course.course_code)
    )
    if (courses && courses.some(course => course.credittypecode === 9))
      return <Icon name="clipboard check" title="Credit transfer" color="green" />
    if (courses && courses.some(course => course.passed))
      return <Icon fitted name="check" title="Passed" color="green" />
    if (courses && courses.some(course => course.passed === false))
      return <Icon fitted name="times" title="Failed" color="red" />
    // if (failedManyTimes) return <Icon fitted name="times" color="red" />
    if (s.enrollments && s.enrollments.map(course => course.course_code).includes(courseCode))
      return <Icon fitted name="minus" title="Unfinished" color="grey" />
    return null
  }
  const findCsvText = (s, courseCode, year, label) => {
    if (courseCode.includes('Credits'))
      return s.criteriaProgress[year] && s.criteriaProgress[year].credits ? 'Passed' : ''
    const courses = s.courses.filter(
      course =>
        course.course_code === courseCode || criteria?.allCourses[label][courseCode].includes(course.course_code)
    )
    if (courses && courses.some(course => course.credittypecode === 9)) return 'Credit transfer'
    if (courses && courses.some(course => course.passed)) return 'Passed'
    if (courses && courses.some(course => course.passed === false)) return 'Failed'
    // if (failedManyTimes) return <Icon fitted name="times" color="red" />
    if (s.enrollments && s.enrollments.map(course => course.course_code).includes(courseCode)) return 'Unfinished'
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
      getRowVal: s => (s.total ? '*' : s.studentNumber),
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
    const labelCriteria = Object.keys(criteria.courses).reduce((acc, year) => {
      acc[year] = [
        { code: `Credits: ${criteria.credits[year]}`, name: '' },
        ...[...criteria.courses[year]]
          .sort((a, b) => a.localeCompare(b))
          .map(courseCode => ({
            code: courseCode,
            name: courses[courseCode] ? courses[courseCode].name : '',
          })),
        { code: `Total`, name: '' },
      ]
      return acc
    }, {})

    const criteriaHeaders = [
      { title: months < 12 ? 'Academic Year 1 (in progress)' : 'Academic Year 1', year: 'year1', label: 'yearOne' },
      { title: months < 24 ? 'Academic Year 2 (in progress)' : 'Academic Year 2', year: 'year2', label: 'yearTwo' },
      { title: months < 36 ? 'Academic Year 3 (in progress)' : 'Academic Year 3', year: 'year3', label: 'yearThree' },
    ]

    const columns = []
    const createContent = (labels, year, label) => {
      return labels.map(m => ({
        key: `${year}-${m.code}`,
        title: (
          <div
            key={`${year}-${m.code}-${getTextIn(m.name)}`}
            style={{ maxWidth: '8em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}
          >
            <div>{m.code}</div>
            <div style={{ color: 'gray', fontWeight: 'normal' }}>{getTextIn(m.name)}</div>
          </div>
        ),
        textTitle: m.name === '' ? m.code : `${m.code}-${getTextIn(m.name)}`,
        headerProps: { title: `${m.code}, ${year}` },
        cellProps: {
          style: { verticalAlign: 'middle', textAlign: 'center' },
        },
        getRowVal: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return findCsvText(s, m.code, year, label)
        },
        getRowExportVal: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return findCsvText(s, m.code, year, label)
        },
        getRowContent: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return findRowContent(s, m.code, year, label)
        },
        child: true,
      }))
    }

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
          criteriaHeaders[0].label
        ),
      }
    )
    if (months > 12) {
      columns.push({
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
          criteriaHeaders[1].label
        ),
      })
    }
    if (months > 24) {
      columns.push({
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
          criteriaHeaders[2].label
        ),
      })
    }
    const columnsToHide = [
      {
        key: 'hidden-phoneNumber',
        export: true,
        forceToolsMode: 'none',
        textTitle: `Phone number`,
        headerProps: {
          title: `Phone number`,
          style: { display: 'none' },
        },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.phoneNumber,
        child: true,
      },
      {
        key: 'hidden-email',
        export: true,
        forceToolsMode: 'none',
        textTitle: 'Email',
        headerProps: {
          title: `Email`,
          style: { display: 'none' },
        },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.email,
        child: true,
      },
      {
        key: 'hidden-secondary-email',
        export: true,
        forceToolsMode: 'none',
        textTitle: 'Secondary Email',
        headerProps: {
          title: `Secondary Email`,
          style: { display: 'none' },
        },
        cellProps: { style: { display: 'none' } },
        getRowVal: s => s.secondaryEmail,
        child: true,
      },
      {
        key: 'lastname-hidden',
        title: '',
        export: true,
        forceToolsMode: 'none',
        headerProps: {
          title: `Last name`,
          style: { display: 'none' },
        },
        getRowVal: s => s.lastname,
        cellProps: { style: { display: 'none' } },
        child: true,
      },
      {
        key: 'firstname-hidden',
        title: '',
        export: true,
        forceToolsMode: 'none',
        headerProps: {
          title: `First name`,
          style: { display: 'none' },
        },
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
