import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Input, Popup } from 'semantic-ui-react'
import { func, shape, string } from 'prop-types'

import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { courseCreditFilter } from '../../populationFilters'

const CourseCreditFilter = ({ coursecode, courseData, filter, setPopulationFilterAction, removePopulationFilterAction }) => {
  const [credits, setCredits] = useState(0)
  const handleFilter = () => {
    setPopulationFilterAction(courseCreditFilter({ credits, coursecode, coursename: courseData.name }))
  }

  const handleChange = (e, { value }) => {
    setCredits(value)
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
              <label>Select students that </label>
            </Form.Field>
            <Form.Field>
              <Input
                type="number"
                onChange={handleChange}
                value={credits}
              />
            </Form.Field>
            <Form.Field>
              <label>credits from course {courseData.name}</label>
            </Form.Field>
            <Form.Field>
              <Button
                onClick={handleFilter}
                disabled={credits === 0}
              >
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
      Students that have {filter.params.credits} credits from course {filter.params.coursename}
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}

CourseCreditFilter.propTypes = {
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired,
  courseData: shape({}).isRequired,
  coursecode: string.isRequired
}

const mapStateToProps = ({ singleCourseStats }) => ({
  courseData: singleCourseStats.stats
})

export default connect(mapStateToProps, {
  setPopulationFilterAction: setPopulationFilter,
  removePopulationFilterAction: removePopulationFilter
})(CourseCreditFilter)
