import React from 'react'
import { Segment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, string } from 'prop-types'
import Highcharts from 'highcharts'
import {
  HighchartsChart, withHighcharts, Chart, XAxis, YAxis, ColumnRangeSeries, Tooltip, Legend
} from 'react-jsx-highcharts'
import selector from '../../selectors/oodilearnPopulations'

const options = {
  columnrange: {
    stacking: 'normal'
  }
}

const PopulationStackedBar = ({ categories, series }) => (
  <Segment basic>
    <HighchartsChart plotOptions={options} stlye={{ height: '100%' }}>
      <Chart type="columnrange" inverted />
      <XAxis categories={categories} />
      <YAxis min={0} max={5}>
        <ColumnRangeSeries name="Below" data={series.below} />
        <ColumnRangeSeries name="Average" data={series.average} />
        <ColumnRangeSeries name="Above" data={series.above} />
      </YAxis>
      <Tooltip />
      <Legend />
    </HighchartsChart>
  </Segment>
)

PopulationStackedBar.propTypes = {
  categories: arrayOf(string).isRequired,
  series: shape({}).isRequired
}

const mapStateToProps = (state) => {
  const { categories, series } = selector.getPopulationStackedSeries(state)
  return { categories, series }
}

export default connect(mapStateToProps)(withHighcharts(PopulationStackedBar, Highcharts))
