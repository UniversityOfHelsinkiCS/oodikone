import React from 'react'
import { Segment } from 'semantic-ui-react'
import { shape, string } from 'prop-types'
import Highcharts from 'highcharts'
import addHighchartsMore from 'highcharts/highcharts-more'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, Title, Tooltip, Legend, SplineSeries, AreaSplineRangeSeries
} from 'react-jsx-highcharts'

addHighchartsMore(Highcharts)

const PopulationCategorySpider = ({ data, title }) => (
  <Segment basic>
    <HighchartsChart>
      {title && (<Title>{title}</Title>)}
      <XAxis min={0} tickmarkPlacement="on" categories={data.dimensions} lineWidth={0} />
      <YAxis min={0} max={5} lineWidth={0}>
        <AreaSplineRangeSeries data={data.ranges} name="Below and Above" />
        <SplineSeries data={data.averages} name="Average" />
      </YAxis>
      <Tooltip />
      <Legend />
    </HighchartsChart>
  </Segment>
)

PopulationCategorySpider.propTypes = {
  data: shape({}).isRequired,
  title: string
}

PopulationCategorySpider.defaultProps = {
  title: undefined
}

export default withHighcharts(PopulationCategorySpider, Highcharts)
