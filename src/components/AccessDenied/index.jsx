import React from 'react'
import { Dimmer, Header, Icon, Container } from 'semantic-ui-react'

import MulticolorBarChart from '../MulticolorBarChart'

const dummyData = [
  { text: 'jakousa', value: 48.0 },
  { text: 'totutotu', value: 33.3 },
  { text: 'mitiaine', value: 46.2 },
  { text: 'ttuotila', value: 59.7 }
]

const AccessDenied = () => (
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
        <Header.Subheader>You do not have access to Oodikone</Header.Subheader>
        <br />
        <Header.Subheader>
          If you should have access try refreshing your browser window
          or contact grp-toska@helsinki.fi
        </Header.Subheader>
      </Header>
    </Dimmer>
  </div>
)

export default AccessDenied
