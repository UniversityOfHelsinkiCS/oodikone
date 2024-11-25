import { Stack } from '@mui/material'

import { facultyToolTips } from '@/common/InfoToolTips'
import { calculateStats, sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { FacultyBarChart } from '@/components/material/FacultyBarChart'
import { FacultyProgressTable } from '@/components/material/FacultyProgressTable'
import { Section } from '@/components/material/Section'

export const FacultyProgress = ({
  faculty,
  isError,
  isLoading,
  progressStats,
}: {
  faculty: string
  isError: boolean
  isLoading: boolean
  progressStats: any // TODO: Type via RTKApi
}) => {
  const creditCounts = progressStats?.creditCounts

  const bachelorStats = calculateStats(creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(creditCounts?.bachelorMaster, faculty === 'H90' ? 360 : 300, 180, 7)
  const masterStats = calculateStats(creditCounts?.master, 120)
  const doctorStats = calculateStats(creditCounts?.doctor, 40, 0, 5)

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
                years: progressStats?.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyBachelorsProgress"
              data={bachelorStats?.tableStats}
              programmeNames={progressStats?.programmeNames}
              programmeStats={progressStats?.bachelorsProgStats}
              progressTitles={progressStats?.yearlyBachelorTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.bachelorsProgStats).map(obj => [
                  obj,
                  progressStats?.programmeNames[obj].code,
                ]),
                faculty
              ).map(listObj => listObj[0])}
              titles={bachelorStats?.tableTitles}
            />
          </Stack>
        )}
      </Section>
      <Section
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
                years: progressStats?.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyBachelorMastersProgress"
              data={bachelorMasterStats.tableStats}
              programmeNames={progressStats?.programmeNames}
              programmeStats={progressStats?.bcMsProgStats}
              progressTitles={progressStats?.yearlyBcMsTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.bcMsProgStats).map(obj => [obj, progressStats?.programmeNames[obj].code]),
                faculty
              ).map(listObj => listObj[0])}
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
                years: progressStats?.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyMastersProgress"
              data={masterStats.tableStats}
              programmeNames={progressStats?.programmeNames}
              programmeStats={progressStats?.mastersProgStats}
              progressTitles={progressStats?.yearlyMasterTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.mastersProgStats).map(obj => [obj, progressStats?.programmeNames[obj].code]),
                faculty
              ).map(listObj => listObj[0])}
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
                years: progressStats?.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyDoctoralProgress"
              data={doctorStats.tableStats}
              programmeNames={progressStats?.programmeNames}
              programmeStats={progressStats?.doctoralProgStats}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.doctoralProgStats).map(obj => [
                  obj,
                  progressStats?.programmeNames[obj].code,
                ]),
                faculty
              ).map(listObj => listObj[0])}
              titles={doctorStats.tableTitles}
            />
          </Stack>
        )}
      </Section>
    </>
  )
}
