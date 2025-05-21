import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ProgressBarChart } from '@/components/material/ProgressBarChart'
import { ProgressTable } from './ProgressTable'

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
  return (
    <Stack gap={2}>
      {progressComboStats !== null && (
        <Stack gap={2}>
          <Typography variant="h6">Bachelor + master study right</Typography>
          <ProgressBarChart
            cypress="programme-bachelor-masters"
            data={{
              id: studyProgramme,
              stats: progressComboStats.chartStats,
              years,
            }}
          />
          <ProgressTable data={progressComboStats.tableStats} titles={progressComboStats.tableTitles} />
        </Stack>
      )}
      {progressStats !== null && (
        <Stack gap={2}>
          {progressComboStats != null && <Typography variant="h6">Master study right</Typography>}
          <ProgressBarChart
            cypress="programme"
            data={{
              id: studyProgramme,
              stats: progressStats.chartStats,
              years,
            }}
          />
          <ProgressTable data={progressStats.tableStats} titles={progressStats.tableTitles} />
        </Stack>
      )}
    </Stack>
  )
}
