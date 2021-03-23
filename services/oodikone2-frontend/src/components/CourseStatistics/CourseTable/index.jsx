import React from 'react'
import { sortBy } from 'lodash'
import { Segment, Table } from 'semantic-ui-react'
import { func, arrayOf, shape, string, bool } from 'prop-types'
import { getActiveYears } from '../courseStatisticsUtils'
import useLanguage from '../../LanguagePicker/useLanguage'
import './courseTable.css'
import { getTextIn } from '../../../common'

const CourseTable = ({ courses, onSelectCourse, hidden, title, emptyListText, mandatory = false, controlIcon }) => {
  const { language } = useLanguage()
  const noContent = courses.length === 0
  const sortCourses = courses => sortBy(courses, course => getTextIn(course.name, language))

  const getEmptyListRow = () => (
    <Table.Row>
      <Table.Cell colSpan="3" content={emptyListText} />
    </Table.Row>
  )

  const toCourseRow = course => (
    <Table.Row
      style={{ cursor: 'pointer' }}
      key={course.code}
      onClick={() => (course.min_attainment_date || mandatory ? onSelectCourse(course) : null)}
    >
      <Table.Cell width={10}>
        <div>{getTextIn(course.name, language)}</div>
        <div>{getActiveYears(course)}</div>
      </Table.Cell>
      <Table.Cell content={!course.alternatives ? course.code : course.alternatives.map(a => a.code).join(', ')} />
      {controlIcon ? <Table.Cell icon={controlIcon} /> : null}
    </Table.Row>
  )

  return (
    !hidden && (
      <Segment basic style={{ padding: '0' }}>
        <Table selectable className="fixed-header">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{title}</Table.HeaderCell>
              <Table.HeaderCell>Code</Table.HeaderCell>
              {controlIcon ? <Table.HeaderCell /> : null}
            </Table.Row>
          </Table.Header>
          <Table.Body>{noContent ? getEmptyListRow() : sortCourses(courses).map(toCourseRow)}</Table.Body>
        </Table>
      </Segment>
    )
  )
}

CourseTable.propTypes = {
  courses: arrayOf(shape({ code: string, name: shape({}), seleted: bool })).isRequired,
  onSelectCourse: func.isRequired,
  hidden: bool.isRequired,
  title: string.isRequired,
  emptyListText: string,
  controlIcon: string
}

CourseTable.defaultProps = {
  emptyListText: 'No results.',
  controlIcon: null
}

function areEqual(prevProps, nextProps) {
  if (prevProps.courses.length !== nextProps.courses.length) {
    return false
  }
  return prevProps.courses.every(c1 => nextProps.courses.some(c2 => c1.code === c2.code))
}

export default React.memo(CourseTable, areEqual)
