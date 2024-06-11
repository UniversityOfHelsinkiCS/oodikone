import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import '../studyprogramme.css'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

export const LineGraph = ({ cypress, data }) => {
  const dataWithColors = data?.graphStats.map((series, index) => ({
    ...series,
    color: colors[index],
  }))

  const config = {
    title: {
      text: '',
    },
    series: dataWithColors,
    credits: {
      enabled: false,
    },
    exporting: {
      filename: `oodikone_student_statistics_of_studyprogramme_${data?.id}`,
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
    <div className="graph-container" data-cy={`Graph-${cypress}`}>
      <ReactHighcharts config={config} />
    </div>
  )
}
