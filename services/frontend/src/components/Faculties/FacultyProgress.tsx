import Stack from '@mui/material/Stack'

import { facultyToolTips } from '@/common/InfoToolTips'
import { ProgressBarChart } from '@/components/common/ProgressBarChart'
import { FacultyProgressTable } from '@/components/Faculties/FacultyProgressTable'
import { Section } from '@/components/Section'
import { GetAllProgressStatsResponse } from '@/types/api/faculty'
import { calculateStats, sortProgrammeKeys } from '@/util/faculty'

export const FacultyProgress = ({
  faculty,
  isError,
  isLoading,
  progressStats,
}: {
  faculty: string
  isError: boolean
  isLoading: boolean
  progressStats: GetAllProgressStatsResponse | undefined
}) => {
  const creditCounts = progressStats?.creditCounts

  const bachelorStats = calculateStats(creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(creditCounts?.bachelorMaster, faculty === 'H90' ? 360 : 300, 180, 7)
  const masterStats = calculateStats(creditCounts?.master, 120)
  const doctorStats = calculateStats(creditCounts?.doctor, 40, 0, 5)

  const sortKeys = (stats: Record<string, number[][]>) => {
    return sortProgrammeKeys(
      Object.keys(stats).map(facultyId => [facultyId, progressStats!.programmeNames[facultyId].code]),
      faculty
    ).map(listObj => listObj[0])
  }

  return (
    <Stack spacing={2}>
      <Section isError={isError} isLoading={isLoading ? !bachelorStats : false} title="Bachelor">
        {bachelorStats ? (
          <Stack gap={2}>
            <ProgressBarChart
              cypress="faculty-bachelors"
              data={{
                id: faculty,
                stats: bachelorStats?.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="bachelors"
              data={bachelorStats?.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.bachelorsProgStats}
              progressTitles={progressStats?.yearlyBachelorTitles}
              sortedKeys={sortKeys(progressStats!.bachelorsProgStats)}
              titles={bachelorStats?.tableTitles}
            />
          </Stack>
        ) : null}
      </Section>
      <Section
        cypress="faculty-bachelor-masters-progress"
        infoBoxContent={facultyToolTips.bachelorMasterProgress}
        isError={isError}
        isLoading={isLoading ? !bachelorMasterStats : false}
        title="Bachelor + Master"
      >
        {bachelorMasterStats ? (
          <Stack gap={2}>
            <ProgressBarChart
              cypress="faculty-bachelor-masters"
              data={{
                id: faculty,
                stats: bachelorMasterStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="bachelor-masters"
              data={bachelorMasterStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.bcMsProgStats}
              progressTitles={progressStats?.yearlyBcMsTitles}
              sortedKeys={sortKeys(progressStats!.bcMsProgStats)}
              titles={bachelorMasterStats.tableTitles}
            />
          </Stack>
        ) : null}
      </Section>
      <Section isError={isError} isLoading={isLoading ? !masterStats : false} title="Master">
        {masterStats && faculty !== 'H90' ? (
          <Stack gap={2}>
            <ProgressBarChart
              cypress="faculty-masters"
              data={{
                id: faculty,
                stats: masterStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="masters"
              data={masterStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.mastersProgStats}
              progressTitles={progressStats?.yearlyMasterTitles}
              sortedKeys={sortKeys(progressStats!.mastersProgStats)}
              titles={masterStats.tableTitles}
            />
          </Stack>
        ) : null}
      </Section>
      <Section isError={isError} isLoading={isLoading ? !doctorStats : false} title="Doctor">
        {doctorStats ? (
          <Stack gap={2}>
            <ProgressBarChart
              cypress="faculty-doctoral"
              data={{
                id: faculty,
                stats: doctorStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="doctoral"
              data={doctorStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.doctoralProgStats}
              sortedKeys={sortKeys(progressStats!.doctoralProgStats)}
              titles={doctorStats.tableTitles}
            />
          </Stack>
        ) : null}
      </Section>
    </Stack>
  )
}
