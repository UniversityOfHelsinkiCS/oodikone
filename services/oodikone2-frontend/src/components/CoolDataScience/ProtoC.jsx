/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Table, Form, Dropdown } from 'semantic-ui-react'
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
      followPointer: true
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: true
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
      color: '#6ab04c',
      name: '3v tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.students3y
      }))
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.students4y
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: sortedOrgs.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.totalStudents - org.students3y - org.students4y
      }))
    }
  ].map(addPointClickHandler)

  return Highcharts.merge(defaultConfig(), {
    title: {
      text: '2017-2019 aloittaneet uudet kandiopiskelijat'
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
      color: '#6ab04c',
      name: '3v tahdissa',
      data: org.programmes.map(p => ({
        y: p.students3y
      }))
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: org.programmes.map(p => ({
        y: p.students4y
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: org.programmes.map(p => ({
        y: p.totalStudents - p.students3y - p.students4y
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

const countNotInTarget = org => org.totalStudents - org.students4y - org.students3y
const sorters = {
  nimi: (a, b) => a.name.localeCompare(b.name),
  '4y tahti': (a, b) => a.students4y / a.totalStudents - b.students4y / b.totalStudents,
  '3y tahti': (a, b) => a.students3y / a.totalStudents - b.students3y / b.totalStudents,
  'ei tahdissa': (a, b) => countNotInTarget(a) / a.totalStudents - countNotInTarget(b) / b.totalStudents
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
  const [sorter, setSorter] = useState('3y tahti')
  const [sortDir, setSortDir] = useState(1)

  const [drilldownOrg, setDrilldownOrg] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await callApi('/cool-data-science/proto-c-data')
      setData(res.data)
      setLoading(false)
    }

    load()
  }, [])

  const handleOrgClicked = useCallback(org => {
    setDrilldownOrg(org)
  }, [])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort((a, b) => sorters[sorter](a, b) * sortDir)
  }, [data, sorter, sortDir])

  return (
    <Segment>
      <h3>Proto C</h3>

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
