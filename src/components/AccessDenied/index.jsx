import React from 'react'
import { Dimmer, Header, Icon, Container, Button } from 'semantic-ui-react'
import { bool } from 'prop-types'

import MulticolorBarChart from '../MulticolorBarChart'

const dummyData = [
  { text: 'jakousa', value: 48.0 },
  { text: 'totutotu', value: 33.3 },
  { text: 'mitiaine', value: 46.2 },
  { text: 'ttuotila', value: 59.7 }
]

const AccessDenied = ({ itWasError }) => {
  const header = itWasError ? 'Something broke' : 'You do not have access to Oodikone'
  const guide = 'try refreshing your browser window, pressing log out or contacting grp-toska@helsinki.fi'
  const subheader = itWasError ? `If this was not intended ${guide}` : `If you should have access ${guide}`

  return (
    <div >
      <Container style={{ margin: '5%' }}>
        <MulticolorBarChart chartTitle="Past" chartData={dummyData} />
        <MulticolorBarChart chartTitle="Your students future" chartData={dummyData.concat(dummyData)} />
      </Container>
      <Dimmer
        active
        page
      >
        <Header as="h2" icon inverted>
          <Icon name="heart" />
          Sorry
          <Header.Subheader>{header}</Header.Subheader>
          <br />
          <Header.Subheader>{subheader}</Header.Subheader>
          <br />
          <Button color="pink"> Log out </Button>
        </Header>
      </Dimmer>
    </div>
  )
}

AccessDenied.propTypes = {
  itWasError: bool.isRequired
}

export default AccessDenied
