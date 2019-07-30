import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape, string } from 'prop-types'

import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { gradeFilter } from '../../populationFilters'


const GradeFilter = ({ coursecode, courseData, filter, setPopulationFilterAction, removePopulationFilterAction }) => {
  const [grade, setGrade] = useState(0)
  const handleFilter = () => {
    setPopulationFilterAction(gradeFilter({ grade, coursecode, coursename: courseData[coursecode].name }))
  }

  const handleChange = (e, { value }) => {
    setGrade(value)
  }
  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
  }

  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Popup
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
          <Form.Group inline>
            <Form.Field>
              <label>Select students that grade </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select"
                options={[{ key: 1, text: '1', value: 1 },
                { key: 2, text: '2', value: 2 },
                { key: 3, text: '3', value: 3 },
                { key: 4, text: '4', value: 4 },
                { key: 5, text: '5', value: 5 }]}
                onChange={handleChange}
              />
            </Form.Field>
            <Form.Field>
              <label>from course {courseData[coursecode].name}</label>
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter}>
                set filter
              </Button>
            </Form.Field>
          </Form.Group>
        </Form>
      </Segment>
    )
  }
  return (
    <Segment>
      Students that have grade {filter.params.grade} from course {filter.params.coursename}
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}

GradeFilter.propTypes = {
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired,
  courseData: shape({}).isRequired,
  coursecode: string.isRequired
}

const mapStateToProps = ({ courseStats }) => ({
  courseData: courseStats.data
})

export default connect(mapStateToProps, {
  setPopulationFilterAction: setPopulationFilter,
  removePopulationFilterAction: removePopulationFilter
})(GradeFilter)
