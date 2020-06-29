import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Dropdown, Button, Icon } from 'semantic-ui-react'
import { getActiveLanguage } from 'react-localize-redux'
import { connect } from 'react-redux'
import { getTextIn } from '../../../../common'
import useCourseFilter from './useCourseFilter'

const CourseCard = ({ courseStats, filterContol, language }) => {
  const { course, students } = courseStats
  const { toggleCourseSelection } = useCourseFilter()
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

  // Apply filter on mount or selection change.
  useEffect(() => {
    filterContol.addFilter(name, subFilters[selectedOption].func)
  }, [selectedOption])

  // Remove filter on unmount.
  useEffect(() => {
    return () => filterContol.removeFilter(name)
  }, [])

  const options = subFilters.map((filter, i) => ({ key: i, text: filter.label, value: i }))

  const onChange = (_, { value }) => setSelectedOption(value)

  return (
    <Card className="course-card">
      <Card.Content>
        <Card.Header>
          <div>{getTextIn(course.name, language)}</div>
          <Button compact color="red" size="tiny" onClick={() => toggleCourseSelection(course.code)} icon>
            <Icon name="close" />
          </Button>
        </Card.Header>
        <Card.Description>
          <div>Show:</div>
          <Dropdown
            options={options}
            value={selectedOption}
            onChange={onChange}
            selection
            fluid
            className="mini"
            button
          />
        </Card.Description>
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
  }).isRequired,
  language: PropTypes.string.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(CourseCard)
