/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Table, Form, Dropdown } from 'semantic-ui-react'
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
  const [startOptions, setStartOptions] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [uberdata, setUberdata] = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await callApi('/cool-data-science/start-years')
      setLoading(false)
      setStartOptions(res.data.map((date, i) => ({ key: i, text: new Date(date).getFullYear(), value: date })))
      setStartDate(res.data[0])
    }

    load()
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await callApi('/cool-data-science/uber-data', 'get', null, { start_date: startDate })
      setUberdata(res.data)
      setLoading(false)
    }

    if (startDate) {
      load()
    }
  }, [startDate])

  const handleYearChanged = useCallback((e, { value }) => {
    setStartDate(value)
  }, [])
  const preventDefault = useCallback(e => e.preventDefault(), [])

  return (
    <Segment>
      <h3>Proto G</h3>

      <Form onSubmit={preventDefault}>
        <Form.Group inline>
          <Form.Field>
            <label>Start year</label>
            <Dropdown
              onChange={handleYearChanged}
              options={startOptions}
              placholder="Choose year"
              selection
              value={startDate}
            />
          </Form.Field>
        </Form.Group>
      </Form>

      <Segment placeholder={isLoading} vertical>
        <Dimmer inverted active={isLoading} />
        <Loader active={isLoading} />

        {uberdata && (
          <Table compact striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Tiedekunta</Table.HeaderCell>
                <Table.HeaderCell>Tahdissa olevien kehitys</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {Object.values(uberdata)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(({ name, code, snapshots, programmes }) => {
                  const years = _.uniq(snapshots.map(s => new Date(s.date).getFullYear())).map(
                    year => new Date(year, 1, 1)
                  )

                  return (
                    <Table.Row key={code}>
                      <Table.Cell>{name}</Table.Cell>
                      <Table.Cell style={{ paddingBottom: '20px' }}>
                        <ReactHighcharts
                          highcharts={Highcharts}
                          config={Highcharts.merge(defaultConfig(), {
                            xAxis: {
                              type: 'datetime',
                              labels: {
                                formatter: function() {
                                  return new Date(this.value).getFullYear()
                                }
                              },
                              tickPositions: years.map(date => date.getTime()),
                              minorTickInterval: 1.051e10,
                              minorTicks: true
                            },
                            series: [
                              {
                                name: 'muut',
                                data: snapshots.map(s => ({
                                  y: s.totalStudents - s.students3y - s.students4y,
                                  x: new Date(s.date).getTime()
                                })),
                                color: '#ff7979',
                                fillOpacity: 0.7
                              },
                              {
                                name: '4v tahdissa',
                                data: snapshots.map(s => ({
                                  y: s.students4y,
                                  x: new Date(s.date).getTime()
                                })),
                                color: '#f9ca24',
                                fillOpacity: 0.7
                              },
                              {
                                name: '3v tahdissa',
                                data: snapshots.map(s => ({
                                  y: s.students3y,
                                  x: new Date(s.date).getTime()
                                })),
                                color: '#6ab04c',
                                fillOpacity: 0.7
                              }
                            ],
                            tooltip: {
                              pointFormat:
                                '<span style="color:{series.color}">●</span>	<span style="font-weight:bold;">{series.name}</span>: {point.percentage:.1f}% ({point.y})<br/>',
                              xDateFormat: '%Y-%m-%d'
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
        )}
      </Segment>
    </Segment>
  )
}

export default ProtoG
