/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Checkbox, Button, Message, Icon } from 'semantic-ui-react'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'
import HighchartsCustomEvents from 'highcharts-custom-events'

import { callApi } from '../../apiConnection'
import InfoToolTips from '../../common/InfoToolTips'

HighchartsCustomEvents(Highcharts)

const defaultConfig = (pointer = true) => {
  return {
    chart: {
      type: 'area',
      inverted: true
    },
    credits: {
      text: 'oodikone | TOSKA'
    },
    accessibility: {
      keyboardNavigation: {
        seriesNavigation: {
          mode: 'serialize'
        }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      shared: true,
      followPointer: true,
      pointFormatter() {
        const percentage = (this.z * 100).toFixed(1)
        return `<span style="color:${this.color}">●</span> ${this.series.name}: <b>${percentage}%</b> (${this.y})<br/>`
      }
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false
    },
    plotOptions: {
      area: {
        cursor: pointer ? 'pointer' : undefined,
        fillOpacity: 0.5,
        stacking: 'percent',
        lineColor: '#ffffff',
        lineWidth: 1,
        marker: {
          lineWidth: 1,
          lineColor: '#ffffff'
        },
        accessibility: {
          pointDescriptionFormatter(point) {
            function round(x) {
              return Math.round(x * 100) / 100
            }
            return `${point.index + 1}, ${point.category}, ${point.y}, ${round(point.percentage)}%, ${
              point.series.name
            }`
          }
        }
      }
    }
  }
}

const makeClickableChartConfig = (sortedData, onPointClicked, org) => {
  const addPointClickHandler = serie => {
    serie.point = {
      events: {
        click: e => {
          const clickedPoint = sortedData.find(data => e.point && e.point.custom && data.code === e.point.custom.code)
          if (clickedPoint) {
            // use setImmediate so the click handler can finish
            // before datamangels begins so that the browser is responsive
            setImmediate(() => onPointClicked(clickedPoint))
          }
        },
        mouseOver: function(e) {
          const findLabel = (x, ticks) => {
            return ticks[x]
          }
          const tick = this.series.xAxis ? findLabel(this.x, this.series.xAxis.ticks) : null
          this.selectedTick = tick
          if (tick) {
            tick.label.css({
              color: 'black',
              fontWeight: 'bold'
            })
          }
        },
        mouseOut: function(e) {
          if (this.selectedTick && this.selectedTick.label) {
            this.selectedTick.label.css({
              color: '#666666',
              fontWeight: 'normal'
            })
            this.selectedTick = null
          }
        }
      }
    }
    return serie
  }

  const series = [
    {
      color: '#7f8c8d',
      name: 'tällä hetkellä peruutettu',
      data: sortedData.map(data => ({
        y: data.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: data.currentlyCancelled / data.totalStudents
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: sortedData.map(data => ({
        custom: {
          code: data.code
        },
        y: data.totalStudents - data.students3y - data.students4y - data.currentlyCancelled,
        z: (data.totalStudents - data.students3y - data.students4y - data.currentlyCancelled) / data.totalStudents
      }))
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: sortedData.map(data => ({
        custom: {
          code: data.code
        },
        y: data.students4y,
        z: data.students4y / data.totalStudents
      }))
    },
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: sortedData.map(data => ({
        custom: {
          code: data.code
        },
        y: data.students3y,
        z: data.students3y / data.totalStudents
      }))
    }
  ].map(addPointClickHandler)

  return Highcharts.merge(defaultConfig(), {
    title: {
      text: '',
      style: {
        display: 'none'
      }
    },
    xAxis: {
      categories: sortedData.map(data => data.name),
      labels: {
        events: {
          click: function(e) {
            const clickedLabel = sortedData.find(data => data.name === this.value)
            setImmediate(() => onPointClicked(clickedLabel))
          },
          mouseover: function(e) {
            const findLabel = (x, ticks) => {
              return ticks[x]
            }
            const tick = this.axis ? findLabel(this.pos, this.axis.ticks) : null
            this.selectedTick = tick

            // create custom tooltip since highcharts does not
            // allow tooltip open on label hover
            const customToolTip = series.reduce((acc, curr) => {
              const percentage = (curr.data[tick.pos].z * 100).toFixed(1)
              acc = `${acc} <span style="color:${curr.color}">●</span> ${curr.name}: <b>${percentage}%</b> (${curr.data[tick.pos].y})<br/>`
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
                color: 'black'
              })
              .attr({
                fill: 'white',
                padding: 8,
                r: 1,
                opacity: 0.8,
                'stroke-width': 1,
                stroke: 'black'
              })
              .add()
              .toFront()

            if (tick) {
              tick.label.css({
                color: 'black',
                fontWeight: 'bold'
              })
            }
          },
          mouseout: function() {
            if (this.selectedTick && this.selectedTick.label) {
              this.selectedTick.label.css({
                color: '#666666',
                fontWeight: 'normal'
              })
              this.selectedTick = null
              this.chart.myLabel.destroy()
            }
          }
        },
        style: {
          cursor: 'pointer'
        }
      }
    },
    yAxis: {
      title: {
        text: ` ${
          org ? `2017-2019 aloittaneet uudet kandiopiskelijat<br/>${org.name}` : '% tiedekunnan opiskelijoista'
        }`
      }
    },
    series
  })
}

const makeNonClickableChartConfig = programme => {
  const addMouseOverHandler = serie => {
    serie.point = {
      events: {
        mouseOver: function(e) {
          const findLabel = (x, ticks) => {
            return ticks[x]
          }
          const tick = this.series.xAxis ? findLabel(this.x, this.series.xAxis.ticks) : null
          this.selectedTick = tick
          if (tick) {
            tick.label.css({
              color: 'black',
              fontWeight: 'bold'
            })
          }
        },
        mouseOut: function(e) {
          if (this.selectedTick && this.selectedTick.label) {
            this.selectedTick.label.css({
              color: 'grey',
              fontWeight: 'normal'
            })
            this.selectedTick = null
          }
        }
      }
    }
    return serie
  }

  const series = [
    {
      color: '#7f8c8d',
      name: 'tällä hetkellä peruutettu',
      data: programme.studytracks.map(p => ({
        y: p.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: p.currentlyCancelled / p.totalStudents
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: programme.studytracks.map(p => ({
        y: p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled,
        z: (p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled) / p.totalStudents
      }))
    },

    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: programme.studytracks.map(p => ({
        y: p.students4y,
        z: p.students4y / p.totalStudents
      }))
    },
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: programme.studytracks.map(p => ({
        y: p.students3y,
        z: p.students3y / p.totalStudents
      }))
    }
  ].map(addMouseOverHandler)

  return Highcharts.merge(defaultConfig(false), {
    title: {
      text: `2017-2019 aloittaneet uudet kandiopiskelijat<br/>${programme.name}`
    },
    xAxis: {
      categories: programme.studytracks.map(data => data.name),
      labels: {
        events: {
          mouseover: function(e) {
            const findLabel = (x, ticks) => {
              return ticks[x]
            }

            const tick = this.axis ? findLabel(this.pos, this.axis.ticks) : null
            this.selectedTick = tick

            // create custom tooltip since highcharts does not
            // allow tooltip open on label hover
            const customToolTip = series.reduce((acc, curr) => {
              const percentage = (curr.data[tick.pos].z * 100).toFixed(1)
              acc = `${acc} <span style="color:${curr.color}">●</span> ${curr.name}: <b>${percentage}%</b> (${curr.data[tick.pos].y})<br/>`
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
                color: 'black'
              })
              .attr({
                fill: 'white',
                padding: 8,
                r: 1,
                opacity: 0.8,
                'stroke-width': 1,
                stroke: 'black'
              })
              .add()
              .toFront()

            if (tick) {
              tick.label.css({
                color: 'black',
                fontWeight: 'bold'
              })
            }
          },
          mouseout: function() {
            if (this.selectedTick && this.selectedTick.label) {
              this.selectedTick.label.css({
                color: '#666666',
                fontWeight: 'normal'
              })
              this.selectedTick = null
              this.chart.myLabel.destroy()
            }
          }
        }
      }
    },
    yAxis: {
      title: {
        text: '% opintosuunnan opiskelijoista'
      }
    },
    series
  })
}

const countNotInTarget = org => org.totalStudents - org.students4y - org.students3y - org.currentlyCancelled
const sorters = {
  nimi: (a, b) => a.name.localeCompare(b.name),
  '4v tahti': (a, b) => a.students4y / a.totalStudents - b.students4y / b.totalStudents,
  '3v tahti': (a, b) => a.students3y / a.totalStudents - b.students3y / b.totalStudents,
  'ei tahdissa': (a, b) =>
    (countNotInTarget(a) + a.currentlyCancelled) / a.totalStudents -
    (countNotInTarget(b) + b.currentlyCancelled) / b.totalStudents,
  peruutettu: (a, b) => a.currentlyCancelled / a.totalStudents - b.currentlyCancelled / b.totalStudents
}

const OrgChart = React.memo(({ orgs, onOrgClicked }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeClickableChartConfig(orgs, onOrgClicked)} />
})

const ProgrammeChart = React.memo(({ programmes, onProgrammeClicked, org }) => {
  return (
    <ReactHighcharts highcharts={Highcharts} config={makeClickableChartConfig(programmes, onProgrammeClicked, org)} />
  )
})

const StudytrackChart = React.memo(({ programme }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeNonClickableChartConfig(programme)} />
})

const ProgrammeDrilldown = ({ org, sorter, sortDir, onProgrammeClicked }) => {
  const orgSortedProgrammes = useMemo(() => {
    return { ...org, programmes: [...org.programmes].sort((a, b) => sorters[sorter](a, b) * sortDir) }
  }, [org, sorter, sortDir])

  return (
    <ProgrammeChart
      programmes={orgSortedProgrammes.programmes}
      onProgrammeClicked={onProgrammeClicked}
      org={orgSortedProgrammes}
    />
  )
}

const StudytrackDrilldown = ({ programme, sorter, sortDir }) => {
  if (!programme.studytracks || programme.studytracks.length < 1)
    return (
      <Segment>
        <h3 align="center">no studytrack data available for selected programme</h3>
      </Segment>
    )
  const programmeSortedStudytracks = useMemo(() => {
    return { ...programme, studytracks: [...programme.studytracks].sort((a, b) => sorters[sorter](a, b) * sortDir) }
  }, [programme, sorter, sortDir])
  return <StudytrackChart programme={programmeSortedStudytracks} />
}

const ProtoC = ({ programme }) => {
  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [sorter, setSorter] = useState('3v tahti')
  const [sortDir, setSortDir] = useState(1)
  const [drilldownOrg, setDrilldownOrg] = useState(null)
  const [drilldownProgramme, setDrilldownProgramme] = useState(null)

  const [includeOldAttainments, setIncludeOldAttainments] = useState(false)
  const [excludeNonEnrolled, setExcludeNonEnrolled] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!!programme) {
        setLoading(true)
        const res = await callApi('/cool-data-science/proto-c-data-programme', 'get', null, {
          include_old_attainments: includeOldAttainments.toString(),
          exclude_non_enrolled: excludeNonEnrolled.toString(),
          code: programme
        })
        setDrilldownProgramme(res.data)
        setLoading(false)
      } else {
        setLoading(true)
        const res = await callApi('/cool-data-science/proto-c-data', 'get', null, {
          include_old_attainments: includeOldAttainments.toString(),
          exclude_non_enrolled: excludeNonEnrolled.toString(),
          code: programme
        })
        setData(res.data)
        setLoading(false)
      }
    }
    load()
  }, [includeOldAttainments, excludeNonEnrolled])

  const handleOldAttainmentToggled = useCallback(() => {
    setIncludeOldAttainments(previous => !previous)
  }, [])

  const handleExcludeNonEnrolledToggled = useCallback(() => {
    setExcludeNonEnrolled(previous => !previous)
  }, [])

  const handleOrgClicked = useCallback(org => {
    setDrilldownOrg(org)
    setDrilldownProgramme(null)
  }, [])

  const handleProgrammeClicked = useCallback(programme => {
    setDrilldownProgramme(programme)
  }, [])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort((a, b) => sorters[sorter](a, b) * sortDir)
  }, [data, sorter, sortDir])

  const handleClick = sorterName => {
    if (sorterName === sorter) setSortDir(-1 * sortDir)
    setSorter(sorterName)
  }

  const { CoolDataScience } = InfoToolTips

  // create list from sorters and deprecate this
  const sorterNames = Object.keys(sorters)
    .map(sorterName => sorterName)
    .sort((a, b) => {
      if (a === 'nimi') return false
      return a > b
    })

  const SorterButtons = () => (
    <div align="center" style={{ marginTop: '10px' }}>
      <Button.Group>
        <Button style={{ cursor: 'default' }} active color="black">
          Sort by:
        </Button>
        {sorterNames.map(sorterName => (
          <Button
            basic={sorter !== sorterName}
            color={sorter === sorterName ? 'blue' : 'black'}
            key={sorterName}
            active={sorter === sorterName}
            onClick={() => handleClick(sorterName)}
            style={{ borderRadius: '1px' }}
            icon={sortDir === 1 ? 'triangle down' : 'triangle up'}
            content={sorterName}
          />
        ))}
      </Button.Group>
    </div>
  )
  // legend and checkboxes, custom legend because highcharts is pita
  const RenderBelowGraph = () => (
    <>
      <div align="center" style={{ margin: '10px' }}>
        <span style={{ border: '1px solid black', padding: '4px' }}>
          <Icon style={{ marginLeft: '10px', color: '#6ab04c' }} name="circle" size="small" /> 3v tahdissa
          <Icon style={{ marginLeft: '10px', color: '#f9ca24' }} name="circle" size="small" /> 4v tahdissa
          <Icon style={{ marginLeft: '10px', color: '#ff7979' }} name="circle" size="small" /> ei tahdissa
          <Icon style={{ marginLeft: '10px', color: '#7f8c8d' }} name="circle" size="small" /> tällä hetkellä peruutettu
        </span>
      </div>
      <div align="center">
        <Checkbox
          label="Include only at least once enrolled students"
          onChange={handleExcludeNonEnrolledToggled}
          checked={excludeNonEnrolled}
        />
        <Checkbox
          style={{ marginLeft: '10px' }}
          label="Include old attainments"
          onChange={handleOldAttainmentToggled}
          checked={includeOldAttainments}
        />
      </div>
      <Message>
        <ReactMarkdown source={CoolDataScience.protoC} escapeHtml={false} />
      </Message>
    </>
  )

  if (!!programme && drilldownProgramme) {
    return (
      <Segment>
        <SorterButtons />
        <StudytrackDrilldown programme={drilldownProgramme} sorter={sorter} sortDir={sortDir} />
        <RenderBelowGraph />
      </Segment>
    )
  }

  return (
    <Segment>
      <div align="center">
        <h2>Prototyyppi: Suhteellinen tavoiteaikaerittely, 2017-2019 aloittaneet</h2>
      </div>
      <SorterButtons />
      <Segment placeholder={isLoading} vertical>
        <Dimmer inverted active={isLoading} />
        <Loader active={isLoading} />
        {!isLoading && data && <OrgChart orgs={sortedOrgs} onOrgClicked={handleOrgClicked} />}
        {!isLoading && data && drilldownOrg && (
          <ProgrammeDrilldown
            org={drilldownOrg}
            sorter={sorter}
            sortDir={sortDir}
            onProgrammeClicked={handleProgrammeClicked}
          />
        )}
        {!isLoading && data && drilldownProgramme && (
          <StudytrackDrilldown programme={drilldownProgramme} sorter={sorter} sortDir={sortDir} />
        )}
      </Segment>
      <RenderBelowGraph />
    </Segment>
  )
}

export default ProtoC
