import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Grid, Icon, List, Message, Segment } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const getFacultyIcon = facultyCode => {
  const facultyIcons = {
    H10: 'book',
    H20: 'law',
    H30: 'heartbeat',
    H40: 'users',
    H50: 'dna',
    H55: 'syringe',
    H57: 'leaf',
    H60: 'child',
    H70: 'university',
    H74: 'briefcase',
    H80: 'tree',
    H90: 'stethoscope',
  }
  return facultyIcons[facultyCode] || 'student'
}

const Faculty = ({ faculty }) => {
  const { getTextIn } = useLanguage()

  return (
    <Container text>
      <Segment>
        <Grid columns={2} divided>
          <Grid.Column textAlign="center" verticalAlign="middle" width={2}>
            <Icon name={getFacultyIcon(faculty.code)} size="big" />
          </Grid.Column>
          <Grid.Column width={9}>
            <List>
              <List.Item>
                <Link to={`/faculties/${faculty.code}`}>{getTextIn(faculty.name)}</Link>
              </List.Item>
              <List.Item>{faculty.code}</List.Item>
            </List>
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  )
}

export const FacultySelector = ({ faculties, selected }) => {
  if (selected) return null

  if (faculties == null) {
    return <Message>You do not have access to any faculties</Message>
  }

  return (
    <div data-cy="select-faculty">
      {faculties.map(faculty => (
        <Faculty faculty={faculty} key={faculty.code} />
      ))}
    </div>
  )
}
