import { Link } from 'react-router-dom'
import { Container, Grid, Segment } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const FacultySegment = ({ faculty }) => {
  const { getTextIn } = useLanguage()

  return (
    <Container text>
      <Segment>
        <Grid columns={2} divided>
          <Grid.Column textAlign="center" verticalAlign="middle" width={2}>
            {faculty.code}
          </Grid.Column>
          <Grid.Column width={9}>
            <Link to={`/faculties/${faculty.id}`}>{getTextIn(faculty.name)}</Link>
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  )
}
