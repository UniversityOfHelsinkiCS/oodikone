import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Dropdown } from 'semantic-ui-react'

const CourseCard = ({ courseStats, filterContol }) => {
  const { course, students } = courseStats
  const [selectedOption, setSelectedOption] = useState(0)
  const name = `courseFilter-${course.code}`

  const subFilters = [
    {
      label: 'All',
      func: ({ studentNumber }) => Object.keys(students.all).includes(studentNumber)
    },
    {
      label: 'Passed',
      func: ({ studentNumber }) => Object.keys(students.passed).includes(studentNumber)
    },
    {
      label: 'Passed After Failure',
      func: ({ studentNumber }) => Object.keys(students.retryPassed).includes(studentNumber)
    },
    {
      label: 'Failed',
      func: ({ studentNumber }) => Object.keys(students.failed).includes(studentNumber)
    },
    {
      label: 'Failed Many Times',
      func: ({ studentNumber }) => Object.keys(students.failedMany).includes(studentNumber)
    },
    {
      label: 'Not Participated',
      func: ({ studentNumber }) => !Object.keys(students.all).includes(studentNumber)
    },
    {
      label: 'Not Participated or Failed',
      func: ({ studentNumber }) =>
        !Object.keys(students.all).includes(studentNumber) || Object.keys(students.failed).includes(studentNumber)
    }
  ]

  // Apply filter when mounting.
  useEffect(() => {
    filterContol.addFilter(name, subFilters[selectedOption].func)
  }, [selectedOption])

  const options = subFilters.map((filter, i) => ({ key: i, text: filter.label, value: i }))

  const onChange = (_, { value }) => setSelectedOption(value)

  return (
    <Card>
      <Card.Header>{course.name.fi}</Card.Header>
      <Card.Content>
        <Dropdown
          options={options}
          value={selectedOption}
          onChange={onChange}
          selection
          fluid
          className="mini"
          button
        />
      </Card.Content>
    </Card>
  )
}

CourseCard.propTypes = {
  courseStats: PropTypes.shape({
    course: PropTypes.object,
    students: PropTypes.object
  }).isRequired,
  filterContol: PropTypes.shape({
    addFilter: PropTypes.func,
    removeFilter: PropTypes.func
  }).isRequired
}

export default CourseCard
