/* eslint eqeqeq: 1, react/prop-types: 1, quote-props: 0, prefer-const: 0  */
import React, { PureComponent } from 'react'
import { Segment } from 'semantic-ui-react'
import Highcharts from 'highcharts'
import ReactHighchart from 'react-highcharts'

import _ from 'lodash'

class ClusterGraph extends PureComponent {
  state = {
    active: 'all',
    series: {
      '0': { data: [] },
      '1': { data: [] },
      '2': { data: [] },
      '3': { data: [] },
      '4': { data: [] },
      '5': { data: [] }
    },
    name: ' ',
    minY: 0,
    minX: 0,
    maxX: 0,
    maxY: 0
  }

  componentDidMount() {
    const { name, points, students, grades } = this.props.data.course // eslint-disable-line
    const minY = _.min(points.map(p => p[1]))
    const maxY = _.max(points.map(p => p[1]))
    const minX = _.min(points.map(p => p[0]))
    const maxX = _.max(points.map(p => p[0]))

    let { series } = this.state

    for (let i = 0; i < points.length; i++) {
      series[grades[i]].data = series[grades[i]].data.concat({ x: points[i][0], y: points[i][1], name: `0${students[i]}` })
    }

    this.setState({ series, minX, maxX, minY, maxY })
  }

  setActive = (series) => {
    console.log(series)
  }

  setName = (series) => {
    console.log(series.target)
    this.setState({ name: this.state.series[series.target.name].data.name[series.target.index] })
  }

  render() {
    const { series, minX, minY, maxX, maxY } = this.state

    if (series['5'].data.length == 0 && series['4'].data.length == 0 && series['3'].data.length == 0 && series['2'].data.length == 0 && series['1'].data.length == 0 && series['0'].data.length == 0) {
      return (<p>rippistä</p>)
    }

    console.log(this.state)
    return (
      <Segment basic>
        <ReactHighchart
          highcharts={Highcharts}
          constructorType="scatter"
          config={{
            chart: {
              type: 'scatter',
              zoomType: 'xy',
              width: 800,
              height: 800
            },
            title: {
              text: 'Population Cluster'
            },
            yAxis: { min: minY, max: maxY },
            xAxis: { min: minX, max: maxX },
            legend: { enabled: true },
            plotOptions: {
              scatter: {
                marker: {
                  radius: 5,
                  states: {
                    hover: {
                      enabled: true,
                      lineColor: 'rgb(100,100,100)'
                    }
                  }
                },
                states: {
                  hover: {
                    marker: {
                      enabled: false
                    }
                  }
                },
                tooltip: {
                  headerFormat: '<b>{series.name}</b><br>',
                  pointFormat: '{point.x} cm, {point.y} kg'
                }
              }
            },

            series: [
              {
                name: '5',
                data: this.state.series['5'].data
              },
              {
                name: '4',
                data: this.state.series['4'].data
              },
              {
                name: '3',
                data: this.state.series['3'].data
              },
              {
                name: '2',
                data: this.state.series['2'].data
              },
              {
                name: '1',
                data: this.state.series['1'].data
              },
              {
                name: '0',
                data: this.state.series['0'].data
              }
            ]
          }}
        />

      </Segment >
    )
  }
}

export default ClusterGraph
