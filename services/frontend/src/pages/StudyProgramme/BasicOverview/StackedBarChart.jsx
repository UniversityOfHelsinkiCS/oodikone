/* eslint-disable react/no-this-in-sfc */
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const colors = ['#7cb5ec', '#90ed7d', '#434348', '#f7a35c', '#FFF000', '#2b908f', '#f45b5b', '#91e8e1']

export const StackedBarChart = ({ cypress, data, labels, wideTable, exportFileName = 'chart' }) => {
  const dataWithColors = data?.map((series, index) => ({ ...series, color: colors[index] }))

  const config = {
    series: dataWithColors,
    xAxis: {
      categories: labels,
      allowDecimals: false,
    },
    chart: {
      type: 'column',
      height: '450px',
    },
    exporting: {
      filename: exportFileName,
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          formatter() {
            if (Number.isInteger(this.y)) return `${this.y}`
            return `${this.y.toFixed(1)}`
          },
        },
      },
    },
    tooltip: {
      pointFormat: '<b>{series.name}: {point.percentage:.1f} %</b>',
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
