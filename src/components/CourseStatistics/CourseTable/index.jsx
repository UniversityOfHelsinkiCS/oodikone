import React from 'react'
import { Segment, Table, Radio } from 'semantic-ui-react'
import { func, arrayOf, shape, string, bool } from 'prop-types'

const CourseTable = ({ courses, onSelectCourse, hidden, title, emptyListText }) => (
  !hidden && (
    <Segment basic style={{ padding: '0' }} >
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell content={title} />
            <Table.HeaderCell content="Code" />
            <Table.HeaderCell content="Select" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {
            courses.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan="3" content={emptyListText} />
              </Table.Row>
            ) : courses.map(course => (
              <Table.Row key={course.code}>
                <Table.Cell content={course.name} width={10} />
                <Table.Cell content={course.code} />
                <Table.Cell>
                  <Radio toggle checked={course.selected} onChange={() => onSelectCourse(course)} />
                </Table.Cell>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </Segment>
  )
)

CourseTable.propTypes = {
  courses: arrayOf(shape({ code: string, name: string, seleted: bool })).isRequired,
  onSelectCourse: func.isRequired,
  hidden: bool.isRequired,
  title: string.isRequired,
  emptyListText: string
}

CourseTable.defaultProps = {
  emptyListText: 'No results.'
}

export default CourseTable
