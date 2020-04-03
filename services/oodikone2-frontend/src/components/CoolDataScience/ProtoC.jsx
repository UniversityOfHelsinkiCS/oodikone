/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Checkbox } from 'semantic-ui-react'
import _ from 'lodash'

import { callApi } from '../../apiConnection'

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
      layout: 'horizontal',
      borderWidth: 1,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
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
          const clickedOrg = sortedOrgs.find(org => org.code === e.point.custom.orgCode)
          if (clickedOrg) {
            // use setImmediate so the click handler can finish
            // before datamangels begins so that the browser is responsive
            setImmediate(() => onOrgClicked(clickedOrg))
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
      data: orgprogrammes.map(p => ({
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
  'ei tahdissa': (a, b) => countNotInTarget(a) / a.totalStudents - countNotInTarget(b) / b.totalStudents,
  peruutettu: (a, b) => a.currentlyCancelled / a.totalStudents - b.currentlyCancelled / b.totalStudents
}

const OrgChart = React.memo(({ orgs, onOrgClicked }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeConfig(orgs, onOrgClicked)} />
})

const ProgrammeChart = React.memo(({ org }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeDrilldownConfig(org)} />
})

const ProgrammeDrilldown = ({ org, defaultSorter, defaultSortDir }) => {
  const [sorter, setSorter] = useState(defaultSorter)
  const [sortDir, setSortDir] = useState(defaultSortDir)

  const orgSortedProgrammes = useMemo(() => {
    return { ...org, programmes: [...org.programmes].sort((a, b) => sorters[sorter](a, b) * sortDir) }
  }, [org, sorter, sortDir])

  return (
    <>
      <div>
        Sort:{' '}
        {Object.keys(sorters).map(sorterName => (
          <button type="button" key={sorterName} disabled={sorter === sorterName} onClick={() => setSorter(sorterName)}>
            {sorterName}
          </button>
        ))}
      </div>
      <div>
        Order: <input type="button" value="↓" onClick={() => setSortDir(1)} disabled={sortDir === 1} />
        <input type="button" value="↑" onClick={() => setSortDir(-1)} disabled={sortDir === -1} />
      </div>

      <ProgrammeChart org={orgSortedProgrammes} />
    </>
  )
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

  return (
    <Segment>
      <div style={{ display: 'flex' }}>
        <h3>Prototyyppi: Suhteellinen tavoiteaikaerittely, 2017-2019 aloittaneet</h3>
        <Checkbox
          style={{ marginLeft: 'auto' }}
          label="Include only at least once enrolled students"
          onChange={handleExcludeNonEnrolledToggled}
          checked={excludeNonEnrolled}
        />
        <Checkbox
          style={{ marginLeft: 'auto' }}
          label="Include old attainments"
          onChange={handleOldAttainmentToggled}
          checked={includeOldAttainments}
        />
      </div>

      <div>
        Sort:{' '}
        {Object.keys(sorters).map(sorterName => (
          <button type="button" key={sorterName} disabled={sorter === sorterName} onClick={() => setSorter(sorterName)}>
            {sorterName}
          </button>
        ))}
      </div>
      <div>
        Order: <input type="button" value="↓" onClick={() => setSortDir(1)} disabled={sortDir === 1} />
        <input type="button" value="↑" onClick={() => setSortDir(-1)} disabled={sortDir === -1} />
      </div>

      <Segment placeholder={isLoading} vertical>
        <Dimmer inverted active={isLoading} />
        <Loader active={isLoading} />
        {!isLoading && data && (
          <>
            <OrgChart orgs={sortedOrgs} onOrgClicked={handleOrgClicked} />
            {drilldownOrg && <ProgrammeDrilldown org={drilldownOrg} defaultSorter={sorter} defaultSortDir={sortDir} />}
          </>
        )}
      </Segment>
    </Segment>
  )
}

export default ProtoC
