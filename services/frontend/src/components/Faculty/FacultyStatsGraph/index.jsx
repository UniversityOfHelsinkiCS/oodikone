import React, { useState, useMemo } from 'react'
import { arrayOf, string, number, shape } from 'prop-types'
import { Segment, Button } from 'semantic-ui-react'
import Highcharts from 'highcharts/highstock'
import ReactHighstock from 'react-highcharts/ReactHighstock'

const FacultyStatsGraph = ({ data }) => {
  const [mode, setMode] = useState('studentCredits')
  const defaultStartTimestamp = new Date(2000, 0, 1).getTime()

  const series = useMemo(
    () =>
      data.map(({ name, data: entryData }) => ({
        name,
        data: Object.entries(entryData).map(([year, stats]) => ({
          x: new Date(parseInt(year, 10), 0, 1, 0, 0, 0, 0).getTime(),
          y: Math.round(
            ['coursesPassed', 'coursesFailed'].includes(mode)
              ? (stats[mode] / (stats.coursesPassed + stats.coursesFailed)) * 100
              : stats[mode].length || stats[mode]
          )
        }))
      })),
    [data, mode]
  )

  const { min, max } = useMemo(
    () =>
      series.reduce(
        (res, { data }) => {
          data.forEach(({ x }) => {
            res.min = Math.min(res.min, x)
            res.max = Math.max(res.max, x)
          })
          return res
        },
        { min: Infinity, max: -Infinity }
      ),
    [series]
  )

  const options = {
    findNearestPointBy: 'xy',
    series,
    xAxis: {
      min: Math.max(min, defaultStartTimestamp),
      max,
      ordinal: false
    }
  }

  const handleClick = (_, { name }) => setMode(name)

  return (
    <Segment>
      <ReactHighstock highcharts={Highcharts} constructorType="stockChart" config={options} />
      <Button active={mode === 'studentCredits'} onClick={handleClick} name="studentCredits">
        Total credits
      </Button>
      <Button active={mode === 'coursesPassed'} onClick={handleClick} name="coursesPassed">
        % of courses passed
      </Button>
      <Button active={mode === 'coursesFailed'} onClick={handleClick} name="coursesFailed">
        % of courses failed
      </Button>
      <Button active={mode === 'students'} onClick={handleClick} name="students">
        Amount of students
      </Button>
    </Segment>
  )
}

FacultyStatsGraph.propTypes = {
  data: arrayOf(
    shape({
      name: string,
      data: shape({
        year: shape({
          studentCredits: number,
          coursesPassed: number,
          coursesFailed: number
        })
      })
    })
  ).isRequired
}

export default FacultyStatsGraph
