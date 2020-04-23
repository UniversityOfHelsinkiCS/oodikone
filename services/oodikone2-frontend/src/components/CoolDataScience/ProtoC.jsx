/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Checkbox, Button, Message, Icon } from 'semantic-ui-react'
import _ from 'lodash'
import ReactMarkdown from 'react-markdown'

import { callApi } from '../../apiConnection'
import InfoToolTips from '../../common/InfoToolTips'

const defaultConfig = () => {
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

const makeConfig = (sortedOrgs, onOrgClicked) => {
  const addPointClickHandler = serie => {
    serie.point = {
      events: {
        click: e => {
          const clickedOrg = sortedOrgs.find(org => e.point && e.point.custom && org.code === e.point.custom.orgCode)
          if (clickedOrg) {
            // use setImmediate so the click handler can finish
            // before datamangels begins so that the browser is responsive
            setImmediate(() => onOrgClicked(clickedOrg))
            e.point.update()
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
      data: sortedOrgs.map(org => ({
        y: org.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: org.currentlyCancelled / org.totalStudents
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.totalStudents - org.students3y - org.students4y - org.currentlyCancelled,
        z: (org.totalStudents - org.students3y - org.students4y - org.currentlyCancelled) / org.totalStudents
      }))
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.students4y,
        z: org.students4y / org.totalStudents
      }))
    },
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.students3y,
        z: org.students3y / org.totalStudents
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
      categories: sortedOrgs.map(org => org.name)
    },
    yAxis: {
      title: {
        text: '% tiedekunnan opiskelijoista'
      }
    },
    series
  })
}

const makeDrilldownConfig = org => {
  const series = [
    {
      color: '#7f8c8d',
      name: 'tällä hetkellä peruutettu',
      data: org.programmes.map(p => ({
        y: p.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: p.currentlyCancelled / p.totalStudents
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: org.programmes.map(p => ({
        y: p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled,
        z: (p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled) / p.totalStudents
      }))
    },

    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: org.programmes.map(p => ({
        y: p.students4y,
        z: p.students4y / p.totalStudents
      }))
    },
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: org.programmes.map(p => ({
        y: p.students3y,
        z: p.students3y / p.totalStudents
      }))
    }
  ]

  return Highcharts.merge(defaultConfig(), {
    title: {
      text: `2017-2019 aloittaneet uudet kandiopiskelijat<br/>${org.name}`
    },
    xAxis: {
      categories: org.programmes.map(p => p.name)
    },
    yAxis: {
      title: {
        text: '% ohjelman opiskelijoista'
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
  return <ReactHighcharts highcharts={Highcharts} config={makeConfig(orgs, onOrgClicked)} />
})

const ProgrammeChart = React.memo(({ org }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeDrilldownConfig(org)} />
})

const ProgrammeDrilldown = ({ org, sorter, sortDir }) => {
  const orgSortedProgrammes = useMemo(() => {
    return { ...org, programmes: [...org.programmes].sort((a, b) => sorters[sorter](a, b) * sortDir) }
  }, [org, sorter, sortDir])

  return <ProgrammeChart org={orgSortedProgrammes} />
}

const ProtoC = () => {
  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [sorter, setSorter] = useState('3v tahti')
  const [sortDir, setSortDir] = useState(1)
  const [drilldownOrg, setDrilldownOrg] = useState(null)

  const [includeOldAttainments, setIncludeOldAttainments] = useState(false)
  const [excludeNonEnrolled, setExcludeNonEnrolled] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await callApi('/cool-data-science/proto-c-data', 'get', null, {
        include_old_attainments: includeOldAttainments.toString(),
        exclude_non_enrolled: excludeNonEnrolled.toString()
      })
      setData(res.data)
      setLoading(false)
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
  }, [])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort((a, b) => sorters[sorter](a, b) * sortDir)
  }, [data, sorter, sortDir])

  const handleClick = sorterName => {
    if (sorterName === sorter) setSortDir(-1 * sortDir)
    setSorter(sorterName)
  }

  const { CoolDataScience } = InfoToolTips

  const sorterNames = Object.keys(sorters)
    .map(sorterName => sorterName)
    .sort((a, b) => {
      if (a === 'nimi') return false
      return a > b
    })
  return (
    <Segment>
      <div align="center">
        <h2>Prototyyppi: Suhteellinen tavoiteaikaerittely, 2017-2019 aloittaneet</h2>
      </div>
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
      <Segment placeholder={isLoading} vertical>
        <Dimmer inverted active={isLoading} />
        <Loader active={isLoading} />
        {!isLoading && data && <OrgChart orgs={sortedOrgs} onOrgClicked={handleOrgClicked} />}
        {!isLoading && data && drilldownOrg && (
          <ProgrammeDrilldown org={drilldownOrg} sorter={sorter} sortDir={sortDir} />
        )}
        <div align="center" style={{ margin: '10px' }}>
          <span style={{ border: '1px solid black', padding: '4px' }}>
            <Icon style={{ marginLeft: '10px', color: '#6ab04c' }} name="circle" size="small" /> 3v tahdissa
            <Icon style={{ marginLeft: '10px', color: '#f9ca24' }} name="circle" size="small" /> 4v tahdissa
            <Icon style={{ marginLeft: '10px', color: '#ff7979' }} name="circle" size="small" /> ei tahdissa
            <Icon style={{ marginLeft: '10px', color: '#7f8c8d' }} name="circle" size="small" /> tällä hetkellä
            peruutettu
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
      </Segment>
      <Message>
        <ReactMarkdown source={CoolDataScience.protoC} escapeHtml={false} />
      </Message>
    </Segment>
  )
}

export default ProtoC
