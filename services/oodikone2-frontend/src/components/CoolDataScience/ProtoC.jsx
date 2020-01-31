import React, { useState } from 'react'
import Highcharts from 'highcharts'
import ReactHighcharts from 'react-highcharts'
import _ from 'lodash'

const makeProtoCConfig = (facultyNames, series) => ({
  chart: {
    type: 'area',
    inverted: true
  },
  credits: {
    text: 'oodikone | TOSKA'
  },
  title: {
    text: '2017-2019 aloittaneet uudet kandiopiskelijat'
  },
  accessibility: {
    keyboardNavigation: {
      seriesNavigation: {
        mode: 'serialize'
      }
    }
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'top',
    x: -150,
    y: 100,
    floating: true,
    borderWidth: 1,
    backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
  },
  xAxis: {
    categories: facultyNames
  },
  yAxis: {
    title: {
      text: '% tiedekunnan opiskelijoista'
    },
    allowDecimals: false,
    min: 0
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
          return `${point.index + 1}, ${point.category}, ${point.y}, ${round(point.percentage)}%, ${point.series.name}`
        }
      }
    }
  },
  series
})

const ProtoC = ({ rawData }) => {
  const count3yAmount = facultyName => {
    return rawData.ebin.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
  }

  const countInclusive4yAmount = facultyName =>
    rawData.ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)

  const countExclusive4yAmount = facultyName => {
    // not including 3y rate students
    const ebinAmount = count3yAmount(facultyName)
    return rawData.ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0) - ebinAmount
  }

  const countTrashAmount = facultyName => {
    return rawData.not_ok.filter(r => r[1] === facultyName).reduce((a, b) => a + b[3], 0)
  }

  const totalAmount = facultyName => countTrashAmount(facultyName) + countInclusive4yAmount(facultyName)

  const sorters = [
    {
      name: '4y tahti',
      fn: (a, b) => countExclusive4yAmount(a) / totalAmount(a) - countExclusive4yAmount(b) / totalAmount(b)
    },
    {
      name: '3y tahti',
      fn: (a, b) => count3yAmount(a) / totalAmount(a) - count3yAmount(b) / totalAmount(b)
    },
    {
      name: 'ei tahdissa',
      fn: (a, b) => countTrashAmount(a) / totalAmount(a) - countTrashAmount(b) / totalAmount(b)
    }
  ]

  const [ascDesc, setAscDesc] = useState(1) // -1 for desc
  const [sorter, setSorter] = useState(sorters[0])

  const facultyNames = _([...rawData.ebin, ...rawData.ok, ...rawData.not_ok])
    .map(e => e[1])
    .uniq()
    .sort((a, b) => sorter.fn(a, b) * ascDesc)
    .value()

  const series = [
    {
      color: '#6ab04c',
      name: '3v tahdissa',
      data: _(facultyNames)
        .map(count3yAmount)
        .value()
    },
    {
      name: '4v tahdissa',
      data: _(facultyNames)
        .map(countExclusive4yAmount)
        .value(),
      color: '#f9ca24'
    },

    {
      color: '#ff7979',
      name: 'ei tahdissa',
      data: _(facultyNames)
        .map(countTrashAmount)
        .value()
    }
  ]

  const configNames = facultyNames
  const config = makeProtoCConfig(configNames, series)

  return (
    <div>
      <div>
        Sort:{' '}
        {sorters.map(sorterOption => (
          <button
            type="button"
            key={sorterOption.name}
            disabled={sorter.name === sorterOption.name}
            onClick={() => setSorter(sorterOption)}
          >
            {sorterOption.name}
          </button>
        ))}
      </div>
      <div>
        <input type="button" value="ASC" onClick={() => setAscDesc(1)} disabled={ascDesc === 1} />
        <input type="button" value="DESC" onClick={() => setAscDesc(-1)} disabled={ascDesc === -1} />
      </div>
      <ReactHighcharts highcharts={Highcharts} config={config} />
    </div>
  )
}

export default ProtoC
