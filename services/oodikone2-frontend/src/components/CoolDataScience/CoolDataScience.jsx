import React from 'react'
import ReactHighcharts from 'react-highcharts'
import Highcharts from 'highcharts'
import HighchartsSankey from 'highcharts/modules/sankey'

import rawData from './data'
import ProtoC from './ProtoC'
import ProtoC2 from './ProtoC2'
import ProtoD from './ProtoD'
import ProtoE from './ProtoE'
import ProtoF from './ProtoF'
import ProtoG from './ProtoG'
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

const configs = [config1, config2]

const CoolDataScience = () => {
  return (
    <div style={{ margin: '0 auto', maxWidth: '75vw' }}>
      <ProtoG />
      <hr />
      <ProtoF />
      <hr />
      <ProtoE />
      <hr />
      <ProtoD data={rawData} />
      <hr />
      <ProtoC />
      <ProtoC2 />
      <hr />
      {configs.map((c, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i}>
          <ReactHighcharts highcharts={Highcharts} config={c} />
          <hr />
        </div>
      ))}
    </div>
  )
}

export default CoolDataScience
