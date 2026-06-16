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
  const colors = [
    '#800080', // purple
    '#3ba272', // green
    '#ffa500', // orange
    '#ee3333', // red
    '#333333', // black
  ] as const
  const series = Object.entries(props.data)
    .sort(([a, _], [b, __]) => Number(b) - Number(a))
    .map(([percentile, values], idx) => {
      return {
        name: `${percentile}th`,
        type: 'line',
        color: colors[idx],
        colorBy: 'series',
        showSymbol: false,
        symbol: 'circle',
        smooth: 0.1,
        z: 10,
        data: values,
      }
    })

  /** Goal is 5 credits a month (60 per year).
  Monthly incrementation to ensure the line is always drawn
  (one continuous line would not if either end is not visible). */
  const getCreditGainDataPoints = (data?: [string, number][]) =>
    data?.map(([date, _], idx) => {
      if (idx === 0) {
        return [{ coord: [date, 0] }, { coord: [date, 0] }]
      }

      const [prevDate] = data[idx - 1]

      return [{ coord: [prevDate, (idx - 1) * 5] }, { coord: [date, idx * 5] }]
    }) ?? []

  /** Credit and graduation targets */
  const markLines = [
    {
      type: 'line',
      name: '',
      markLine: {
        z: 0,
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: 'grey',
          type: 'solid',
          width: 1.5,
        },
        data: props.goalLines?.credits?.map(goal => ({ yAxis: goal })) ?? [],
      },
    },
    {
      type: 'line',
      name: '',
      markLine: {
        z: 0,
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: '#ee3333',
          type: 'solid',
          width: 1.5,
        },
        data: props.goalLines?.dates?.map(goal => ({ xAxis: goal })) ?? [],
      },
    },
    {
      type: 'line',
      name: '',
      silent: true,
      filtermode: 'none',
      animation: false,
      markLine: {
        z: 1,
        symbol: 'none',
        lineStyle: {
          color: 'grey',
          type: 'solid',
          width: 1.5,
        },
        data: getCreditGainDataPoints(props.data['90']),
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
