/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Table, Checkbox, Form } from 'semantic-ui-react'
import _ from 'lodash'
import { dataPropTypes } from './data'

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

// xAxis.categories: start year
// series.pointStart: 1
// series.data: the numbers lol

const makeSegmentConfig = ({ facultyRows, relative, color, header }) => {
  const startDates = facultyRows.map(row => new Date(row[2]))
  const config = {
    xAxis: {
      categories: startDates
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
        return `<span style="color:${this.color}">●</span> ${this.category.getFullYear()}: <b>${y}</b><br/>`
      }
    }
  }
  return Highcharts.merge(defaultConfig(), config)
}

const getFaculties = _.memoize(data =>
  _(data.ok)
    .map(arr => arr[1])
    .uniq()
    .sort((a, b) => a.localeCompare(b))
    .value()
)

const Chunked = ({ children }) => {
  const [chunk, setChunk] = useState(0)

  useEffect(() => {
    setChunk(1)
  }, [children])

  useEffect(() => {
    if (chunk >= children.length) {
      return () => {}
    }

    const handle = setTimeout(() => {
      setChunk(chunk + 3)
    }, 1)

    return () => {
      clearTimeout(handle)
    }
  }, [chunk])

  return children.slice(0, chunk)
}

Chunked.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node).isRequired
}

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

const displayDataSorters = {
  facultyName: (a, b) => a.facultyName.localeCompare(b),
  estimated3y: (a, b) => a.estimated3y.total - b.estimated3y.total,
  estimated4y: (a, b) => a.estimated4y.total - b.estimated4y.total,
  estimatedTrash: (a, b) => a.estimatedTrash.total - b.estimatedTrash.total
}

const ProtoD = ({ data }) => {
  const facultyNames = getFaculties(data)

  const count3yAmount = useCallback(
    facultyName => {
      return data.ebin.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
    },
    [data.ebin]
  )

  const countInclusive4yAmount = useCallback(
    facultyName => data.ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0),
    [data.ok]
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
      return data.not_ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
    },
    [data.not_ok]
  )

  const countTotal = useCallback(facultyName => countTrashAmount(facultyName) + countInclusive4yAmount(facultyName), [
    countTrashAmount,
    countInclusive4yAmount
  ])

  const [showRelative, setShowRelative] = useState(false)
  const [sortKey, setSortKey] = useState('estimated3y')
  const [sortDirection, setSortDirection] = useState(-1)

  function mapDisplayData(facultyName) {
    const whereFacultySortByStartDate = (rows, facultyName) => {
      return _(rows)
        .filter(row => row[1] === facultyName)
        .sortBy(row => row[2])
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

    const rows3y = whereFacultySortByStartDate(data.ebin, facultyName).map(relativeMapper)
    const rows4y = whereFacultySortByStartDate(data.ok, facultyName).map(relativeMapper)
    const rowsTrash = whereFacultySortByStartDate(data.not_ok, facultyName).map(relativeMapper)

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

  return (
    <div>
      <Form>
        <Form.Field
          onChange={() => setShowRelative(!showRelative)}
          checked={showRelative}
          control={Checkbox}
          label={{ children: 'Relative' }}
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
                    header="3v tahdissa, aloitusvuosi:"
                  />
                </Table.Cell>
                <Table.Cell>{showRelative ? `${(estimated4y.total * 100).toFixed(1)}%` : estimated4y.total}</Table.Cell>
                <Table.Cell>
                  <SegmentChart
                    facultyRows={estimated4y.rows}
                    relative={showRelative}
                    color="#f9ca24"
                    header="4v tahdissa, aloitusvuosi:"
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
                    header="Ei tahdissa, aloitusvuosi:"
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

ProtoD.propTypes = {
  data: PropTypes.shape(dataPropTypes).isRequired
}

export default ProtoD
