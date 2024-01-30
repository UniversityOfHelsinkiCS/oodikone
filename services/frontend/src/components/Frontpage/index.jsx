import React, { useState } from 'react'
import { Container, Header, Image, Divider, List, Grid, Button, Icon } from 'semantic-ui-react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { images, checkUserAccess } from '../../common'
import { useTitle } from '../../common/hooks'
import { Changelog } from './Changelog'

export const FrontPage = () => {
  const { rights, roles } = useGetAuthorizedUserQuery()
  const [showFullChangelog, setShowFullChangelog] = useState(false)

  useTitle()

  const showItems = {
    populations: roles.includes('admin') || rights.length > 0,
    studyProgramme: roles.includes('admin') || rights.length > 0,
    students: checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || rights.length > 0,
    courseStatistics: checkUserAccess(['courseStatistics', 'admin'], roles) || rights.length > 0,
    teachers: checkUserAccess(['teachers', 'admin'], roles),
    university: true,
    feedback: true,
  }

  return (
    <div>
      <Container style={{ paddingTop: 50, marginBottom: '20px' }} textAlign="justified">
        {showFullChangelog ? (
          <>
            <Header as="h1" style={{ textAlign: 'center' }}>
              Latest updates
            </Header>
            <Button fluid style={{ margin: '30px 0' }} onClick={() => setShowFullChangelog(false)}>
              <Icon name="arrow left" />
              Back to front page
            </Button>
            <Changelog showFullChangelog />
            <Button fluid style={{ margin: '30px 0' }} onClick={() => setShowFullChangelog(false)}>
              <Icon name="arrow left" />
              Back to front page
            </Button>
          </>
        ) : (
          <>
            <Header as="h1" textAlign="center">
              Oodikone
            </Header>
            <Header as="h3" style={{ textAlign: 'center' }}>
              Exploratory Research on Study Data
            </Header>
            <Grid columns="two" style={{ marginTop: '40px' }} divided>
              <Grid.Row>
                <Grid.Column>
                  <Header as="h3">University</Header>
                  <p>View tables and diagrams about study progress of different faculties.</p>
                  <Divider section />
                  {showItems.populations && (
                    <>
                      <Header as="h3">Study programme</Header>
                      <List bulleted>
                        <List.Item>
                          <i>Search by Class:</i> Query a student population specified by a starting year and a study
                          right. Oodikone will show you interactive statistics and visualizations for the population to
                          be explored.
                        </List.Item>
                        <List.Item>
                          <i>Overview:</i> View student progress and annual productivity for a given study programme.
                        </List.Item>
                      </List>
                    </>
                  )}
                  {showItems.courseStatistics && (
                    <>
                      <Divider section />
                      <Header as="h3">Course statistics</Header>
                      <p>View statistics by course and year.</p>
                    </>
                  )}
                  {showItems.students && (
                    <>
                      <Divider section />
                      <Header as="h3">Student statistics</Header>
                      <p>View detailed information for a given student.</p>
                    </>
                  )}
                  <Divider section />
                  <Header as="h3">Feedback</Header>
                  <p>
                    For questions and suggestions, please use the{' '}
                    <a href="https://oodikone.helsinki.fi/feedback">feedback form</a> or shoot an email to{' '}
                    <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
                  </p>
                </Grid.Column>
                <Grid.Column style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Changelog showFullChangelog={false} />
                  <Button style={{ marginTop: '40px' }} onClick={() => setShowFullChangelog(true)}>
                    Show more
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </>
        )}
      </Container>
      <a href="https://toska.dev/">
        <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
      </a>
    </div>
  )
}
