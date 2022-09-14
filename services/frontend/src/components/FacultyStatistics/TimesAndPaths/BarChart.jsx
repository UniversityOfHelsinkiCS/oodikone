import React from 'react'
import ReactHighcharts from 'react-highcharts'

const BarChart = ({ data, categories, goal, handleClick, level, facultyGraph = true, year }) => {
  const maxValue = data.reduce((max, { y }) => {
    return y > max ? y : max
  }, goal * 2)

  const config = {
    chart: {
      type: 'bar',
      width: 700,
    },
    title: { text: '' },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          inside: true,
        },
        pointPadding: 0.0,
        // groupPadding: 0.1,
      },
    },
    series: [
      {
        data,
        dataLabels: [
          {
            align: 'left',
            format: '{point.amount} students',
            color: '#EBECF0',
          },
          {
            align: 'right',
            format: '{y}',
            color: '#EBECF0',
          },
        ],
        showInLegend: false,
        zones: [
          {
            value: goal + 0.1,
            color: '#90A959',
          },
          {
            value: goal + 6.1,
            color: '#FEE191',
          },
          {
            color: '#FB6962',
          },
        ],
        point: {
          events: {
            click(e) {
              handleClick(e, level, facultyGraph)
            },
          },
        },
      },
    ],
    xAxis: {
      categories,
      title: { text: facultyGraph ? 'Graduation year' : 'Programme' },
    },
    yAxis: {
      min: 0,
      max: maxValue,
      title: { text: 'Graduation time (months)' },
      labels: {
        overflow: 'justify',
      },
      allowDecimals: false,
      showFirstLabel: false,
      plotLines: [
        {
          color: '#90A959',
          width: 2,
          value: goal,
          dashStyle: 'shortDash',
          // label: {
          //   text: `${goal}`, // 'optimal',
          //   verticalAlign: 'bottom',
          // },
        },
      ],
    },
    credits: {
      text: 'oodikone | TOSKA',
    },
  }

  if (!facultyGraph) config.title.text = `Year ${year} [EXAMPLE DATA]`
  return (
    <div>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default BarChart
