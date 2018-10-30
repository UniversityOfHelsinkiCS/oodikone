import React from 'react'
import { Segment } from 'semantic-ui-react'
import { shape, number } from 'prop-types'
import Highcharts from 'highcharts'
import addHighchartsMore from 'highcharts/highcharts-more'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, Pane, AreaSeries, Title
} from 'react-jsx-highcharts'

addHighchartsMore(Highcharts)

const CATEGORIES = [
  'Deep',
  'Burnout',
  'Surface',
  'Organized',
  'Self-efficacy'
]

const ProfileSpiderGraph = ({ profile: p }) => {
  const data = [p.Deep, p.SBI, p.Surface, p.Organised, p.SE]
  return (
    <Segment basic>
      <HighchartsChart polar>
        <Title>Learner Profile</Title>
        <Pane startAngle={0} endAngle={360} />
        <XAxis min={0} tickmarkPlacement="on" categories={CATEGORIES} lineWidth={0} />
        <YAxis min={0} max={5} gridLineInterpolation="polygon" lineWidth={0}>
          <AreaSeries name="Original" data={data} />
        </YAxis>
      </HighchartsChart>
    </Segment>
  )
}

ProfileSpiderGraph.propTypes = {
  profile: shape({
    Deep: number,
    SE: number,
    Surface: number,
    Organised: number,
    SBI: number
  }).isRequired
}

export default withHighcharts(ProfileSpiderGraph, Highcharts)
