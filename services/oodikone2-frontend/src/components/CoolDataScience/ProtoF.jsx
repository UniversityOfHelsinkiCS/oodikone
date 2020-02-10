import React, { useEffect, useState, useCallback } from 'react'
import { Dropdown, Loader, Dimmer, Segment } from 'semantic-ui-react'
import ReactHighcharts from 'react-highcharts'
import Highcharts from 'highcharts'
import HighchartsVariablePie from 'highcharts/modules/variable-pie'
import { callApi } from '../../apiConnection'

HighchartsVariablePie(Highcharts)

const COLORS = [
  /* '#1abc9c',
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#34495e',
    '#f1c40f',
    '#e67e22',
    '#e74c3c',
    '#16a085',
    '#27ae60',
    '#2980b9',
    '#8e44ad',
    '#f39c12',
    '#d35400',
    '#c0392b' */
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

const ProtoF = () => {
  const [startOptions, setStartOptions] = useState([])
  const [selectedStartYear, setSelectedStartYear] = useState(null)
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
    callApi('/cool-data-science/3y-students', 'get', null, { startDate: selectedStartYear }).then(res => {
      const sortedByName = res.data.sort((a, b) => a.orgName.localeCompare(b.orgName))
      if (!setNameToColorIndex) {
        setNameToColorIndex(
          sortedByName.reduce((acc, val, i) => {
            acc[val.orgName] = i
            return acc
          }, {})
        )
      } else {
        const newMapper = { ...nameToColorIndex }
        for (let i = 0; i < sortedByName.length; i++) {
          const tdk = sortedByName[i]

          if (typeof newMapper[tdk.orgName] === 'undefined') {
            newMapper[tdk.orgName] = Object.keys(newMapper).length
          }
        }
        setNameToColorIndex(newMapper)
      }
      setData(res.data.sort((a, b) => parseInt(a.targetStudents, 10) - parseInt(b.targetStudents, 10)))
      setDataLoading(false)
    })
  }, [selectedStartYear])

  const handleYearChanged = useCallback((e, { value }) => {
    setSelectedStartYear(value)
  }, [])

  return (
    <Segment>
      <h3>Proto F</h3>
      <h4>3v tahdissa</h4>
      <Dropdown
        onChange={handleYearChanged}
        options={startOptions}
        placholder="Choose year"
        selection
        value={selectedStartYear}
      />

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
                  '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b>: <b>{point.y}</b> ({point.percentage:.1f}% HY:stä)<br/>Yhteensä aloittaneita: {point.z}<br/>'
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
              series: [
                {
                  minPointsize: 10,
                  zMin: 0,
                  name: '3V tavoite-ajassa',
                  innerSize: '40%',
                  data: data.map(({ orgCode, orgName, orgTotalStudents, targetStudents }) => ({
                    id: orgCode,
                    color: COLORS[nameToColorIndex[orgName]],
                    name: orgName,
                    z: parseInt(orgTotalStudents, 10),
                    y: parseInt(targetStudents, 10)
                  }))
                }
              ]
            }}
          />
        )}
      </Segment>
    </Segment>
  )
}

export default ProtoF
