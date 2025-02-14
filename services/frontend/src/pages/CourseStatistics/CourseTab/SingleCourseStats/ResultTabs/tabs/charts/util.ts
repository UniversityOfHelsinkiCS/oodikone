import { calculatePercentage } from '@/common'
import { ViewMode } from '@/types/courseStat'

type Series = {
  name: string
  data: number[]
  stack: string
  type: 'column'
}

export const absoluteToRelative = (all: number[]) => (p: number, i: number) => {
  return Math.min(100, parseFloat(calculatePercentage(p, all[i]).slice(0, -1)))
}

export const getMaxValueOfSeries = (series: Series[]) => {
  return Object.values(series).reduce((acc, cur) => {
    const curMax = Math.max(...cur.data.filter(n => !Number.isNaN(n)).map(Math.abs))
    return curMax >= acc ? curMax : acc
  }, 0)
}

export const getDataObject = (name: string, data: number[], stack: string): Series => {
  return {
    name,
    data,
    stack,
    type: 'column' as const,
  }
}

export const getGraphOptions = (
  colors: string[],
  colorsRelative: string[],
  isRelative: boolean,
  max: number,
  statYears: string[],
  title: string,
  viewMode: ViewMode
) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? colorsRelative : colors,
  title: {
    text: title,
  },
  xAxis: {
    categories: statYears,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? `Share of ${viewMode.toLowerCase()}` : `Number of ${viewMode.toLowerCase()}`,
    },
    max,
    floor: -max,
  },
  plotOptions: {
    column: {
      stacking: 'normal' as const,
      borderRadius: 3,
    },
    series: {
      tooltip: {
        valueSuffix: isRelative ? '%' : '',
      },
    },
  },
})
