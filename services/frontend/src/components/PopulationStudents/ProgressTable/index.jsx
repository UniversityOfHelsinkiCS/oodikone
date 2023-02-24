import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Tab, Item, Icon } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import sendEvent from 'common/sendEvent'
import { getTextIn } from 'common'
import { keyBy } from 'lodash'

const sendAnalytics = sendEvent.populationStudents
const ProgressTable = ({ criteria, students, months, programme }) => {
  const mandatoryCourses = useSelector(state => state?.populationMandatoryCourses?.data)
  const hasPassedCriteria = (student, code, year) => {
    if (code.includes('Credits')) return student.criteriaProgress[year] && student.criteriaProgress[year].credits
    return student.criteriaProgress[year] && student.criteriaProgress[year].courses.includes(code)
  }

  const columns = useMemo(() => {
    const studentColumn = []

    studentColumn.push({
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
    const createContent = (labels, year) => {
      return labels.map(m => ({
        key: `${year}-${m.code}`,
        title: (
          <div
            key={`${year}-${m.code}`}
            style={{ maxWidth: '15em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}
          >
            <div>{m.code}</div>
            <div style={{ color: 'gray', fontWeight: 'normal' }}>{getTextIn(m.name)}</div>
          </div>
        ),
        textTitle: `${year}-${m.code}`,
        vertical: m.name !== '',
        headerProps: { title: `${m.code}, ${year}` },
        getRowVal: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return hasPassedCriteria(s, m.code, year) ? 'Passed' : ''
        },
        getRowExportVal: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return hasPassedCriteria(s, m.code, year) ? 'Passed' : ''
        },
        getRowContent: s => {
          if (m.code.includes('Total')) return s.criteriaProgress[year] ? s.criteriaProgress[year].totalSatisfied : 0
          return hasPassedCriteria(s, m.code, year) ? <Icon fitted name="check" color="green" /> : null
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
        children: studentColumn,
      },
      {
        key: criteriaHeaders[0].title,
        title: (
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div>{criteriaHeaders[0].title}</div>
          </div>
        ),
        textTitle: criteriaHeaders[0].title,
        parent: true,
        children: createContent(labelCriteria[criteriaHeaders[0].label], criteriaHeaders[0].year),
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
        textTitle: criteriaHeaders[1].title,
        parent: true,
        children: createContent(labelCriteria[criteriaHeaders[1].label], criteriaHeaders[1].year),
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
        textTitle: criteriaHeaders[2].title,
        parent: true,
        children: createContent(labelCriteria[criteriaHeaders[2].label], criteriaHeaders[2].year),
      })
    }

    return columns
  }, [criteria, students, mandatoryCourses, getTextIn])

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
          {isCriteriaSet ? (
            <SortableTable
              tableId="progress-of-population-students"
              title={`Progress of population's students after predefined criteria`}
              getRowKey={s => s.studentNumber}
              tableProps={{
                celled: true,
                compact: 'very',
                padded: false,
                collapsing: true,
                basic: true,
                striped: true,
                singleLine: true,
                textAlign: 'center',
              }}
              columns={columns}
              data={data}
            />
          ) : (
            <div>
              <h3>
                There is no criteria available for this programme. Create criteria{' '}
                <Link
                  to={`/study-programme/${programme}?p_m_tab=0&p_tab=3`}
                  onClick={() => {
                    sendAnalytics('No criteria defined button clicked', 'Degree courses tab')
                  }}
                >
                  here.
                </Link>{' '}
                Please refresh page after changes.
              </h3>
            </div>
          )}
        </div>
      </div>
    </Tab.Pane>
  )
}

export default ProgressTable
