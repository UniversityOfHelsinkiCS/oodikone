import React from 'react'
import { Segment } from 'semantic-ui-react'
import Highcharts from 'highcharts'
import addHighchartsMore from 'highcharts/highcharts-more'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, Pane, AreaSeries, Title
} from 'react-jsx-highcharts'

addHighchartsMore(Highcharts)
const data = {}

const ClusterGraph = ({ data }) => {
  return (
    <Segment basic>
      <HighchartsChart polar>

      </HighchartsChart>
    </Segment>
  )
}

export default withHighcharts(ClusterGraph, Highcharts)
