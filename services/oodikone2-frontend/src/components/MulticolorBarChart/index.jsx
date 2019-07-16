import React from 'react'
import { string, arrayOf } from 'prop-types'
import Highcharts from 'highcharts'
import ReactHighchart from 'react-highcharts'
import { graphDataType } from '../../constants/types'
import './multicolorBarChart.css'

const MulticolorBarChart = (props) => {
  const { chartTitle, chartData } = props
  if (chartData.length > 0) {
    return (
      <ReactHighchart
        highcharts={Highcharts}
        constructorType="barChart"
        neverReflow
        config={{
          title: {
            text: chartTitle
          },
          xAxis: {
            categories: [
              '2018'
            ]
          },
          yAxis: {
            title: {
              text: 'Cumulative credits'
            }
          },
          chart: {
            type: 'column'
          },
          series: chartData
        }}
      />
    )
  }
  return null
}

MulticolorBarChart.propTypes = {
  chartTitle: string.isRequired,
  chartData: arrayOf(graphDataType).isRequired
}

export default MulticolorBarChart
