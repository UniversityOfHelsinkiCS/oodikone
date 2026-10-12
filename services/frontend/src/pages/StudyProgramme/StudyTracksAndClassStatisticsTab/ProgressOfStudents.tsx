import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ProgressBarChart } from '@/components/Charts/ProgressBarChart'
import {
  ProgressTable,
  StudyTrackProgressStats,
} from '@/pages/StudyProgramme/StudyTracksAndClassStatisticsTab/ProgressTable'
import { Name } from '@oodikone/shared/types'

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
  studyTrackComboStats,
  studyTrackStats,
  studyTracks,
  years,
}: {
  progressComboStats: ProgressStats | null
  progressStats: ProgressStats | null
  studyProgramme: string
  studyTrackComboStats?: StudyTrackProgressStats | null
  studyTrackStats?: StudyTrackProgressStats | null
  studyTracks?: Record<string, string | Name>
  years: string[]
}) => {
  return (
    <Stack spacing={2}>
      {progressComboStats !== null && (
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
          <ProgressTable
            data={progressComboStats.tableStats}
            studyTrackStats={studyTrackComboStats}
            studyTracks={studyTracks}
            titles={progressComboStats.tableTitles}
          />
        </Stack>
      )}
      {progressStats !== null && (
        <Stack spacing={2}>
          {progressComboStats != null && <Typography variant="h6">Master study right</Typography>}
          <ProgressBarChart
            cypress="programme"
            data={{
              id: studyProgramme,
              stats: progressStats.chartStats,
              years,
            }}
          />
          <ProgressTable
            data={progressStats.tableStats}
            studyTrackStats={studyTrackStats}
            studyTracks={studyTracks}
            titles={progressStats.tableTitles}
          />
        </Stack>
      )}
    </Stack>
  )
}
