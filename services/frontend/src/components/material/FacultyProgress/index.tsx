import { Stack } from '@mui/material'

import { facultyToolTips } from '@/common/InfoToolTips'
import { calculateStats, sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { FacultyBarChart } from '@/components/material/FacultyBarChart'
import { FacultyProgressTable } from '@/components/material/FacultyProgressTable'
import { Section } from '@/components/material/Section'
import { GetAllProgressStatsResponse } from '@/shared/types/api/faculty'

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
    <>
      <Section isError={isError} isLoading={isLoading && !bachelorStats} title="Bachelor">
        {bachelorStats && (
          <Stack gap={2}>
            <FacultyBarChart
              cypress="FacultyBachelorsProgress"
              data={{
                id: faculty,
                stats: bachelorStats?.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="FacultyBachelorsProgressTable"
              data={bachelorStats?.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.bachelorsProgStats}
              progressTitles={progressStats?.yearlyBachelorTitles}
              sortedKeys={sortKeys(progressStats!.bachelorsProgStats)}
              titles={bachelorStats?.tableTitles}
            />
          </Stack>
        )}
      </Section>
      <Section
        cypress="FacultyBachelorMastersProgress"
        infoBoxContent={facultyToolTips.bachelorMasterProgress}
        isError={isError}
        isLoading={isLoading && !bachelorMasterStats}
        title="Bachelor + Master"
      >
        {bachelorMasterStats && (
          <Stack gap={2}>
            <FacultyBarChart
              cypress="FacultyBachelorMastersProgress"
              data={{
                id: faculty,
                stats: bachelorMasterStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="FacultyBachelorMastersProgressTable"
              data={bachelorMasterStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.bcMsProgStats}
              progressTitles={progressStats?.yearlyBcMsTitles}
              sortedKeys={sortKeys(progressStats!.bcMsProgStats)}
              titles={bachelorMasterStats.tableTitles}
            />
          </Stack>
        )}
      </Section>
      <Section isError={isError} isLoading={isLoading && !masterStats} title="Master">
        {masterStats && faculty !== 'H90' && (
          <Stack gap={2}>
            <FacultyBarChart
              cypress="FacultyMastersProgress"
              data={{
                id: faculty,
                stats: masterStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="FacultyMastersProgressTable"
              data={masterStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.mastersProgStats}
              progressTitles={progressStats?.yearlyMasterTitles}
              sortedKeys={sortKeys(progressStats!.mastersProgStats)}
              titles={masterStats.tableTitles}
            />
          </Stack>
        )}
      </Section>
      <Section isError={isError} isLoading={isLoading && !doctorStats} title="Doctor">
        {doctorStats && (
          <Stack gap={2}>
            <FacultyBarChart
              cypress="FacultyDoctoralProgress"
              data={{
                id: faculty,
                stats: doctorStats.chartStats,
                years: progressStats!.years,
              }}
            />
            <FacultyProgressTable
              cypress="FacultyDoctoralProgressTable"
              data={doctorStats.tableStats}
              programmeNames={progressStats!.programmeNames}
              programmeStats={progressStats!.doctoralProgStats}
              sortedKeys={sortKeys(progressStats!.doctoralProgStats)}
              titles={doctorStats.tableTitles}
            />
          </Stack>
        )}
      </Section>
    </>
  )
}
