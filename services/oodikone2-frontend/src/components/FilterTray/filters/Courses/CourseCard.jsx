import React from 'react'
import { Card, Dropdown } from 'semantic-ui-react'

const CourseCard = ({ course }) => {
  const options = [
    { key: '1', text: 'All', value: 1 },
    { key: '2', text: 'Passed', value: 2 },
    { key: '3', text: 'Passed After Failure', value: 3 },
    { key: '4', text: 'Failed', value: 4 },
    { key: '5', text: 'Failed Many Times', value: 5 },
    { key: '6', text: 'Not Participated', value: 6 },
    { key: '7', text: 'Not Participated or Failed', value: 7 }
  ]

  return (
    <Card>
      <Card.Header>{course.name.fi}</Card.Header>
      <Card.Content>
        <Dropdown options={options} value={1} selection fluid className="mini" button />
      </Card.Content>
    </Card>
  )
}

export default CourseCard
