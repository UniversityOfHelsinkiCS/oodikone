import React, { useState, useEffect, useCallback } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import moment from 'moment'
import { Table, Checkbox, Form, Dropdown } from 'semantic-ui-react'
import _ from 'lodash'
import { statsDate, statsNow, stats2MonthsAgo, stats4MonthsAgo } from './data_timed'

const stats = [stats4MonthsAgo, stats2MonthsAgo, statsNow]
const targetDates = ['2017-07-31 21:00:00+00', '2018-07-31 21:00:00+00', '2019-07-31 21:00:00+00']

const defaultConfig = () => ({
  chart: {
    backgroundColor: null,
    borderWidth: 0,
    type: 'area',
    margin: [2, 0, 2, 0],
    width: 120,
    height: 20,
    style: {
      overflow: 'visible'
    },
    // small optimalization, saves 1-2 ms each sparkline
    skipClone: true
  },
  title: {
    text: ''
  },
  credits: {
    enabled: false
  },
  xAxis: {
    labels: {
      enabled: false
    },
    title: {
      text: null
    },
    startOnTick: false,
    endOnTick: false,
    tickPositions: []
  },
  yAxis: {
    endOnTick: false,
    startOnTick: false,
    labels: {
      enabled: false
    },
    title: {
      text: null
    },
    tickPositions: [0]
  },
  legend: {
    enabled: false
  },
  tooltip: {
    hideDelay: 0,
    outside: true,
    shared: true
  },
  plotOptions: {
    series: {
      animation: false,
      lineWidth: 1,
      shadow: false,
      states: {
        hover: {
          lineWidth: 1
        }
      },
      marker: {
        radius: 1,
        states: {
          hover: {
            radius: 2
          }
        }
      },
      fillOpacity: 0.25
    },
    column: {
      negativeColor: '#910000',
      borderColor: 'silver'
    }
  }
})

const makeSegmentConfig = ({ facultyRows, relative, color, header }) => {
  const config = {
    xAxis: {
      categories: [
        moment(statsDate)
          .subtract(4, 'months')
          .toDate(),
        moment(statsDate)
          .subtract(2, 'months')
          .toDate(),
        statsDate
      ]
    },
    series: [
      {
        color,
        data: facultyRows.map(row => row[3])
      }
    ],
    tooltip: {
      headerFormat: `<span style="font-size:10px">${header}:</span><br/>`,
      pointFormatter() {
        const y = relative ? `${(this.y * 100).toFixed(1)}%` : `${this.y}`
        return `<span style="color:${this.color}">●</span> ${moment(this.category).format('YYYY/MM')}: <b>${y}</b><br/>`
      }
    }
  }
  return Highcharts.merge(defaultConfig(), config)
}

const getFaculties = _.memoize(() =>
  _(statsNow.ok)
    .map(arr => arr[1])
    .uniq()
    .sort((a, b) => a.localeCompare(b))
    .value()
)

const SegmentChart = React.memo(({ facultyRows, relative, color, header }) => {
  return (
    <ReactHighcharts
      highcharts={Highcharts}
      config={makeSegmentConfig({
        facultyRows,
        relative,
        color,
        header
      })}
    />
  )
}, _.isEqual)

const yearOptions = targetDates.map((date, i) => ({
  key: i,
  value: i,
  text: `${new Date(date).getFullYear()}`
}))

const displayDataSorters = {
  facultyName: (a, b) => a.facultyName.localeCompare(b),
  estimated3y: (a, b) => a.estimated3y.total - b.estimated3y.total,
  estimated4y: (a, b) => a.estimated4y.total - b.estimated4y.total,
  estimatedTrash: (a, b) => a.estimatedTrash.total - b.estimatedTrash.total
}

const ProtoE = () => {
  const facultyNames = getFaculties()
  const [targetDate, setTargetDate] = useState(0)

  const statsTarget = _(stats)
    .map(({ ebin, not_ok, ok }) => ({
      ebin: ebin.filter(row => row[2] === targetDates[targetDate]),
      not_ok: not_ok.filter(row => row[2] === targetDates[targetDate]),
      ok: ok.filter(row => row[2] === targetDates[targetDate])
    }))
    .value()

  console.log(statsTarget)

  const count3yAmount = useCallback(
    facultyName => {
      return statsTarget[statsTarget.length - 1].ebin.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
    },
    [statsTarget]
  )

  const countInclusive4yAmount = useCallback(
    facultyName =>
      statsTarget[statsTarget.length - 1].ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0),
    [statsTarget]
  )

  const countExclusive4yAmount = useCallback(
    facultyName => {
      // not including 3y rate students
      const ebinAmount = count3yAmount(facultyName)
      return countInclusive4yAmount(facultyName) - ebinAmount
    },
    [count3yAmount, countInclusive4yAmount]
  )

  const countTrashAmount = useCallback(
    facultyName => {
      return statsTarget[statsTarget.length - 1].not_ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
    },
    [statsTarget]
  )

  const countTotal = useCallback(facultyName => countTrashAmount(facultyName) + countInclusive4yAmount(facultyName), [
    countTrashAmount,
    countInclusive4yAmount
  ])

  const [showRelative, setShowRelative] = useState(false)
  const [sortKey, setSortKey] = useState('estimated3y')
  const [sortDirection, setSortDirection] = useState(-1)

  function mapDisplayData(facultyName) {
    const valuesForFaculty = (key, facultyName) => {
      return _(statsTarget)
        .map(stat => stat[key].filter(row => row[1] === facultyName))
        .map(year => year[0])
        .value()
    }

    const totalStudents = countTotal(facultyName)
    const estimated3yTotal = count3yAmount(facultyName)
    const estimated4yTotal = countExclusive4yAmount(facultyName)
    const estimatedTrashTotal = countTrashAmount(facultyName)

    const relativeMapper = showRelative
      ? row => {
          const dupe = [...row]
          dupe[3] /= totalStudents
          return dupe
        }
      : row => row

    const rows3y = valuesForFaculty('ebin', facultyName).map(relativeMapper)
    const rows4y = valuesForFaculty('ok', facultyName).map(relativeMapper)
    const rowsTrash = valuesForFaculty('not_ok', facultyName).map(relativeMapper)

    return {
      facultyName,
      estimated3y: {
        total: showRelative ? estimated3yTotal / totalStudents : estimated3yTotal,
        rows: rows3y
      },
      estimated4y: {
        total: showRelative ? estimated4yTotal / totalStudents : estimated4yTotal,
        rows: rows4y
      },
      estimatedTrash: {
        total: showRelative ? estimatedTrashTotal / totalStudents : estimatedTrashTotal,
        rows: rowsTrash
      }
    }
  }

  const displayData = facultyNames.map(mapDisplayData).sort((a, b) => sortDirection * displayDataSorters[sortKey](a, b))

  const headerSortedProps = useCallback(
    key => {
      const getSortedProp = sortDirection => {
        if (sortDirection === -1) return 'descending'
        return 'ascending'
      }

      return {
        sorted: sortKey === key ? getSortedProp(sortDirection) : undefined,
        onClick: () => {
          if (sortKey === key) {
            setSortDirection(-1 * sortDirection)
            return
          }

          setSortKey(key)
          setSortDirection(1)
        }
      }
    },
    [sortKey, setSortKey, sortDirection]
  )

  const handleYearChange = useCallback((e, { value }) => {
    setTargetDate(value)
  }, [])

  const maxMinDisplayDiff = _(displayData)
    .flatMap(({ estimated3y }) => {
      return [
        estimated3y.rows.map(row => row[3])[1] - estimated3y.rows.map(row => row[3])[0],
        estimated3y.rows.map(row => row[3])[2] - estimated3y.rows.map(row => row[3])[1]
      ]
    })
    .reduce(
      ([min, max], val) => {
        if (val > max) max = val
        if (val < min) min = val
        return [min, max]
      },
      [99999999999, -9999999999]
    )

  return (
    <div>
      <Form>
        <Form.Field
          onChange={() => setShowRelative(!showRelative)}
          checked={showRelative}
          control={Checkbox}
          label={{ children: 'Relative' }}
        />
        <Form.Field
          value={targetDate}
          selection
          options={yearOptions}
          onChange={handleYearChange}
          control={Dropdown}
          label={{ children: 'Start year' }}
        />
      </Form>
      <Table compact striped sortable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell {...headerSortedProps('facultyName')}>Tiedekunta</Table.HeaderCell>
            <Table.HeaderCell {...headerSortedProps('estimated3y')} colSpan="2">
              3v tahdissa
            </Table.HeaderCell>
            <Table.HeaderCell {...headerSortedProps('estimated4y')} colSpan="2">
              4v tahdissa
            </Table.HeaderCell>
            <Table.HeaderCell {...headerSortedProps('estimatedTrash')} colSpan="2">
              Ei tahdissa
            </Table.HeaderCell>
            <Table.HeaderCell>3v tahdin muutos</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {displayData.map(({ facultyName, estimated3y, estimated4y, estimatedTrash }) => {
            return (
              <Table.Row key={facultyName}>
                <Table.Cell>{facultyName}</Table.Cell>
                <Table.Cell>{showRelative ? `${(estimated3y.total * 100).toFixed(1)}%` : estimated3y.total}</Table.Cell>
                <Table.Cell>
                  <SegmentChart
                    facultyRows={estimated3y.rows}
                    relative={showRelative}
                    color="#6ab04c"
                    header="3v tahdissa"
                  />
                </Table.Cell>
                <Table.Cell>{showRelative ? `${(estimated4y.total * 100).toFixed(1)}%` : estimated4y.total}</Table.Cell>
                <Table.Cell>
                  <SegmentChart
                    facultyRows={estimated4y.rows}
                    relative={showRelative}
                    color="#f9ca24"
                    header="4v tahdissa"
                  />
                </Table.Cell>
                <Table.Cell>
                  {showRelative ? `${(estimatedTrash.total * 100).toFixed(1)}%` : estimatedTrash.total}
                </Table.Cell>
                <Table.Cell>
                  <SegmentChart
                    facultyRows={estimatedTrash.rows}
                    relative={showRelative}
                    color="#ff7979"
                    header="Ei tahdissa"
                  />
                </Table.Cell>
                <Table.Cell>
                  <ReactHighcharts
                    highcharts={Highcharts}
                    config={Highcharts.merge(defaultConfig(), {
                      chart: { type: 'column' },
                      yAxis: {
                        min: maxMinDisplayDiff[0],
                        max: maxMinDisplayDiff[1]
                      },
                      xAxis: {
                        categories: [
                          `${moment(statsDate)
                            .subtract(4, 'months')
                            .format('YYYY/MM')} → ${moment(statsDate)
                            .subtract(2, 'months')
                            .format('YYYY/MM')}`,
                          `${moment(statsDate)
                            .subtract(2, 'months')
                            .format('YYYY/MM')} → ${moment(statsDate).format('YYYY/MM')}`
                        ]
                      },
                      series: [
                        {
                          data: [
                            estimated3y.rows.map(row => row[3])[1] - estimated3y.rows.map(row => row[3])[0],
                            estimated3y.rows.map(row => row[3])[2] - estimated3y.rows.map(row => row[3])[1]
                          ]
                        }
                      ],
                      tooltip: {
                        headerFormat: `<span style="font-size:10px">3v tahdin muutos:</span><br/>`,
                        pointFormatter() {
                          const y = showRelative ? `${(this.y * 100).toFixed(1)} prosenttiyksikköä` : `${this.y}`
                          return `<span style="color:${this.color}">●</span> ${this.category}: <b>${y}</b><br/>`
                        }
                      }
                    })}
                  />
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ProtoE
