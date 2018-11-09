import React from 'react'
import { Segment } from 'semantic-ui-react'
import Highcharts from 'highcharts'
import addHighchartsMore from 'highcharts/highcharts-more'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, Pane, AreaSeries, Title, Chart, Legend, ScatterSeries
} from 'react-jsx-highcharts'
import _ from 'lodash'

addHighchartsMore(Highcharts)

const ClusterGraph = ({ data }) => {
  if (data.length < 1) {
    return (<p>rippistä</p>)
  }
  console.log(data)
  const { name, points, students, grades } = data.course
  let series = []
  for (let i = 0; i < points.length; i++) {
    series[i].points = series[i].points.concat(points[i])
  } 
  console.log(series)
  
  return (
    <Segment basic>
      <HighchartsChart>
        <Chart height={800} width={800} />

        <Title>{name}</Title>

        <Legend>
          <Legend.Title>Legend</Legend.Title>
        </Legend>

        <XAxis >
          <XAxis.Title>X Coord</XAxis.Title>
          <ScatterSeries data={points} />
        </XAxis>

        <YAxis>
          <YAxis.Title>Y Coord</YAxis.Title>
        </YAxis>
      </HighchartsChart>
    </Segment >
  )
}

export default withHighcharts(ClusterGraph, Highcharts)
