import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import '../studyprogramme.css'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

export const LineGraph = ({ cypress, data, wideTable, exportFileName }) => {
  const dataWithColors = data?.graphStats.map((series, index) => ({
    ...series,
    color: colors[index],
  }))

  const config = {
    series: dataWithColors,
    exporting: {
      filename: exportFileName,
    },
    chart: {
      height: '450px',
    },
    xAxis: {
      categories: data?.years,
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      reversed: false,
      title: '',
    },
  }

  if (!data) return null

  return (
    <div className={`graph-container${wideTable ? '-narrow' : ''}`} data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
