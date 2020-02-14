import React, { useEffect, useState, useCallback } from 'react'
import { Dropdown, Loader, Dimmer, Segment, Form } from 'semantic-ui-react'
import ReactHighcharts from 'react-highcharts'
import Highcharts from 'highcharts'
import HighchartsVariablePie from 'highcharts/modules/variable-pie'
import HighchartsDrilldown from 'highcharts/modules/drilldown'
import { callApi } from '../../apiConnection'

HighchartsVariablePie(Highcharts)
HighchartsDrilldown(Highcharts)

const COLORS = [
  '#636e72',
  '#a29bfe',
  '#ffeaa7',
  '#fd79a8',
  '#0984e3',
  '#74b9ff',
  '#ff7675',
  '#55efc4',
  '#fab1a0',
  '#81ecec',
  '#00cec9',
  '#00b894',
  '#fd79a8',
  '#6c5ce7',
  '#fdcb6e',
  '#e17055',
  '#d63031',
  '#e84393',
  '#2d3436'
]

const sortOpts = [
  { key: 0, text: 'by relative 3y target count', value: 'targetRelative' },
  { key: 1, text: 'by 3y target count', value: 'target' },
  { key: 2, text: 'by total count', value: 'total' }
]

const ProtoF = () => {
  const [startOptions, setStartOptions] = useState([])
  const [selectedStartYear, setSelectedStartYear] = useState(null)
  const [selectedSort, setSelectedSort] = useState('target')
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [nameToColorIndex, setNameToColorIndex] = useState({})

  useEffect(() => {
    callApi('/cool-data-science/start-years').then(res => {
      setStartOptions(res.data.map((date, i) => ({ key: i, text: new Date(date).getFullYear(), value: date })))
      setSelectedStartYear(res.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedStartYear) {
      return
    }

    setDataLoading(true)
    callApi('/cool-data-science/3y-students', 'get', null, { sort: selectedSort, startDate: selectedStartYear }).then(
      res => {
        const sortedByName = [...res.data].sort((a, b) => a.name.localeCompare(b.name))
        if (!setNameToColorIndex) {
          setNameToColorIndex(
            sortedByName.reduce((acc, val, i) => {
              acc[val.name] = i
              return acc
            }, {})
          )
        } else {
          const newMapper = { ...nameToColorIndex }
          for (let i = 0; i < sortedByName.length; i++) {
            const tdk = sortedByName[i]

            if (typeof newMapper[tdk.name] === 'undefined') {
              newMapper[tdk.name] = Object.keys(newMapper).length
            }
          }
          setNameToColorIndex(newMapper)
        }
        setData(res.data)
        setDataLoading(false)
      }
    )
  }, [selectedStartYear, selectedSort])

  const handleYearChanged = useCallback((e, { value }) => {
    setSelectedStartYear(value)
  }, [])
  const handleSortChanged = useCallback((e, { value }) => {
    setSelectedSort(value)
  }, [])
  const handleSubmit = useCallback(e => {
    e.preventDefault()
  }, [])

  return (
    <Segment>
      <h3>Proto F</h3>
      <h4>3v tahdissa</h4>
      <Form onSubmit={handleSubmit}>
        <Form.Group inline>
          <Form.Field>
            <label>Start year</label>
            <Dropdown
              onChange={handleYearChanged}
              options={startOptions}
              placholder="Choose year"
              selection
              value={selectedStartYear}
            />
          </Form.Field>

          <Form.Field>
            <label>Sort</label>
            <Dropdown
              onChange={handleSortChanged}
              options={sortOpts}
              placeholder="Choose sort"
              selection
              value={selectedSort}
            />
          </Form.Field>
        </Form.Group>
      </Form>

      <Segment padded>
        <Dimmer active={!data && dataLoading} />
        <Loader inverted active={dataLoading} />

        {data && (
          <ReactHighcharts
            highcharts={Highcharts}
            config={{
              credits: {
                text: 'oodikone | TOSKA'
              },
              chart: {
                type: 'variablepie',
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
              },
              title: {
                text: `${new Date(selectedStartYear).getFullYear()}`,
                align: 'center',
                verticalAlign: 'top'
              },
              tooltip: {
                pointFormat:
                  '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b>: <b>{point.y}</b> tavoiteajassa olevista)<br/>Yhteensä aloittaneita: {point.z}<br/>'
              },
              plotOptions: {
                variablepie: {
                  startAngle: -90,
                  endAngle: 90,
                  center: ['50%', '75%'],
                  size: '110%',
                  dataLabels: {
                    formatter() {
                      // eslint-disable-next-line
                      return `${this.point.name.replace(' tiedekunta', '')}`
                    }
                  }
                }
              },
              colors: COLORS,
              series: [
                {
                  minPointsize: 10,
                  zMin: 0,
                  name: '3V tavoite-ajassa',
                  innerSize: '30%',
                  data: data.map(({ code, name, totalStudents, targetStudents }) => ({
                    drilldown: `drilldown-${code}`,
                    color: COLORS[nameToColorIndex[name]],
                    name,
                    z: totalStudents,
                    y: targetStudents / totalStudents
                  }))
                }
              ],
              drilldown: {
                series: data.map(org => {
                  return {
                    id: `drilldown-${org.code}`,
                    minPointSize: 10,
                    zMin: 0,
                    name: `3V tavoite-ajassa, ${org.name.replace(' tiedekunta', '')}`,
                    innerSize: '60%',
                    data: org.programmes.map(({ name, totalStudents, targetStudents }) => ({
                      name,
                      z: totalStudents,
                      y: targetStudents / totalStudents
                    }))
                  }
                })
              }
            }}
          />
        )}
      </Segment>
    </Segment>
  )
}

export default ProtoF
