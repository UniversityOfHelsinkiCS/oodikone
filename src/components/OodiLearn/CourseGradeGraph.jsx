import React, { Component } from 'react'
import { string, shape, arrayOf, number, func } from 'prop-types'
import {
  HighchartsChart, withHighcharts, XAxis, YAxis, SplineSeries, Legend, Tooltip
} from 'react-jsx-highcharts'
import Highcharts from 'highcharts'

const FONTSIZE = 20

class CourseGradeGraph extends Component {
  state={
    focused: undefined
  }

  handleLegendClick = (event) => {
    const { name } = event.target
    event.preventDefault()
    this.setState({
      focused: (this.state.focused !== name) ? name : undefined
    })
  }

  render() {
    const { height, categories, series, onClickCategory } = this.props
    return (
      <div style={{ minHeight: height }}>
        <HighchartsChart>
          <XAxis
            categories={categories}
            title={{
                text: 'Grades',
                style: { fontSize: FONTSIZE }
              }}
            labels={{
                style: {
                  fontSize: 15
                }
              }}
          />
          <YAxis
            min={0}
            max={5}
            title={{
                text: 'Profile dimensions',
                style: { fontSize: FONTSIZE }
              }}
          >
            {series.map(({ name, data }) => {
                const formatted = data.map((val, i) => ({
                  y: val,
                  selected: (this.props.selected === categories[i]),
                  events: {
                    mouseOver: () => onClickCategory(categories[i])
                  }
                }))
                return (
                  <SplineSeries
                    key={name}
                    name={name}
                    data={formatted}
                    visible={!this.state.focused || (name === this.state.focused)}
                    events={{
                      legendItemClick: this.handleLegendClick
                    }}
                  />
                  )
                })}
          </YAxis>
          <Legend />
          <Tooltip />
        </HighchartsChart>
      </div>
    )
  }
}

CourseGradeGraph.propTypes = {
  categories: arrayOf(string).isRequired,
  series: arrayOf(shape({})).isRequired,
  selected: string.isRequired,
  height: number,
  onClickCategory: func.isRequired
}

CourseGradeGraph.defaultProps = {
  height: 400
}

export default withHighcharts(CourseGradeGraph, Highcharts)
