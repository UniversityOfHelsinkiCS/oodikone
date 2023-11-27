import React, { Component } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { shape, arrayOf, object } from 'prop-types'

export class StackedBarChart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      graphOptions: {},
    }
  }

  componentDidMount() {
    const { options, series } = this.props
    this.setState({ graphOptions: { ...options, series } })
  }

  componentDidUpdate(prevProps) {
    const { series: currentSeries, options: currentOptions } = this.props
    if (currentSeries !== prevProps.series) {
      this.setState({ graphOptions: { ...currentOptions, series: currentSeries } })
    }
  }

  render() {
    const { graphOptions } = this.state
    return (
      <div>
        <ReactHighcharts highcharts={Highcharts} config={graphOptions} />
      </div>
    )
  }
}
StackedBarChart.propTypes = {
  options: shape({}).isRequired,
  series: arrayOf(object).isRequired,
}
