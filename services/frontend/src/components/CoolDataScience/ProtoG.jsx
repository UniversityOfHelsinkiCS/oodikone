/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Table, Form, Dropdown, Icon, Checkbox, Message } from 'semantic-ui-react'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'

import TSA from '../../common/tsa'
import InfoToolTips from '../../common/InfoToolTips'
import { getUber, getYears } from '../../redux/coolDataScience'
import './protoG.css'

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

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
    // small optimization, saves 1-2 ms each sparkline
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

const Chart = React.memo(({ tickDates, snapshots }) => (
  <ReactHighcharts
    highcharts={Highcharts}
    config={Highcharts.merge(defaultConfig(), {
      xAxis: {
        type: 'datetime',
        labels: {
          formatter: function() {
            const d = new Date(this.value)
            return `${d.getDate()}.${d.getMonth()}.${d
              .getFullYear()
              .toString()
              .substring(-2)}`
          }
        },
        tickPositions: tickDates.map(date => date.getTime()),
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
          '<span style="color:{series.color}">●</span>	<span>{series.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y})<br/>',
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
))

const getSnapshotsStartYears = _.memoize(snapshots =>
  _.uniq(snapshots.map(s => new Date(s.date).getFullYear())).map(year => new Date(year, 8, 1))
)

const ProtoG = ({ uberdata, years, isLoading, loadingYears, getUberDispatch, getYearsDispatch }) => {
  const [startOptions, setStartOptions] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [expandedOrgs, setExpandedOrgs] = useState({})
  const [includeOldAttainments, setIncludeOldAttainments] = useState(false)

  useEffect(() => {
    getYearsDispatch()
  }, [])

  useEffect(() => {
    if (years.length > 0) {
      setStartOptions(years.map((date, i) => ({ key: i, text: new Date(date).getFullYear(), value: date })))
      setStartDate(years[0])
    }
  }, [years])

  useEffect(() => {
    async function load() {
      getUberDispatch({ startDate, includeOldAttainments: includeOldAttainments.toString() })
    }

    if (startDate) {
      load()
    }
  }, [startDate, includeOldAttainments])

  const handleOldAttainmentToggled = useCallback(() => {
    setIncludeOldAttainments(previous => !previous)
    sendAnalytics('G Toggled old attainments', 'ProtoG')
  }, [])

  const handleYearChanged = useCallback((e, { value }) => {
    setStartDate(value)
    sendAnalytics('G Year changed', 'ProtoG')
  }, [])
  const preventDefault = useCallback(e => e.preventDefault(), [])

  const makeHandleExpando = orgCode => {
    return () => {
      setExpandedOrgs({ ...expandedOrgs, [orgCode]: !expandedOrgs[orgCode] })
      sendAnalytics('G Toggled expanded orgs', 'ProtoG')
    }
  }

  const DrilldownMessage = () => (
    <Message color='blue'
      content="Klikkaamalla tiedekuntaa pystyt tarkastelemaan koulutusohjelma kohtaista dataa."
    />
  )

  const { CoolDataScience } = InfoToolTips
  return (
    <Segment>
      <div style={{ display: 'flex' }}>
        <h2>Kandiohjelmat: Suhteellisen tavoiteaikaerittelyn kehitys</h2>
        <Checkbox
          style={{ marginLeft: 'auto' }}
          label="Include attainments attained before the studyright start"
          onChange={handleOldAttainmentToggled}
          checked={includeOldAttainments}
        />
      </div>
      <DrilldownMessage />
      <Form onSubmit={preventDefault}>
        <Form.Group inline>
          <Form.Field>
            <label>Aloitusvuosi</label>
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

      <Segment placeholder={isLoading || loadingYears} vertical>
        <Dimmer inverted active={isLoading || loadingYears} />
        <Loader active={isLoading || loadingYears} />

        {uberdata && (
          <Table compact striped className="proto-g-table">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell></Table.HeaderCell>
                <Table.HeaderCell>Tiedekunta</Table.HeaderCell>
                <Table.HeaderCell>Tahdissa olevien kehitys</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {uberdata.map(({ name, code, snapshots, programmes }) => {
                const isExpanded = !!expandedOrgs[code]
                const tickDates = getSnapshotsStartYears(snapshots)

                return (
                  <React.Fragment key={code}>
                    <Table.Row
                      className={`proto-g-row ${isExpanded ? 'proto-g-row--expanded' : ''}`}
                      onClick={makeHandleExpando(code)}
                    >
                      <Table.Cell style={{ paddingRight: '0', paddingLeft: '0.7em' }}>
                        <Icon name={isExpanded ? 'caret down' : 'caret right'} color="grey" />
                      </Table.Cell>
                      <Table.Cell>{name}</Table.Cell>
                      <Table.Cell style={{ paddingBottom: '20px' }}>
                        <Chart tickDates={tickDates} snapshots={snapshots} />
                      </Table.Cell>
                    </Table.Row>

                    {isExpanded &&
                      programmes.map(programme => {
                        return (
                          <Table.Row key={`${code}-${programme.code}`} className="proto-g-row-child">
                            <Table.Cell style={{ padding: '0' }} />
                            <Table.Cell>{programme.name}</Table.Cell>
                            <Table.Cell style={{ paddingBottom: '20px' }}>
                              <Chart tickDates={tickDates} snapshots={programme.snapshots} />
                            </Table.Cell>
                          </Table.Row>
                        )
                      })}
                  </React.Fragment>
                )
              })}
            </Table.Body>
          </Table>
        )}
        <Message>
          {//eslint-disable-next-line react/no-children-prop
            <ReactMarkdown children={CoolDataScience.protoC} />
          }
        </Message>
      </Segment>
    </Segment>
  )
}

const mapStateToProps = ({ coolDataScience }) => ({
  uberdata: coolDataScience.data.uber || [],
  isLoading: coolDataScience.pending.uber,
  years: coolDataScience.data.years,
  loadingYears: coolDataScience.pending.years
})

export default connect(
  mapStateToProps,
  { getUberDispatch: getUber, getYearsDispatch: getYears }
)(ProtoG)
