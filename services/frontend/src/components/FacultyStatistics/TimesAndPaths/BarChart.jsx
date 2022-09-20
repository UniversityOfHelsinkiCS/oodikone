/* eslint-disable react/no-this-in-sfc */
import React from 'react'
import ReactHighcharts from 'react-highcharts'

const BarChart = ({
  data,
  categories,
  goal,
  handleClick,
  facultyGraph = true,
  year,
  label,
  programmeNames,
  language = null,
  showMeanTime,
}) => {
  const maxValue = data.reduce((max, { y }) => {
    return y > max ? y : max
  }, goal * 2)

  const config = {
    chart: {
      type: 'bar',
      width: 700,
      margin: [70, 0],
    },
    title: { text: ' ' },
    tooltip: {
      // eslint-disable-next-line
      formatter: function() {
        const sortingText =
          label === 'Start year'
            ? `From class of ${facultyGraph ? this.x : year}, ${this.point.amount} students have graduated`
            : `${this.point.amount} students graduated in year ${this.x}`
        // eslint-disable-next-line prettier/prettier
        const text = `<br /> <p>${sortingText}, <br />${showMeanTime ? 'mean' : 'median'} study time: ${this.y} months</p>`
        if (!facultyGraph)
          return `<b>${
            programmeNames[this.x]?.[language] ? programmeNames[this.x]?.[language] : programmeNames[this.x]?.fi
          }</b>${text}`
        // eslint-disable-next-line
        return text ;
      },
    },
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
            value: goal + 12.1,
            color: '#FEE191',
          },
          {
            color: '#FB6962',
          },
        ],
        point: {
          events: {
            click(e) {
              handleClick(e, facultyGraph)
            },
          },
        },
      },
    ],
    xAxis: {
      categories,
      title: {
        text: facultyGraph ? label : 'Programme',
        align: 'high',
        offset: 0,
        rotation: 0,
        y: -10,
      },
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

  if (!facultyGraph) config.title.text = `Year ${year} by ${label.toLowerCase()}`

  return (
    <div>
      <ReactHighcharts config={config} />
    </div>
  )
}

export default BarChart
