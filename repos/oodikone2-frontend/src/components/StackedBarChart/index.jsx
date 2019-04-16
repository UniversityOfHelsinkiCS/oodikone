import React, { Component } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { shape, arrayOf, object } from 'prop-types'

class StackedBarChart extends Component {
  state = {
    graphOptions: {}
  }

  componentDidMount() {
    const { options, series } = this.props
    this.setState({ graphOptions: { ...options, series } })
  }

  componentDidUpdate(prevProps) {
    if (this.props.series !== prevProps.series) {
      const { options, series } = this.props
      this.setState({ graphOptions: { ...options, series } }) //eslint-disable-line
    }
  }

  render() {
    return (
      <div>
        <ReactHighcharts
          highcharts={Highcharts}
          config={this.state.graphOptions}
        />
      </div>
    )
  }
}
StackedBarChart.propTypes = {
  options: shape({}).isRequired,
  series: arrayOf(object).isRequired
}

export default StackedBarChart
