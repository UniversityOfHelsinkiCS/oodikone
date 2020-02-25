/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import moment from 'moment'
import { Table, Checkbox, Form, Dropdown } from 'semantic-ui-react'
import _ from 'lodash'
import { callApi } from '../../apiConnection'

const defaultConfig = () => ({
  chart: {
    backgroundColor: null,
    borderWidth: 0,
    type: 'area',
    margin: [2, 0, 2, 0],
    width: 500,
    height: 50,
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
      }
    },
    column: {
      negativeColor: '#910000',
      borderColor: 'silver'
    }
  }
})

const ProtoG = () => {
  const [startDate, setStartDate] = useState('2017-07-31T21:00:00.000Z')
  const [uberdata, setUberdata] = useState(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await callApi('/cool-data-science/uber-data', 'get', null, { start_date: startDate })
      setUberdata(res.data)
      setLoading(false)
    }
    load()
  }, [startDate])

  if (isLoading) {
    return <div>loading...</div>
  }

  if (!isLoading && !uberdata) {
    return <div>no data?</div>
  }

  return (
    <div>
      <Table compact striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Tiedekunta</Table.HeaderCell>
            <Table.HeaderCell>3v tahdin kehitys</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {Object.values(uberdata).map(({ name, code, snapshots, programmes }) => {
            return (
              <Table.Row key={code}>
                <Table.Cell>{name}</Table.Cell>
                <Table.Cell>
                  <ReactHighcharts
                    highcharts={Highcharts}
                    config={Highcharts.merge(defaultConfig(), {
                      xAxis: {
                        categories: snapshots.map(s => {
                          const date = new Date(s.date)
                          return `<b>${date.getFullYear()}</b>-${date.getMonth()}-${date.getDate()}`
                        })
                      },
                      series: [
                        {
                          name: 'muut',
                          data: snapshots.map(s => s.totalStudents - s.students3y - s.students4y),
                          color: '#ff7979',
                          fillOpacity: 0.7
                        },
                        {
                          name: '4v tahdissa',
                          data: snapshots.map(s => s.students4y),
                          color: '#f9ca24',
                          fillOpacity: 0.7
                        },
                        {
                          name: '3v tahdissa',
                          data: snapshots.map(s => s.students3y),
                          color: '#6ab04c',
                          fillOpacity: 0.7
                        }
                      ],
                      tooltip: {
                        pointFormat:
                          '<span style="color:{series.color}">●</span>	<span style="font-weight:bold;">{series.name}</span>: {point.percentage:.1f}% ({point.y})<br/>'
                      },
                      plotOptions: {
                        area: {
                          stacking: 'percent',
                          lineColor: '#ffffff',
                          lineWidth: 1,
                          marker: {
                            lineWidth: 1
                          }
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

export default ProtoG
