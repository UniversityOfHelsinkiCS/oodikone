import React, { useEffect, useState } from 'react'
import { Container, Header, Image, Divider, List } from 'semantic-ui-react'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { images, getUserRoles, checkUserAccess } from '../common'
import { useTitle } from '../common/hooks'
import { builtAt } from '../conf'
import oodiTXT from '../static/oodi.txt'

const OodiToOodikone = () => {
  const [oodis, setOodis] = useState([])
  useEffect(() => {
    const getOodis = async () => {
      try {
        const data = await fetch(oodiTXT)
        setOodis(
          (await data.text())
            .split('**')
            .map(o => o.trim())
            .filter(oodi => !!oodi)
        )
      } catch (error) {
        setOodis([])
      }
    }
    getOodis()
  }, [])

  if (!oodis || oodis.length === 0) {
    return null
  }
  const oodi = oodis[Math.floor(Math.random() * oodis.length)].split('\n')
  return (
    <div style={{ margin: 'auto', width: '50%' }}>
      {oodi.map((l, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <p key={index} style={{ textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
          {index === 0 && '\u201C'}
          {l}
          {index === oodi.length - 1 && '\u201D'}
        </p>
      ))}
      <p style={{ marginTop: '1.3em', textAlign: 'center' }}>
        - <a href="http://www.helsinki.fi/discovery">R. U. Nokone</a>
      </p>
    </div>
  )
}

const FrontPage = () => {
  const { roles, rights } = useSelector(state => state.auth.token)
  const userRoles = getUserRoles(roles)
  useTitle()

  const showItems = {
    populations: userRoles.includes('admin') || rights.length > 0,
    studyProgramme: userRoles.includes('admin') || rights.length > 0,
    students: checkUserAccess(['studyGuidanceGroups', 'admin'], userRoles) || rights.length > 0,
    courseStatistics: checkUserAccess(['courseStatistics', 'admin'], userRoles) || rights.length > 0,
    teachers: checkUserAccess(['teachers', 'admin'], userRoles),
    trends: true,
    feedback: true,
  }

  return (
    <div>
      <Container text style={{ paddingTop: 50 }} textAlign="justified">
        <Header as="h1" textAlign="center">
          Oodikone
        </Header>
        <Header as="h3" style={{ textAlign: 'center' }}>
          Exploratory Research on Study Data
        </Header>
        <OodiToOodikone />

        {showItems.populations && (
          <>
            <Divider section />
            <Header as="h4">Study Programme</Header>
            <List bulleted>
              <List.Item>
                <i>Search by Class:</i> Query a student population specified by a starting year and a study right.
                Oodikone will show you interactive statistics and visualizations for the population to be explored.
              </List.Item>
              <List.Item>
                <i>Overview:</i> View student progress and annual productivity for a given study programme.
              </List.Item>
            </List>
          </>
        )}
        {showItems.students && (
          <>
            <Divider section />
            <Header as="h4">Student Statistics</Header>
            <p>View detailed information for a given student.</p>
          </>
        )}
        {showItems.courseStatistics && (
          <>
            <Divider section />
            <Header as="h4">Course Statistics</Header>
            <p>View statistics by course and year.</p>
          </>
        )}
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
        {builtAt ? <p>Oodikone was last updated on: {moment(builtAt).toDate().toLocaleString()}</p> : null}
      </Container>
      <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
    </div>
  )
}

export default FrontPage
