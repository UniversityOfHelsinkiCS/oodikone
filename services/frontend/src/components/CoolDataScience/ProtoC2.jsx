/* eslint-disable babel/no-invalid-this */
import React, { useState, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import _ from 'lodash'
import { Dropdown, Menu, Segment, Loader, Dimmer, Checkbox, Message } from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'
import HighchartsCustomEvents from 'highcharts-custom-events'

import moment from 'moment'
import TSA from '../../common/tsa'
import InfoToolTips from '../../common/InfoToolTips'
import { useGetProtoCQuery, useGetProtoCProgrammeQuery } from '../../redux/coolDataScience'

HighchartsCustomEvents(Highcharts)

const ANALYTICS_CATEGORY = 'Trends'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const upToYear = moment().isBefore({ day: 1, month: 7 }) ? moment().year() - 2 : moment().year() - 1

const defaultConfig = () => {
  return {
    chart: {
      type: 'column',
      marginTop: 20,
    },
    credits: {
      text: 'oodikone | TOSKA',
    },
    title: {
      text: '',
      style: {
        display: 'none',
      },
    },

    yAxis: {
      min: 0,
      title: {
        text: 'Tavoiteajassa',
      },
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'bold',
          color:
            // theme
            (Highcharts.defaultOptions.title.style && Highcharts.defaultOptions.title.style.color) || 'gray',
        },
      },
    },
    legend: {
      align: 'right',
      x: -20,
      verticalAlign: 'top',
      y: -10,
      floating: true,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false,
    },
    tooltip: {
      shared: true,
      pointFormatter() {
        return `<span style="color:${this.color}">●</span> ${this.series.name}: <b>${this.y}</b> (${(
          this.z * 100
        ).toFixed(1)}%)<br/>`
      },
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
        },
      },
    },
  }
}

const makeConfig = (data, sorter, type = 'column', clickHandler) => {
  const addMouseOverHandler = serie => {
    serie.point = {
      events: {
        mouseOver() {
          const findLabel = (x, ticks) => {
            return ticks[x]
          }
          const tick = this.series.xAxis ? findLabel(this.x, this.series.xAxis.ticks) : null
          this.selectedTick = tick
          if (tick) {
            tick.label.css({
              color: 'black',
              fontWeight: 'bold',
            })
          }
        },
        mouseOut() {
          if (this.selectedTick && this.selectedTick.label) {
            this.selectedTick.label.css({
              color: 'grey',
              fontWeight: 'normal',
            })
            this.selectedTick = null
          }
        },
      },
    }
    return serie
  }

  const orgSeries = [
    {
      color: '#7f8c8d',
      name: 'tällä hetkellä passiivinen',
      data: data.map(entry => ({
        y: entry.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: entry.currentlyCancelled / entry.totalStudents,
      })),
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: data.map(entry => ({
        custom: {
          code: entry.code,
        },
        y: entry.totalStudents - entry.students3y - entry.students4y - entry.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: (entry.totalStudents - entry.students3y - entry.students4y - entry.currentlyCancelled) / entry.totalStudents,
      })),
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: data.map(entry => ({
        custom: {
          code: entry.code,
        },
        y: entry.students4y,
        z: entry.students4y / entry.totalStudents,
      })),
    },
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: data.map(entry => ({
        custom: {
          code: entry.code,
        },
        y: entry.students3y,
        z: entry.students3y / entry.totalStudents,
      })),
    },
  ].map(addMouseOverHandler)

  const categories = data.map(entry => entry.name)

  return Highcharts.merge(defaultConfig(), {
    chart: {
      type,
    },
    xAxis: {
      categories,
      labels: {
        events: {
          click() {
            const { chart } = this
            chart.myLabel.destroy()
            const clickedLabel = data.find(entry => entry.name === this.value)
            if (clickedLabel) clickHandler(clickedLabel)
            sendAnalytics('Drilldown clicked', 'ProtoC2')
          },
          mouseover() {
            const findLabel = (x, ticks) => {
              return ticks[x]
            }
            const tick = this.axis ? findLabel(this.pos, this.axis.ticks) : null
            this.selectedTick = tick

            // create custom tooltip since highcharts does not
            // allow tooltip open on label hover
            const customToolTip = orgSeries.reduce((acc, curr) => {
              const percentage = (curr.data[tick.pos].z * 100).toFixed(1)
              // eslint-disable-next-line no-param-reassign
              acc = `${acc} <span style="color:${curr.color}">●</span> ${curr.name}: <b>${
                curr.data[tick.pos].y
              }</b> (${percentage}%)<br/>`
              return acc
            }, `${tick.label.textStr}<br/>`)

            // renders custom tooltip. 320 and (tick.axis...) defines the position of tooltip
            // if you have better ideas/ways to handle this please feel free to fix since
            // this does not work all that well
            this.chart.myLabel = this.chart.renderer
              .label(
                customToolTip,
                320,
                (tick.axis.height / Object.keys(this.axis.ticks).length) * tick.pos,
                'rectangle'
              )
              .css({
                color: 'black',
              })
              .attr({
                fill: 'white',
                padding: 8,
                r: 1,
                opacity: 0.8,
                'stroke-width': 1,
                stroke: 'black',
              })
              .add()
              .toFront()

            if (tick) {
              tick.label.css({
                color: 'black',
                fontWeight: 'bold',
              })
            }
          },
          mouseout() {
            if (this.selectedTick && this.selectedTick.label) {
              this.selectedTick.label.css({
                color: '#666666',
                fontWeight: 'normal',
              })
              this.selectedTick = null
              this.chart.myLabel.destroy()
            }
          },
        },
        style: {
          cursor: 'pointer',
        },
      },
    },
    series: orgSeries,
    plotOptions: {
      series: {
        cursor: 'pointer',
        point: {
          events: {
            click(e) {
              const { point } = e
              if (point.custom && point.custom.code) {
                // clicked on top-level, drill down
                sendAnalytics('Org drilldown clicked', 'ProtoC2')
                const datapoint = data.find(entry => entry.code === point.custom.code)
                clickHandler(datapoint)
              }
            },
          },
        },
      },
    },
  })
}

const countNotInTarget = entry => entry.totalStudents - entry.students4y - entry.students3y - entry.currentlyCancelled
const sorters = {
  nimi: (a, b) => a.name.localeCompare(b.name),
  '4v tahti': (a, b) => a.students4y - b.students4y,
  '3v tahti': (a, b) => a.students3y - b.students3y,
  'ei tahdissa': (a, b) => countNotInTarget(a) + a.currentlyCancelled - (countNotInTarget(b) + b.currentlyCancelled),
  passiivinen: (a, b) => a.currentlyCancelled - b.currentlyCancelled,
}

const ClickableChart = React.memo(({ data, sorter, isSideways, clickHandler }) => {
  return (
    <ReactHighcharts
      highcharts={Highcharts}
      config={makeConfig(data, sorter, isSideways ? 'bar' : 'column', clickHandler)}
    />
  )
})

const NonClickableChart = React.memo(({ data, sorter, isSideways }) => {
  if (data.length < 1)
    return (
      <Segment>
        <h3 align="center">no studytrack data available for selected programme</h3>
      </Segment>
    )
  return <ReactHighcharts highcharts={Highcharts} config={makeConfig(data, sorter, isSideways ? 'bar' : 'column')} />
})

NonClickableChart.defaultProps = {
  isSideways: false,
}

ClickableChart.defaultProps = {
  isSideways: false,
}

const ProtoC = ({ programme = 'KH50_005' }) => {
  const [sorter, setSorter] = useState('3v tahti')
  const [sortDir, setSortDir] = useState(1)
  const [drilldownOrgCode, setDrilldownOrgCode] = useState(null)
  const [drilldownProgrammeCode, setDrilldownProgrammeCode] = useState(null)

  const [includeOldAttainments, setIncludeOldAttainments] = useState(false)
  const [excludeNonEnrolled, setExcludeNonEnrolled] = useState(false)

  const [yearRange, setYearRange] = useState([2017, upToYear])
  const [startYear, endYear] = yearRange

  const { data, isLoading, isFetching } = useGetProtoCQuery({
    excludeNonEnrolled,
    includeOldAttainments,
    startYear,
    endYear,
  })

  const {
    data: protoCProgrammeData,
    isLoading: protoCProgrammeLoading,
    isFetching: protoCProgrammeFetching,
  } = useGetProtoCProgrammeQuery(
    {
      includeOldAttainments: includeOldAttainments.toString(),
      excludeNonEnrolled: excludeNonEnrolled.toString(),
      code: programme,
      startYear,
      endYear,
    },
    {
      skip: !programme,
    }
  )

  const drilldownOrg = useMemo(
    () => (data ? Object.values(data).find(org => org.code === drilldownOrgCode) : null),
    [drilldownOrgCode, data]
  )

  const drilldownProgramme = useMemo(
    () =>
      data
        ? Object.values(data)
            .find(org => org.code === drilldownOrgCode)
            ?.programmes?.find?.(prog => prog.code === drilldownProgrammeCode)
        : null,
    [drilldownOrgCode, drilldownProgrammeCode, data]
  )

  const handleOldAttainmentToggled = useCallback(() => {
    setIncludeOldAttainments(previous => !previous)
    sendAnalytics('C2 Toggled old attainments', 'ProtoC2')
  }, [])

  const handleExcludeNonEnrolledToggled = useCallback(() => {
    setExcludeNonEnrolled(previous => !previous)
    sendAnalytics('C2 Toggled non enrolled', 'ProtoC2')
  }, [])

  const currentSorter = useCallback((a, b) => sorters[sorter](a, b) * sortDir, [sorter, sortDir])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort(currentSorter)
  }, [data, currentSorter])

  const sortedProgrammes = useMemo(() => {
    return [...(drilldownOrg?.programmes || [])].sort(currentSorter)
  }, [drilldownOrg, currentSorter])

  const sortedStudytracks = useMemo(() => {
    const studytracks = programme ? protoCProgrammeData?.studytracks : drilldownProgramme?.studytracks

    return [...(studytracks || [])].sort(currentSorter)
  }, [programme, drilldownProgramme, protoCProgrammeData, currentSorter])

  const drilldownOrgClick = useCallback(org => {
    setDrilldownOrgCode(org.code)
  })

  const drilldownProgrammeClick = useCallback(programme => {
    setDrilldownProgrammeCode(programme.code)
  })

  const { CoolDataScience } = InfoToolTips

  const handleClick = sorterName => {
    if (sorterName === sorter) setSortDir(-1 * sortDir)
    setSorter(sorterName)
    sendAnalytics('C2 Sorter clicked', 'ProtoC2')
  }

  const DrilldownMessage = () => (
    <Message
      color="blue"
      content=" Graafissa pystyy palkkeja klikkaamalla porautumaan kunkin tiedekunnan ohjelmatasolle.
      Ohjelmatasolla jotakin palkkia klikkaamalla pystyy porautumaan opintosuuntaus tasolle."
    />
  )

  const sorterNames = Object.keys(sorters)
    .map(sorterName => sorterName)
    .sort((a, b) => {
      if (b === 'nimi') return 1
      if (a === 'nimi') return -1
      return a > b ? 1 : -1
    })

  if (programme && drilldownProgramme) {
    return (
      <Segment>
        <div align="center">
          <h2>
            Prototyyppi: Tavoiteaikaerittely, {startYear}-{endYear} aloittaneet
          </h2>
        </div>
        <div
          align="center"
          style={{ marginTop: '10px', display: 'flex', gap: '10px 20px', flexFlow: 'wrap', justifyContent: 'center' }}
        >
          <Menu compact>
            <Menu.Item>Started between</Menu.Item>
            <Dropdown
              className="link item"
              value={startYear}
              onChange={(_, { value }) => setYearRange([value, endYear])}
              options={_.range(2017, upToYear + 1).map(year => ({
                key: year,
                value: year,
                text: year,
                disabled: year > endYear,
              }))}
            />
            <Menu.Item>and</Menu.Item>
            <Dropdown
              className="link item"
              value={endYear}
              onChange={(_, { value }) => setYearRange([startYear, value])}
              options={_.range(2017, upToYear + 1).map(year => ({
                key: year,
                value: year,
                text: year,
                disabled: year < startYear,
              }))}
            />
          </Menu>
          <Menu compact>
            <Menu.Item style={{ cursor: 'default' }} active color="black">
              Sort by:
            </Menu.Item>
            {sorterNames.map(sorterName => (
              <Menu.Item
                basic={(sorter !== sorterName).toString()}
                color={sorter === sorterName ? 'blue' : 'black'}
                key={sorterName}
                active={sorter === sorterName}
                onClick={() => handleClick(sorterName)}
                style={{ borderRadius: '1px' }}
                icon={sortDir === 1 ? 'triangle down' : 'triangle up'}
                content={sorterName}
              />
            ))}
          </Menu>
        </div>
        <Segment placeholder={isLoading} vertical>
          <Dimmer inverted active />
          <Loader active />
          {!protoCProgrammeLoading && protoCProgrammeData && (
            <>
              <NonClickableChart data={drilldownProgramme} sorter={currentSorter} isSideways />
            </>
          )}
          <div align="center">
            <Checkbox
              label="Include only at least once enrolled students"
              onChange={handleExcludeNonEnrolledToggled}
              checked={excludeNonEnrolled}
            />
            <Checkbox
              style={{ marginLeft: '10px' }}
              label="Include attainments attained before the studyright start"
              onChange={handleOldAttainmentToggled}
              checked={includeOldAttainments}
            />
          </div>
          <Message>
            {
              // eslint-disable-next-line react/no-children-prop
              <ReactMarkdown children={CoolDataScience.protoC2} />
            }
          </Message>
        </Segment>
      </Segment>
    )
  }

  const [studytracksLoading, studytracksFetching] = !programme
    ? [isLoading, isFetching]
    : [protoCProgrammeLoading, protoCProgrammeFetching]

  return (
    <Segment>
      <div align="center">
        <h2>
          Kandiohjelmat: Tavoiteaikaerittely, {startYear}-{endYear} aloittaneet
        </h2>
      </div>
      <DrilldownMessage />
      <div
        align="center"
        style={{ marginTop: '10px', display: 'flex', gap: '10px 20px', flexFlow: 'wrap', justifyContent: 'center' }}
      >
        <Menu compact>
          <Menu.Item>Started between</Menu.Item>
          <Dropdown
            className="link item"
            value={startYear}
            onChange={(_, { value }) => setYearRange([value, endYear])}
            options={_.range(2017, upToYear + 1).map(year => ({
              key: year,
              value: year,
              text: year,
              disabled: year > endYear,
            }))}
          />
          <Menu.Item>and</Menu.Item>
          <Dropdown
            className="link item"
            value={endYear}
            onChange={(_, { value }) => setYearRange([startYear, value])}
            options={_.range(2017, upToYear + 1).map(year => ({
              key: year,
              value: year,
              text: year,
              disabled: year < startYear,
            }))}
          />
        </Menu>
        <Menu compact>
          <Menu.Item style={{ cursor: 'default' }} active color="black">
            Sort by:
          </Menu.Item>
          {sorterNames.map(sorterName => (
            <Menu.Item
              basic={(sorter !== sorterName).toString()}
              color={sorter === sorterName ? 'blue' : 'black'}
              key={sorterName}
              active={sorter === sorterName}
              onClick={() => handleClick(sorterName)}
              style={{ borderRadius: '1px' }}
              icon={sortDir === 1 ? 'triangle down' : 'triangle up'}
              content={sorterName}
            />
          ))}
        </Menu>
      </div>
      <Segment placeholder={isLoading} vertical>
        <Dimmer inverted active={isFetching} />
        <Loader active={isFetching} />
        {!isLoading && data && (
          <>
            <ClickableChart data={sortedOrgs} sorter={currentSorter} isSideways clickHandler={drilldownOrgClick} />
            {drilldownOrg && (
              <ClickableChart
                data={sortedProgrammes}
                sorter={currentSorter}
                isSideways
                clickHandler={drilldownProgrammeClick}
              />
            )}
          </>
        )}
      </Segment>
      {drilldownProgramme && (
        <Segment placeholder={studytracksLoading} vertical>
          <Dimmer inverted active={studytracksFetching} />
          <Loader active={studytracksFetching} />
          <NonClickableChart data={sortedStudytracks} sorter={currentSorter} isSideways />
        </Segment>
      )}
      <Segment>
        <div align="center">
          <Checkbox
            label="Include only at least once enrolled students"
            onChange={handleExcludeNonEnrolledToggled}
            checked={excludeNonEnrolled}
          />
          <Checkbox
            style={{ marginLeft: '10px' }}
            label="Include attainments attained before the studyright start"
            onChange={handleOldAttainmentToggled}
            checked={includeOldAttainments}
          />
        </div>
        <Message>
          {
            // eslint-disable-next-line react/no-children-prop
            <ReactMarkdown children={CoolDataScience.protoC2} />
          }
        </Message>
      </Segment>
    </Segment>
  )
}

ProtoC.defaultProps = {
  programme: '',
}

export default ProtoC
