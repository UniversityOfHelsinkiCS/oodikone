import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown, Card, Button } from 'semantic-ui-react'
import { createStore, useStore } from 'react-hookstore'
import FilterCard from './common/FilterCard'

export const dataStoreName = 'courseFilterDataStore'
createStore(dataStoreName, [])

const Courses = ({ filterControl }) => {
  const [courseStats] = useStore(dataStoreName)
  const [selectedCourses, setSelectedCourses] = useState([])

  const onChange = (_, { value }) =>
    setSelectedCourses(prev => prev.concat(courseStats.find(course => course.course.code === value[0])))

  // Wrestle course stats into something semantic-ui eats without throwing up.
  const options = courseStats
    .filter(course => course.stats.students > Math.round(filterControl.filteredStudents.length * 0.3))
    .filter(course => !selectedCourses.includes(course))
    .map(course => ({
      key: `course-filter-option-${course.course.code}`,
      text: course.course.name.fi,
      value: course.course.code
    }))

  return (
    <FilterCard title="Courses">
      <Form>
        <Card.Group>
          {selectedCourses.map(course => (
            <div key={`course-filter-selected-course-${course.course.code}`}>
              <Card>
                <Card.Header>{course.course.name.fi}</Card.Header>
                <Card.Content>
                  <Button.Group size="mini">
                    <Button>All</Button>
                    <Button>Passed</Button>
                    <Button>Passed After Failure</Button>
                  </Button.Group>
                  <Button.Group size="mini">
                    <Button>Failed</Button>
                    <Button>Failed Many Times</Button>
                    <Button>Not Participated</Button>
                    <Button>Not Participated or Failed</Button>
                  </Button.Group>
                </Card.Content>
              </Card>
              <Card>
                <Card.Header>{course.course.name.fi}</Card.Header>
                <Card.Content>
                  <Dropdown
                    options={[
                      { key: '1', text: 'All', value: 1 },
                      { key: '2', text: 'Passed', value: 2 },
                      { key: '3', text: 'Passed After Failure', value: 3 },
                      { key: '4', text: 'Failed', value: 4 },
                      { key: '5', text: 'Failed Many Times', value: 5 },
                      { key: '6', text: 'Not Participated', value: 6 },
                      { key: '7', text: 'Not Participated or Failed', value: 7 }
                    ]}
                    value={1}
                    selection
                    fluid
                    className="mini"
                    button
                  />
                </Card.Content>
              </Card>
            </div>
          ))}
        </Card.Group>
        <Dropdown
          options={options}
          placeholder="Select A Course"
          selection
          className="mini"
          fluid
          button
          value={[]}
          onChange={onChange}
          multiple
          style={{ marginTop: '3rem' }}
          closeOnChange
        />
      </Form>
    </FilterCard>
  )
}

Courses.propTypes = {
  filterControl: PropTypes.shape({
    filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired
}

export default Courses
