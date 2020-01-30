import React, { useState } from 'react'
import ReactHighcharts from 'react-highcharts'
import Highcharts from 'highcharts'
import HighchartsSankey from 'highcharts/modules/sankey'
import _ from 'lodash'
import './CoolDataScience.css'

HighchartsSankey(Highcharts)

const config1 = {
  title: {
    text: 'Testbox'
  },
  series: [
    {
      keys: ['from', 'to', 'weight'],
      data: [
        ['2017 aloittaneita', '1. vuosi: yli 55 op', 282],
        ['2017 aloittaneita', '1. vuosi: 40-54 op', 102],
        ['2017 aloittaneita', '1. vuosi: 1-40 op', 155],
        ['2017 aloittaneita', '1. vuosi: 0 op', 115],
        ['1. vuosi: yli 55 op', 'Valmistuneita', 22],
        ['1. vuosi: 40-54 op', 'Valmistuneita', 1],
        ['1. vuosi: 1-40 op', 'Valmistuneita', 0],
        ['1. vuosi: 0 op', 'Valmistuneita', 0],
        ['1. vuosi: yli 55 op', 'Peruutettuja', 11],
        ['1. vuosi: 40-54 op', 'Peruutettuja', 13],
        ['1. vuosi: 1-40 op', 'Peruutettuja', 41],
        ['1. vuosi: 0 op', 'Peruutettuja', 35]
      ],
      type: 'sankey'
    }
  ]
}

const config2 = {
  title: {
    text: 'Testbox'
  },
  series: [
    {
      keys: ['from', 'to', 'weight'],
      data: [
        // 2029
        ['Matemaattis-luonnontieteellinen', 'Tavoitetahdissa', 689],
        // 1599
        ['Kasvatustieteellinen', 'Tavoitetahdissa', 625],
        // 229
        ['Lääketieteellinen', 'Tavoitetahdissa', 122],

        ['Matemaattis-luonnontieteellinen', 'Ei tavoitetahdissa', 1344],
        ['Kasvatustieteellinen', 'Ei tavoitetahdissa', 976],
        ['Lääketieteellinen', 'Ei tavoitetahdissa', 107],

        ['Tavoitetahdissa', 'Valmistuneita', 8 + 15 + 29],
        ['Ei tavoitetahdissa', 'Valmistuneita', 0],

        ['Tavoitetahdissa', 'Peruutettuja', 1 + 20 + 70],
        ['Ei tavoitetahdissa', 'Peruutettuja', 42 + 163]
      ],
      type: 'sankey'
    }
  ]
}

const raw_data = {
  ebin: [
    ['H10', 'Teologinen tiedekunta', '2017-07-31 21:00:00+00', 34],
    ['H10', 'Teologinen tiedekunta', '2018-07-31 21:00:00+00', 78],
    ['H10', 'Teologinen tiedekunta', '2019-07-31 21:00:00+00', 44],
    ['H20', 'Oikeustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 222],
    ['H20', 'Oikeustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 184],
    ['H20', 'Oikeustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 59],
    ['H30', 'Lääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 48],
    ['H30', 'Lääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 42],
    ['H30', 'Lääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 32],
    ['H40', 'Humanistinen tiedekunta', '2017-07-31 21:00:00+00', 217],
    ['H40', 'Humanistinen tiedekunta', '2018-07-31 21:00:00+00', 248],
    ['H40', 'Humanistinen tiedekunta', '2019-07-31 21:00:00+00', 164],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2017-07-31 21:00:00+00', 164],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2018-07-31 21:00:00+00', 235],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2019-07-31 21:00:00+00', 290],
    ['H55', 'Farmasian tiedekunta', '2017-07-31 21:00:00+00', 138],
    ['H55', 'Farmasian tiedekunta', '2018-07-31 21:00:00+00', 134],
    ['H55', 'Farmasian tiedekunta', '2019-07-31 21:00:00+00', 135],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2017-07-31 21:00:00+00', 84],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2018-07-31 21:00:00+00', 91],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2019-07-31 21:00:00+00', 114],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 194],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 191],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 133],
    ['H70', 'Valtiotieteellinen tiedekunta', '2017-07-31 21:00:00+00', 144],
    ['H70', 'Valtiotieteellinen tiedekunta', '2018-07-31 21:00:00+00', 160],
    ['H70', 'Valtiotieteellinen tiedekunta', '2019-07-31 21:00:00+00', 129],
    ['H74', 'Svenska social- och kommunalhögskolan', '2017-07-31 21:00:00+00', 36],
    ['H74', 'Svenska social- och kommunalhögskolan', '2018-07-31 21:00:00+00', 44],
    ['H74', 'Svenska social- och kommunalhögskolan', '2019-07-31 21:00:00+00', 30],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2017-07-31 21:00:00+00', 133],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2018-07-31 21:00:00+00', 149],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2019-07-31 21:00:00+00', 122],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 42],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 38],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 9]
  ],
  ok: [
    ['H10', 'Teologinen tiedekunta', '2017-07-31 21:00:00+00', 59],
    ['H10', 'Teologinen tiedekunta', '2018-07-31 21:00:00+00', 115],
    ['H10', 'Teologinen tiedekunta', '2019-07-31 21:00:00+00', 128],
    ['H20', 'Oikeustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 246],
    ['H20', 'Oikeustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 229],
    ['H20', 'Oikeustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 184],
    ['H30', 'Lääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 70],
    ['H30', 'Lääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 70],
    ['H30', 'Lääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 68],
    ['H40', 'Humanistinen tiedekunta', '2017-07-31 21:00:00+00', 343],
    ['H40', 'Humanistinen tiedekunta', '2018-07-31 21:00:00+00', 425],
    ['H40', 'Humanistinen tiedekunta', '2019-07-31 21:00:00+00', 434],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2017-07-31 21:00:00+00', 303],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2018-07-31 21:00:00+00', 406],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2019-07-31 21:00:00+00', 551],
    ['H55', 'Farmasian tiedekunta', '2017-07-31 21:00:00+00', 148],
    ['H55', 'Farmasian tiedekunta', '2018-07-31 21:00:00+00', 149],
    ['H55', 'Farmasian tiedekunta', '2019-07-31 21:00:00+00', 162],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2017-07-31 21:00:00+00', 133],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2018-07-31 21:00:00+00', 162],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2019-07-31 21:00:00+00', 189],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 366],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 423],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 478],
    ['H70', 'Valtiotieteellinen tiedekunta', '2017-07-31 21:00:00+00', 217],
    ['H70', 'Valtiotieteellinen tiedekunta', '2018-07-31 21:00:00+00', 235],
    ['H70', 'Valtiotieteellinen tiedekunta', '2019-07-31 21:00:00+00', 265],
    ['H74', 'Svenska social- och kommunalhögskolan', '2017-07-31 21:00:00+00', 69],
    ['H74', 'Svenska social- och kommunalhögskolan', '2018-07-31 21:00:00+00', 82],
    ['H74', 'Svenska social- och kommunalhögskolan', '2019-07-31 21:00:00+00', 101],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2017-07-31 21:00:00+00', 193],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2018-07-31 21:00:00+00', 206],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2019-07-31 21:00:00+00', 222],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 67],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 68],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 61]
  ],
  not_ok: [
    ['H10', 'Teologinen tiedekunta', '2017-07-31 21:00:00+00', 77],
    ['H10', 'Teologinen tiedekunta', '2018-07-31 21:00:00+00', 52],
    ['H10', 'Teologinen tiedekunta', '2019-07-31 21:00:00+00', 41],
    ['H20', 'Oikeustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 25],
    ['H20', 'Oikeustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 26],
    ['H20', 'Oikeustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 64],
    ['H30', 'Lääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 7],
    ['H30', 'Lääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 5],
    ['H30', 'Lääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 9],
    ['H40', 'Humanistinen tiedekunta', '2017-07-31 21:00:00+00', 159],
    ['H40', 'Humanistinen tiedekunta', '2018-07-31 21:00:00+00', 115],
    ['H40', 'Humanistinen tiedekunta', '2019-07-31 21:00:00+00', 130],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2017-07-31 21:00:00+00', 351],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2018-07-31 21:00:00+00', 252],
    ['H50', 'Matemaattis-luonnontieteellinen tiedekunta', '2019-07-31 21:00:00+00', 170],
    ['H55', 'Farmasian tiedekunta', '2017-07-31 21:00:00+00', 23],
    ['H55', 'Farmasian tiedekunta', '2018-07-31 21:00:00+00', 21],
    ['H55', 'Farmasian tiedekunta', '2019-07-31 21:00:00+00', 7],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2017-07-31 21:00:00+00', 58],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2018-07-31 21:00:00+00', 29],
    ['H57', 'Bio- ja ympäristötieteellinen tiedekunta', '2019-07-31 21:00:00+00', 10],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2017-07-31 21:00:00+00', 111],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2018-07-31 21:00:00+00', 103],
    ['H60', 'Kasvatustieteellinen tiedekunta', '2019-07-31 21:00:00+00', 60],
    ['H70', 'Valtiotieteellinen tiedekunta', '2017-07-31 21:00:00+00', 72],
    ['H70', 'Valtiotieteellinen tiedekunta', '2018-07-31 21:00:00+00', 56],
    ['H70', 'Valtiotieteellinen tiedekunta', '2019-07-31 21:00:00+00', 27],
    ['H74', 'Svenska social- och kommunalhögskolan', '2017-07-31 21:00:00+00', 34],
    ['H74', 'Svenska social- och kommunalhögskolan', '2018-07-31 21:00:00+00', 22],
    ['H74', 'Svenska social- och kommunalhögskolan', '2019-07-31 21:00:00+00', 12],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2017-07-31 21:00:00+00', 72],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2018-07-31 21:00:00+00', 68],
    ['H80', 'Maatalous-metsätieteellinen tiedekunta', '2019-07-31 21:00:00+00', 50],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2017-07-31 21:00:00+00', 5],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2018-07-31 21:00:00+00', 1],
    ['H90', 'Eläinlääketieteellinen tiedekunta', '2019-07-31 21:00:00+00', 8]
  ]
}

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

const configs = [config1, config2]

const CoolDataScience = () => {
  return (
    <div style={{ margin: '0 auto', maxWidth: '75vw' }}>
      <ProtoC rawData={raw_data} />
      {configs.map((c, i) => (
        <ReactHighcharts key={i} highcharts={Highcharts} config={c} />
      ))}
    </div>
  )
}

/* <Sankey
      className="my-cool-data-science"
      nodes={nodes}
      links={linkMapper(links)}
      width={800}
      height={400}
      onLinkMouseOver={handleLinkMouseOver}
      onLinkMouseOut={handleLinkMouseOut}
      onValueMouseOver={handleValueMouseOver}
      onValueMouseOut={handleValueMouseOut}
    >
      {activeValue && makeValueHint(activeValue)}
      {activeLink && makeLinkHint(activeLink)}
    </Sankey> */

export default CoolDataScience
