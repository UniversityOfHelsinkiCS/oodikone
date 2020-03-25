import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Checkbox } from 'semantic-ui-react'

import { callApi } from '../../apiConnection'

const defaultConfig = () => {
  return {
    chart: {
      type: 'column'
    },
    credits: {
      text: 'oodikone | TOSKA'
    },
    title: {
      text: '',
      style: {
        display: 'none'
      }
    },

    yAxis: {
      min: 0,
      title: {
        text: 'Tavoiteajassa'
      },
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'bold',
          color:
            // theme
            (Highcharts.defaultOptions.title.style && Highcharts.defaultOptions.title.style.color) || 'gray'
        }
      }
    },
    legend: {
      align: 'right',
      x: -30,
      verticalAlign: 'top',
      y: 25,
      floating: true,
      backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false
    },
    tooltip: {
      shared: true,
      pointFormatter() {
        return `<span style="color:${this.color}">●</span> ${this.series.name}: <b>${this.y}</b> (${(
          this.z * 100
        ).toFixed(1)}%)<br/>`
      }
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        dataLabels: {
          enabled: true
        }
      }
    }
  }
}

const changeSeries = (chart, categories, series) => {
  chart.showLoading()

  chart.xAxis[0].setCategories(categories)
  while (chart.series.length > 0) {
    chart.series[0].remove(false)
  }

  series.forEach(serie => chart.addSeries(serie, false))

  chart.redraw()
  chart.hideLoading()
}

const makeConfig = (organisations, sorter, type = 'column') => {
  const orgSeries = [
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: organisations.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.totalStudents - org.students3y - org.students4y,
        // pass % of total as z so we can display it in the tooltip
        z: (org.totalStudents - org.students3y - org.students4y) / org.totalStudents
      }))
    },
    {
      color: '#f9ca24',
      name: '4v tahdissa',
      data: organisations.map(org => ({
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
      data: organisations.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.students3y,
        z: org.students3y / org.totalStudents
      }))
    }
  ]

  const orgCategories = organisations.map(org => org.name)

  return Highcharts.merge(defaultConfig(), {
    chart: {
      type
    },
    xAxis: {
      categories: orgCategories
    },
    series: orgSeries,
    plotOptions: {
      series: {
        cursor: 'pointer',
        point: {
          events: {
            click(e) {
              const { point } = e
              const { chart } = this.series

              if (point.custom && point.custom.orgCode) {
                // clicked on top-level, drill down
                const org = organisations.find(org => org.code === point.custom.orgCode)
                const programmes = [...org.programmes].sort(sorter)
                changeSeries(chart, programmes.map(p => p.name), [
                  {
                    color: '#ff7979',
                    name: 'ei tahdissa',
                    data: programmes.map(p => ({
                      y: p.totalStudents - p.students3y - p.students4y,
                      // pass % of total as z so we can display it in the tooltip
                      z: (p.totalStudents - p.students3y - p.students4y) / p.totalStudents
                    }))
                  },
                  {
                    color: '#f9ca24',
                    name: '4v tahdissa',
                    data: programmes.map(p => ({
                      y: p.students4y,
                      z: p.students4y / p.totalStudents
                    }))
                  },
                  {
                    color: '#6ab04c',
                    name: '3v tahdissa',
                    data: programmes.map(p => ({
                      y: p.students3y,
                      z: p.students3y / p.totalStudents
                    }))
                  }
                ])
              } else {
                // drill up
                changeSeries(chart, orgCategories, orgSeries)
              }
            }
          }
        }
      }
    }
  })
}

const countNotInTarget = org => org.totalStudents - org.students4y - org.students3y
const sorters = {
  nimi: (a, b) => a.name.localeCompare(b.name),
  '4v tahti': (a, b) => a.students4y - b.students4y,
  '3v tahti': (a, b) => a.students3y - b.students3y,
  'ei tahdissa': (a, b) => countNotInTarget(a) - countNotInTarget(b)
}

const OrgChart = React.memo(({ orgs, sorter, isSideways }) => {
  return <ReactHighcharts highcharts={Highcharts} config={makeConfig(orgs, sorter, isSideways ? 'bar' : 'column')} />
})

OrgChart.defaultProps = {
  isSideways: false
}

OrgChart.propTypes = {
  orgs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      code: PropTypes.string,
      students3y: PropTypes.number,
      students4y: PropTypes.number,
      totalStudents: PropTypes.number,
      programmes: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          students3y: PropTypes.number,
          students4y: PropTypes.number,
          totalStudents: PropTypes.number
        })
      ).isRequired
    })
  ).isRequired,
  sorter: PropTypes.func.isRequired,
  isSideways: PropTypes.bool
}

const ProtoC = () => {
  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [sorter, setSorter] = useState('3v tahti')
  const [sortDir, setSortDir] = useState(1)

  const [includeOldAttainments, setIncludeOldAttainments] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await callApi(
        '/cool-data-science/proto-c-data',
        'get',
        null,
        includeOldAttainments ? { include_old_attainments: 'true' } : undefined
      )
      setData(res.data)
      setLoading(false)
    }

    load()
  }, [includeOldAttainments])

  const handleOldAttainmentToggled = useCallback(() => {
    setIncludeOldAttainments(previous => !previous)
  }, [])

  const currentSorter = useCallback((a, b) => sorters[sorter](a, b) * sortDir, [sorter, sortDir])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort(currentSorter)
  }, [data, currentSorter])

  return (
    <Segment>
      <div style={{ display: 'flex' }}>
        <h3>Prototyyppi: Tavoiteaikaerittely, 2017-2019 aloittaneet</h3>
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
            <OrgChart orgs={sortedOrgs} sorter={currentSorter} />
            <hr />
            <OrgChart orgs={sortedOrgs} sorter={currentSorter} isSideways />
          </>
        )}
      </Segment>
    </Segment>
  )
}

export default ProtoC
