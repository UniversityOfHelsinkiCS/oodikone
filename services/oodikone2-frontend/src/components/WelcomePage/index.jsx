import React from 'react'
import { Container, Header, Image, Divider, List } from 'semantic-ui-react'
import moment from 'moment'
import { images } from '../../common'
import { useTitle } from '../../common/hooks'

const WelcomePage = () => {
  useTitle()
  return (
    <div>
      <Container text style={{ paddingTop: 50 }}>
        <Header as="h1" textAlign="center">
          Oodikone
        </Header>
        <Header as="h3" style={{ textAlign: 'center' }}>
          Exploratory Research on Study Data
        </Header>

        <Divider section />

        <Header as="h4">Study Programme</Header>
        <List bulleted>
          <List.Item>
            <i>Search by Class:</i> Query a student population specified by a starting year and a study right. Oodikone
            will show you interactive statistics and visualizations for the population to be explored.
          </List.Item>
          <List.Item>
            <i>Overview:</i> View student progress and annual productivity for a given study programme.
          </List.Item>
        </List>

        <Divider section />

        <Header as="h4">Student Statistics</Header>
        <p>View detailed information for a given student.</p>

        <Divider section />

        <Header as="h4">Course Statistics</Header>
        <p>View statistics by course and year.</p>

        <Divider section />

        <Header as="h4">Trends</Header>
        <p>View many kinds visualizations of study progress and study programme status.</p>

        <Divider section />

        <Header as="h4">Feedback</Header>
        <p>
          For questions and suggestions, use either the feedback form or shoot an e-mail to{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>

        <Divider section />

        <p>
          Oodikone was last updated on:{' '}
          {moment(process.env.BUILT_AT)
            .toDate()
            .toLocaleString()}
        </p>
      </Container>
      <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
    </div>
  )
}
export default WelcomePage
