import ReactECharts from 'echarts-for-react'

type PercentileProps = {
  data: Record<string, [string, number][]>
  classSize: number
  title?: string
  goalLines?: {
    dates?: (Date | string)[]
    credits?: number[]
  }
}

export const PercentileGraph = (props: PercentileProps) => {
  const series = Object.entries(props.data).map(([percentile, values]) => ({
    name: `${percentile}th`,
    type: 'line',
    showSymbol: false,
    symbol: 'circle',
    smooth: 0.2,
    data: values,
  }))

  /** Credit and graduation goals */
  const markLines = [
    {
      type: 'line',
      name: '',
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: '#888888',
          type: 'solid',
          width: 1,
        },
        data: props.goalLines?.credits?.map(goal => ({ yAxis: goal })) ?? [],
      },
    },
    {
      type: 'line',
      name: '',
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: '#ff0000',
          type: 'solid',
          width: 1,
        },
        data: props.goalLines?.dates?.map(goal => ({ xAxis: goal })) ?? [],
      },
    },
  ]

  const option = {
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    toolbox: {
      feature: {
        dataView: {
          readOnly: true,
          optionToContent(opt) {
            const filteredData = opt.series.filter(s => Boolean(s.data))

            let table = `<table><thead><tr><th style="padding: 0 2em 0 0">Date (YYYY-MM)</th>`
            for (const row of filteredData) {
              table += `<th style="padding: 0 2em 0 0">${row.name}</th>`
            }
            table += `</tr></thead><tbody>`

            for (let i = 0; i < filteredData[0].data.length; i++) {
              table += `<tr><td>${filteredData[0].data[i][0]}</td>`
              for (const row of filteredData) {
                table += `<td>${row.data[i][1]}`
              }
              table += `</tr>`
            }

            table += `</tbody></table>`

            return table
          },
        },
      },
    },
    title: {
      text: props.title,
      subtext: `Class size: ${props.classSize}`,
      subtextStyle: {
        fontSize: 14,
      },
      left: 'center',
      top: 'top',
    },
    graphic: {
      type: 'text',
      left: 'center',
      bottom: 25,
      style: {
        fill: '#666',
        text: 'Percentile',
      },
    },
    yAxis: {
      type: 'value',
      name: 'Credits',
    },
    legend: {
      bottom: 0,
    },
    grid: {
      show: true,
      top: 80,
      left: 60,
      right: 60,
      bottom: 70,
    },
    tooltip: {
      trigger: 'axis',
    },
    series: [...markLines, ...series],
  }

  return <ReactECharts option={option} opts={{ renderer: 'svg' }} style={{ height: 550, width: '100%' }} />
}
