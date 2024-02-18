import React, { useState } from 'react'
import { Container, Header, Image, Divider, List, Grid, Button, Icon } from 'semantic-ui-react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { images, checkUserAccess } from '../../common'
import { useTitle } from '../../common/hooks'
import { Changelog } from './Changelog'

const FrontPageItem = ({ title, content }) => {
  return (
    <>
      <Header as="h3">{title}</Header>
      {content}
    </>
  )
}

export const FrontPage = () => {
  const { rights, roles, iamRights } = useGetAuthorizedUserQuery()
  const [showFullChangelog, setShowFullChangelog] = useState(false)

  useTitle()

  const items = [
    {
      show: true,
      title: 'University',
      content: <p>View tables and diagrams about study progress of different faculties</p>,
    },
    {
      show: roles.includes('admin') || rights.length > 0 || iamRights.length > 0,
      title: 'Programmes',
      content: (
        <List bulleted>
          <List.Item>
            <i>Class statistics:</i> View details of a specific year of a study programme
          </List.Item>
          <List.Item>
            <i>Overview:</i> View statistics of a programme across all years
          </List.Item>
        </List>
      ),
    },
    {
      show: checkUserAccess(['courseStatistics', 'admin'], roles) || rights.length > 0,
      title: 'Courses',
      content: <p>View statistics about course attempts, completions and grades</p>,
    },
    {
      show: checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || rights.length > 0,
      title: 'Students',
      content: <p>View detailed information for a given student</p>,
    },
    {
      show: true,
      title: 'Feedback',
      content: (
        <p>
          For questions and suggestions, please use the{' '}
          <a href="https://oodikone.helsinki.fi/feedback">feedback form</a> or shoot an email to{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>
      ),
    },
  ]

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
                  {items.map(
                    (item, index) =>
                      item.show && (
                        <React.Fragment key={item.title}>
                          <FrontPageItem title={item.title} content={item.content} />
                          {index !== items.length - 1 ? <Divider section /> : null}
                        </React.Fragment>
                      )
                  )}
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
        <Image src={images.toskaLogo} alt="Logo of Toska" size="medium" centered style={{ bottom: 0 }} />
      </a>
    </div>
  )
}
