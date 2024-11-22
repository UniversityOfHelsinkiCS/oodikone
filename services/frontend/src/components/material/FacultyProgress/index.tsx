import { Stack } from '@mui/material'

import { facultyToolTips } from '@/common/InfoToolTips'
import { calculateStats, sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { FacultyBarChart } from '@/components/material/FacultyBarChart'
import { FacultyProgressTable } from '@/components/material/FacultyProgressTable'
import { Section } from '@/components/material/Section'
import { useGetAllFacultiesProgressStatsQuery } from '@/redux/facultyStats'

export const FacultyProgress = ({
  excludeGraduated,
  excludeSpecials,
  faculty,
}: {
  excludeGraduated: boolean
  excludeSpecials: boolean
  faculty: string
}) => {
  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated: excludeGraduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED',
    includeSpecials: !excludeSpecials,
  })

  const creditCounts = progressStats?.data?.creditCounts

  const bachelorStats = calculateStats(creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(creditCounts?.bachelorMaster, faculty === 'H90' ? 360 : 300, 180, 7)
  const masterStats = calculateStats(creditCounts?.master, 120)
  const doctorStats = calculateStats(creditCounts?.doctor, 40, 0, 5)

  const isError = progressStats.isError || (progressStats.isSuccess && !progressStats.data)
  const isLoading = progressStats.isFetching || progressStats.isLoading

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
                years: progressStats?.data.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyBachelorsProgress"
              data={bachelorStats?.tableStats}
              programmeNames={progressStats?.data.programmeNames}
              programmeStats={progressStats?.data.bachelorsProgStats}
              progressTitles={progressStats?.data.yearlyBachelorTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.data.bachelorsProgStats).map(obj => [
                  obj,
                  progressStats?.data?.programmeNames[obj].code,
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
                years: progressStats?.data.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyBachelorMastersProgress"
              data={bachelorMasterStats.tableStats}
              programmeNames={progressStats?.data.programmeNames}
              programmeStats={progressStats?.data.bcMsProgStats}
              progressTitles={progressStats?.data.yearlyBcMsTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.data.bcMsProgStats).map(obj => [
                  obj,
                  progressStats?.data?.programmeNames[obj].code,
                ]),
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
                years: progressStats?.data.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyMastersProgress"
              data={masterStats.tableStats}
              programmeNames={progressStats?.data.programmeNames}
              programmeStats={progressStats?.data.mastersProgStats}
              progressTitles={progressStats?.data.yearlyMasterTitles}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.data.mastersProgStats).map(obj => [
                  obj,
                  progressStats?.data?.programmeNames[obj].code,
                ]),
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
                years: progressStats?.data.years,
              }}
            />
            <FacultyProgressTable
              cypress="Table-FacultyDoctoralProgress"
              data={doctorStats.tableStats}
              programmeNames={progressStats?.data.programmeNames}
              programmeStats={progressStats?.data.doctoralProgStats}
              sortedKeys={sortProgrammeKeys(
                Object.keys(progressStats?.data.doctoralProgStats).map(obj => [
                  obj,
                  progressStats?.data?.programmeNames[obj].code,
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
