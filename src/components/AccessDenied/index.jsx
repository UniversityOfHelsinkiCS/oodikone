import React from 'react'
import { Dimmer, Header, Image, Container, Button } from 'semantic-ui-react'
import { bool, string } from 'prop-types'
import Highcharts from 'highcharts'
import ReactHighchart from 'react-highcharts'
import { logout } from '../../apiConnection'
import { images } from '../../common'

import MulticolorBarChart from '../MulticolorBarChart'

const dummyData = [
  { text: 'jakousa', value: 48.0 },
  { text: 'totutotu', value: 33.3 },
  { text: 'mitiaine', value: 46.2 },
  { text: 'ttuotila', value: 59.7 }
]

const AccessDenied = ({ itWasError, guide, networkError }) => {
  const header = networkError ? 'Network failure' : itWasError ? 'Something broke' : 'Welcome to Oodikone!' // eslint-disable-line
  const subheader = networkError ? guide : itWasError ? `If this was not intended ${guide}` : 'You\'re currently not allowed to enter but you will get an email when you\'re authorized' // eslint-disable-line

  return (
    <div >
      <Container style={{ margin: '5%' }}>

        <ReactHighchart
          highcharts={Highcharts}
          constructorType="stockChart"
          config={{
            title: {
              text: 'Students of Computer Science 2018-2019'
            },

            yAxis: {
              title: {
                text: 'Cumulative credits'
              }
            },

            plotOptions: {
              series: {
                label: {
                  connectorAllowed: false
                },
                pointStart: 2010
              }
            },

            series: [{
              name: 'mluukkai',
              data: [18937, 29057, 33213, 40949, 55880, 60421, 77543, 87691]
            }, {
              name: 'jakousa',
              data: [15411, 17960, 34037, 58382, 56367, 63103, 79570, 83898]
            }, {
              name: 'totutotu',
              data: [12482, 26592, 32348, 69576, 78155, 80379, 83568, 83165]
            }, {
              name: 'sasumaki',
              data: [17358, 24823, 36578, 47617, 59341, 68391, 72326, 96022]
            }, {
              name: 'ikuisma',
              data: [8536, 21650, 35013, 45562, 65750, 68431, 74402, 83202]
            },
            {
              name: 'eero3',
              data: [18855, 24929, 38722, 45049, 51706, 68569, 66225, 72269]
            },
            {
              name: 'mitiaine',
              data: [500, 1000, 20000, 56000, 59000, 65425, 69800, 80000]
            }]
          }}
        />

        <MulticolorBarChart chartTitle="Your students future" chartData={dummyData.concat(dummyData)} />
      </Container>
      <Dimmer
        active
        page
      >
        <Image src={images.toskaLogo} size="medium" centered style={{ paddingTop: '2%' }} />
        <Header as="h2" inverted>
          <p>{header}</p>
          <Header.Subheader>{subheader}</Header.Subheader>
          <br />
          <Button onClick={logout} color="pink"> Log out </Button>
        </Header>
      </Dimmer>
    </div>
  )
}

AccessDenied.propTypes = {
  itWasError: bool.isRequired,
  networkError: bool.isRequired,
  guide: string.isRequired
}

export default AccessDenied
