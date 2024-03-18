import { random } from 'lodash'
import React, { useEffect, useState } from 'react'
import ReactHighchart from 'react-highcharts'
import { Button, Container, Dimmer, Header, Image, Transition } from 'semantic-ui-react'

import { images } from '@/common'
import { useLogoutMutation } from '@/redux/auth'
import { MulticolorBarChart } from './MulticolorBarChart'

// add github handles of oodikone devs here
const names = [
  'mluukkai',
  'jakousa',
  'totutotu',
  'sasumaki',
  'ikuisma',
  'eero3',
  'mitiaine',
  'rimi',
  'esakemp',
  'woltsu',
  'cxcorp',
  'ajhaa',
  'joonashak',
  'vaahtokarkki',
  'otahontas',
  'saarasat',
  'popalmu',
  'ollikehy',
]

const dummyData = names.map(name => ({
  name,
  data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((acc, i) => {
    acc[i] = (acc[i - 1] || 0) + (random(0, 3) === 0 ? 0 : random(10.0, 100.0))
    return acc
  }, []),
}))

export const AccessDenied = ({ notEnabled }) => {
  const header = notEnabled ? 'Welcome to Oodikone!' : 'Something broke'
  const subheader = notEnabled
    ? `You're currently not allowed to enter
  but you will get an email when you're authorized`
    : `If this was not intended try refreshing your browser window,
    pressing log out or contacting grp-toska@helsinki.fi`

  const [easterEgg, setEasterEgg] = useState(false)
  const [logout] = useLogoutMutation()

  useEffect(() => {
    if (notEnabled) {
      setTimeout(() => setEasterEgg(true), Math.floor(Math.random() * 1800000) + 600000)
    }
  }, [])

  return (
    <div>
      <Container style={{ display: 'flex', alignItems: 'stretch', height: '100vh', justifyContent: 'space-evenly' }}>
        <ReactHighchart
          config={{
            title: {
              text: 'Students of Computer Science 2018-2020',
            },
            yAxis: {
              title: {
                text: 'Cumulative credits',
              },
            },
            plotOptions: {
              series: {
                label: {
                  connectorAllowed: false,
                },
                pointStart: 2010,
              },
            },
            series: dummyData,
          }}
        />
        <MulticolorBarChart
          chartData={dummyData.map(e => ({ name: e.name, data: [Math.max(...e.data)] }))}
          chartTitle="Your students' future"
        />
      </Container>
      <Dimmer active page>
        <Image centered size="medium" src={images.toskaLogo} style={{ paddingTop: '2%' }} />
        <Header as="h2" inverted>
          <p>{header}</p>
          <Header.Subheader>{subheader}</Header.Subheader>
          <br />
          <Button color="pink" onClick={() => logout()}>
            Log out
          </Button>
        </Header>
      </Dimmer>
      <Transition animation="fly up" duration={10000} visible={easterEgg}>
        <Image
          inline
          size="huge"
          src={images.irtomikko}
          style={{ position: 'absolute', top: '350px', right: '10px' }}
          verticalAlign="top"
        />
      </Transition>
    </div>
  )
}
