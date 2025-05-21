import useTheme from '@mui/material/styles/useTheme'

import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import ReactHighcharts from 'react-highcharts'

import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { FormattedStats, ProgrammeStats, ViewMode } from '@/types/courseStat'
import { absoluteToRelative, getDataObject, getGraphOptions, getMaxValueOfSeries } from './util'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const getPassRateSeries = (stats: FormattedStats[], viewMode: ViewMode) => {
  const all: number[] = []
  const passed: number[] = []
  const failed: number[] = []
  const enrolledNoGrade: number[] = []

  if (viewMode === 'ATTEMPTS') {
    stats.forEach(year => {
      const { passed: p, failed: f } = year.attempts.categories
      const { totalEnrollments } = year.attempts
      const enrolledWithNoGrade = totalEnrollments && totalEnrollments > 0 ? Math.max(0, totalEnrollments - p - f) : 0
      all.push(totalEnrollments ?? p + f)
      passed.push(p)
      failed.push(f)
      enrolledNoGrade.push(enrolledWithNoGrade)
    })
  } else {
    stats.forEach(year => {
      all.push(year.students.total || 0)
      passed.push(year.students.totalPassed || 0)
      failed.push(year.students.totalFailed || 0)
      enrolledNoGrade.push(year.students.enrolledStudentsWithNoGrade ?? 0)
    })
  }

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
  viewMode: ViewMode
}) => {
  const theme = useTheme()
  const gradeColors = theme.palette.grades
  const colorsRelative = [gradeColors.pass, gradeColors.fail, gradeColors.enrolledNoGrade]
  const colors = [gradeColors.all, ...colorsRelative]

  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)

  const series = getPassRateSeries(stats, viewMode)
  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(series.absolute)

  const graphOptions = getGraphOptions(
    colors,
    colorsRelative,
    isRelative,
    maxPassRateVal,
    statYears,
    `Pass rate for group ${data.name}`,
    viewMode
  )

  return (
    <div>
      <ReactHighcharts config={{ ...graphOptions, series: isRelative ? series.relative : series.absolute }} />
      <TotalsDisclaimer shownAsZero userHasAccessToAllStats={userHasAccessToAllStats} />
    </div>
  )
}
