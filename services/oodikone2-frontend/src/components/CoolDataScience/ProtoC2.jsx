import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import { Segment, Loader, Dimmer, Checkbox, Button, Message } from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'
import HighchartsCustomEvents from 'highcharts-custom-events'

import { callApi } from '../../apiConnection'
import InfoToolTips from '../../common/InfoToolTips'

HighchartsCustomEvents(Highcharts)

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
              fontWeight: 'bold'
            })
          }
        },
        mouseOut() {
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

  const orgSeries = [
    {
      color: '#7f8c8d',
      name: 'tällä hetkellä peruutettu',
      data: organisations.map(org => ({
        y: org.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: org.currentlyCancelled / org.totalStudents
      }))
    },
    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: organisations.map(org => ({
        custom: {
          orgCode: org.code
        },
        y: org.totalStudents - org.students3y - org.students4y - org.currentlyCancelled,
        // pass % of total as z so we can display it in the tooltip
        z: (org.totalStudents - org.students3y - org.students4y - org.currentlyCancelled) / org.totalStudents
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
  ].map(addMouseOverHandler)

  const orgCategories = organisations.map(org => org.name)

  return Highcharts.merge(defaultConfig(), {
    chart: {
      type
    },
    xAxis: {
      categories: orgCategories,
      labels: {
        events: {
          click() {
            const { chart } = this
            chart.myLabel.destroy()
            const clickedLabel = organisations.find(data => data.name === this.value)
            if (clickedLabel) {
              // clicked on top-level, drill down
              const programmes = [...clickedLabel.programmes].sort(sorter)
              changeSeries(
                chart,
                programmes.map(p => p.name),
                [
                  {
                    color: '#7f8c8d',
                    name: 'tällä hetkellä peruutettu',
                    data: programmes.map(p => ({
                      y: p.currentlyCancelled,
                      // pass % of total as z so we can display it in the tooltip
                      z: p.currentlyCancelled / p.totalStudents
                    }))
                  },
                  {
                    color: '#ff7979',
                    name: 'ei tahdissa',
                    data: programmes.map(p => ({
                      y: p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled,
                      // pass % of total as z so we can display it in the tooltip
                      z: (p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled) / p.totalStudents
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
                ].map(addMouseOverHandler)
              )
            } else {
              // drill up
              changeSeries(chart, orgCategories, orgSeries)
            }
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
              acc = `${acc} <span style="color:${curr.color}">●</span> ${curr.name}: <b>${curr.data[tick.pos].y}</b> (${percentage}%)<br/>`
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
          mouseout() {
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
                changeSeries(
                  chart,
                  programmes.map(p => p.name),
                  [
                    {
                      color: '#7f8c8d',
                      name: 'tällä hetkellä peruutettu',
                      data: programmes.map(p => ({
                        y: p.currentlyCancelled,
                        // pass % of total as z so we can display it in the tooltip
                        z: p.currentlyCancelled / p.totalStudents
                      }))
                    },
                    {
                      color: '#ff7979',
                      name: 'ei tahdissa',
                      data: programmes.map(p => ({
                        y: p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled,
                        // pass % of total as z so we can display it in the tooltip
                        z: (p.totalStudents - p.students3y - p.students4y - p.currentlyCancelled) / p.totalStudents
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
                  ].map(addMouseOverHandler)
                )
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

const countNotInTarget = org => org.totalStudents - org.students4y - org.students3y - org.currentlyCancelled
const sorters = {
  nimi: (a, b) => a.name.localeCompare(b.name),
  '4v tahti': (a, b) => a.students4y - b.students4y,
  '3v tahti': (a, b) => a.students3y - b.students3y,
  'ei tahdissa': (a, b) => countNotInTarget(a) + a.currentlyCancelled - (countNotInTarget(b) + b.currentlyCancelled),
  peruutettu: (a, b) => a.currentlyCancelled - b.currentlyCancelled
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
      currentlyCancelled: PropTypes.number,
      programmes: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          students3y: PropTypes.number,
          students4y: PropTypes.number,
          totalStudents: PropTypes.number,
          currentlyCancelled: PropTypes.number
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

  const currentSorter = useCallback((a, b) => sorters[sorter](a, b) * sortDir, [sorter, sortDir])

  const sortedOrgs = useMemo(() => {
    return Object.values(data || {}).sort(currentSorter)
  }, [data, currentSorter])

  const { CoolDataScience } = InfoToolTips

  const handleClick = sorterName => {
    if (sorterName === sorter) setSortDir(-1 * sortDir)
    setSorter(sorterName)
  }

  const sorterNames = Object.keys(sorters)
    .map(sorterName => sorterName)
    .sort((a, b) => {
      if (a === 'nimi') return false
      return a > b
    })

  return (
    <Segment>
      <div align="center">
        <h2>Prototyyppi: Tavoiteaikaerittely, 2017-2019 aloittaneet</h2>
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
        {!isLoading && data && (
          <>
            <OrgChart orgs={sortedOrgs} sorter={currentSorter} isSideways />
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
            label="Include old attainments"
            onChange={handleOldAttainmentToggled}
            checked={includeOldAttainments}
          />
        </div>
        <Message>
          <ReactMarkdown source={CoolDataScience.protoC2} escapeHtml={false} />
        </Message>
      </Segment>
    </Segment>
  )
}

export default ProtoC
