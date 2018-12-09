import React from 'react'
import { Segment } from 'semantic-ui-react'
import { shape, string, arrayOf, number } from 'prop-types'
import Highcharts from 'highcharts'
import addHighchartsMore from 'highcharts/highcharts-more'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, Pane, AreaSeries, Title, Tooltip, Legend
} from 'react-jsx-highcharts'

addHighchartsMore(Highcharts)

const SpiderArea = ({ category }) => <AreaSeries name={category.name} data={category.data} />

SpiderArea.propTypes = {
  category: shape({
    name: string,
    data: arrayOf(number)
  }).isRequired
}

const PopulationCategorySpider = ({ data, title }) => {
  const { below, average, above } = data.categories
  return (
    <Segment basic>
      <HighchartsChart polar>
        {title && (<Title>{title}</Title>)}
        <Pane startAngle={0} endAngle={360} />
        <XAxis min={0} tickmarkPlacement="on" categories={data.dimensions} lineWidth={0} />
        <YAxis min={0} max={5} gridLineInterpolation="polygon" lineWidth={0}>
          <SpiderArea category={above} />
          <SpiderArea category={average} />
          <SpiderArea category={below} />
        </YAxis>
        <Tooltip />
        <Legend />
      </HighchartsChart>
    </Segment>
  )
}

PopulationCategorySpider.propTypes = {
  data: shape({}).isRequired,
  title: string
}

PopulationCategorySpider.defaultProps = {
  title: undefined
}

export default withHighcharts(PopulationCategorySpider, Highcharts)
