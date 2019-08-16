import React, { useState, useMemo } from 'react'
import { arrayOf, string, number, shape } from 'prop-types'
import { Segment, Button } from 'semantic-ui-react'
import Highcharts from 'highcharts/highstock'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'

boost(Highcharts)

const FacultyStatsGraph = ({ data }) => {
  const [mode, setMode] = useState('studentCredits')

  const series = useMemo(() => data.map(({ name, data: entryData }) => ({
    name,
    data: Object.entries(entryData).map(([year, stats]) => ({
      x: new Date(parseInt(year, 10), 0, 1, 0, 0, 0, 0).getTime(),
      y: Math.round(mode === 'studentCredits' ? stats[mode] : ((stats[mode] / (stats.coursesPassed + stats.coursesFailed)) * 100))
    }))
  })), [data, mode])

  const { min, max } = useMemo(() => series.reduce((res, { data }) => {
    data.forEach(({ x }) => {
      res.min = Math.min(res.min, x)
      res.max = Math.max(res.max, x)
    })
    return res
  }, { min: Infinity, max: -Infinity }), [series])

  const options = {
    findNearestPointBy: 'xy',
    series,
    xAxis: {
      min,
      max,
      ordinal: false
    }
  }

  const handleClick = (_, { name }) => setMode(name)

  return (
    <Segment>
      <ReactHighstock
        highcharts={Highcharts}
        constructorType="stockChart"
        config={options}
      />
      <Button active={mode === 'studentCredits'} onClick={handleClick} name="studentCredits">Total credits</Button>
      <Button active={mode === 'coursesPassed'} onClick={handleClick} name="coursesPassed">% of courses passed</Button>
      <Button active={mode === 'coursesFailed'} onClick={handleClick} name="coursesFailed">% of courses failed</Button>
    </Segment>
  )
}

FacultyStatsGraph.propTypes = {
  data: arrayOf(shape({
    name: string,
    data: shape({
      year: shape({
        studentCredits: number,
        coursesPassed: number,
        coursesFailed: number
      })
    })
  })).isRequired
}

export default FacultyStatsGraph
