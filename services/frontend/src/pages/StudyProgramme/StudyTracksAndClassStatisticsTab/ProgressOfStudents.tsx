import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ProgressBarChart } from '@/components/Charts/ProgressBarChart'
import { ProgressTable } from '@/pages/StudyProgramme/StudyTracksAndClassStatisticsTab/ProgressTable'

type ProgressStats = {
  chartStats: {
    data: number[]
    name: string
  }[]
  tableStats: (string | number)[][]
  tableTitles: string[]
}

export const ProgressOfStudents = ({
  progressComboStats,
  progressStats,
  studyProgramme,
  years,
}: {
  progressComboStats: ProgressStats | null
  progressStats: ProgressStats | null
  studyProgramme: string
  years: string[]
}) => {
  const hasComboStats = progressComboStats !== null

  const comboTitles = hasComboStats ? ['Bachelor start year', ...progressComboStats.tableTitles.slice(1)] : []
  const titles = progressStats
    ? hasComboStats
      ? ['Master start year', ...progressStats.tableTitles.slice(1)]
      : progressStats.tableTitles
    : []

  return (
    <Stack spacing={2}>
      {hasComboStats && (
        <Stack spacing={2}>
          <Typography variant="h6">Bachelor + master study right</Typography>
          <ProgressBarChart
            cypress="programme-bachelor-masters"
            data={{
              id: studyProgramme,
              stats: progressComboStats.chartStats,
              years,
            }}
          />
          <ProgressTable data={progressComboStats.tableStats} titles={comboTitles} />
        </Stack>
      )}
      {progressStats !== null && (
        <Stack spacing={2}>
          {hasComboStats && <Typography variant="h6">Master study right</Typography>}
          <ProgressBarChart
            cypress="programme"
            data={{
              id: studyProgramme,
              stats: progressStats.chartStats,
              years,
            }}
          />
          <ProgressTable data={progressStats.tableStats} titles={titles} />
        </Stack>
      )}
    </Stack>
  )
}
