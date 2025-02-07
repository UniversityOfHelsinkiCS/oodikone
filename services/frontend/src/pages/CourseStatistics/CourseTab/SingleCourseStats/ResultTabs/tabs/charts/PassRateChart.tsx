import { useTheme } from '@mui/material'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { FormattedStats, ProgrammeStats } from '@/types/courseStat'
import { absoluteToRelative, getDataObject, getMaxValueOfSeries } from '../util'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const passRateAttemptGraphOptions = (
  categories: string[],
  colors: string[],
  colorsRelative: string[],
  isRelative: boolean,
  max: number,
  title: string
) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? colorsRelative : colors,
  title: {
    text: title,
  },
  xAxis: {
    categories,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? 'Share of students' : 'Number of students',
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

const passRateStudentGraphOptions = (
  categories: string[],
  colors: string[],
  colorsRelative: string[],
  isRelative: boolean,
  max: number,
  title: string
) => ({
  chart: {
    type: 'column',
  },
  colors: isRelative ? colorsRelative : colors,
  title: {
    text: title,
  },
  xAxis: {
    categories,
  },
  yAxis: {
    allowDecimals: false,
    title: {
      text: isRelative ? 'Share of students' : 'Number of students',
    },
    max,
    floor: -max,
  },
  plotOptions: {
    column: {
      stacking: 'normal' as const,
      borderRadius: 1,
    },
    series: {
      tooltip: {
        valueSuffix: isRelative ? '%' : '',
      },
    },
  },
})

const getPassRateAttemptSeriesFromStats = stats => {
  const all: number[] = []
  const passed: number[] = []
  const failed: number[] = []
  const enrolledNoGrade: number[] = []

  stats.forEach(year => {
    const { passed: p, failed: f } = year.attempts.categories
    const { totalEnrollments } = year.attempts
    const enrolledWithNoGrade = totalEnrollments > 0 ? totalEnrollments - p - f : 0
    all.push(totalEnrollments || p + f)
    passed.push(p)
    failed.push(f)
    enrolledNoGrade.push(enrolledWithNoGrade)
  })

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('failed', failed, 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'a'),
      getDataObject('failed', failed.map(absoluteToRelative(all)), 'a'),
      getDataObject('enrolled, no grade', enrolledNoGrade.map(absoluteToRelative(all)), 'a'),
    ],
  }
}

const getPassRateStudentSeriesFromStats = (stats: FormattedStats[]) => {
  const all: number[] = []
  const passed: number[] = []
  const failed: number[] = []
  const enrolledNoGrade: number[] = []

  stats.forEach(year => {
    all.push(year.students.total || 0)
    passed.push(year.students.totalPassed || 0)
    failed.push(year.students.totalFailed || 0)
    enrolledNoGrade.push(year.students.enrolledStudentsWithNoGrade ?? 0)
  })

  return {
    absolute: [
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('failed', failed, 'c'),
      getDataObject('enrolled, no grade', enrolledNoGrade, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'a'),
      getDataObject('failed', failed.map(absoluteToRelative(all)), 'a'),
      getDataObject('enrolled, no grade', enrolledNoGrade.map(absoluteToRelative(all)), 'a'),
    ],
  }
}

export const PassRateChart = ({
  data,
  isRelative,
  userHasAccessToAllStats,
  viewMode,
}: {
  data: ProgrammeStats
  isRelative: boolean
  userHasAccessToAllStats: boolean
  viewMode: 'ATTEMPTS' | 'STUDENTS'
}) => {
  const theme = useTheme()
  const gradeColors = theme.palette.grades
  const colorsRelative = [gradeColors.pass, gradeColors.fail, gradeColors.enrolledNoGrade]
  const colors = [gradeColors.generic, ...colorsRelative]

  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)

  const isAttemptsMode = viewMode === 'ATTEMPTS'
  const passRateGraphSeries = isAttemptsMode
    ? getPassRateAttemptSeriesFromStats(stats)
    : getPassRateStudentSeriesFromStats(stats)

  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(passRateGraphSeries.absolute)
  const graphOptions = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudentGraphOptions
  const primaryGraphOptions = graphOptions(
    statYears,
    colors,
    colorsRelative,
    isRelative,
    maxPassRateVal,
    `Pass rate for group ${data.name}`
  )

  return (
    <div>
      <ReactHighcharts
        config={{
          ...primaryGraphOptions,
          series: isRelative ? passRateGraphSeries.relative : passRateGraphSeries.absolute,
        }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or fewer are shown as 0 in the chart</span>
      )}
    </div>
  )
}
