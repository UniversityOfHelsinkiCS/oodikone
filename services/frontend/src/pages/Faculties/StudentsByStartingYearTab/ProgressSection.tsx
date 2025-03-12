import { Stack } from '@mui/material'

import { facultyToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FacultyProgressTable } from '@/components/material/FacultyProgressTable'
import { ProgressBarChart } from '@/components/material/ProgressBarChart'
import { Section } from '@/components/material/Section'
import { useGetFacultyProgressStatsQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { calculateStats, sortProgrammeKeys } from '@/util/faculty'
import { AccordionWrapper } from './AccordionWrapper'
import { exportProgressTable } from './exportProgressTable'

export const ProgressSection = ({
  faculty,
  graduatedGroup,
  specialGroups,
}: {
  faculty: GetFacultiesResponse
  graduatedGroup: boolean
  specialGroups: boolean
}) => {
  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { getTextIn } = useLanguage()
  const progressStats = useGetFacultyProgressStatsQuery({
    id: faculty?.id,
    specialGroups: specials,
    graduated,
  })

  const getSortedProgrammeKeysProgress = (studyLevelStats: Record<string, number[][]>) => {
    return sortProgrammeKeys(
      Object.keys(studyLevelStats).map(programme => [
        programme,
        progressStats?.data?.programmeNames[programme].code ?? '',
      ]),
      faculty.code
    )
  }

  const bachelorStats = calculateStats(progressStats?.data?.creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(
    progressStats?.data?.creditCounts?.bachelorMaster,
    faculty.code === 'H90' ? 360 : 300,
    180,
    7
  )
  const masterStats = calculateStats(progressStats?.data?.creditCounts?.master, 120)
  const doctorStats = calculateStats(progressStats?.data?.creditCounts?.doctor, 40, 0, 5)

  const hasNonZeroStats = stats => {
    const allValuesZero = values => values.every(value => parseFloat(value) === 0)
    return stats?.chartStats.some(row => !allValuesZero(row.data))
  }

  return (
    <Stack gap={2}>
      <Section
        cypress="FacultyProgress"
        exportOnClick={() =>
          exportProgressTable(
            {
              ...progressStats,
              bachelorStats,
              bachelorMasterStats,
              masterStats,
              doctorStats,
            },
            progressStats?.data?.programmeNames,
            faculty.code,
            getTextIn
          )
        }
        infoBoxContent={facultyToolTips.studentProgress}
        title="Progress of students of the faculty by starting year"
      >
        <Stack gap={2}>
          <AccordionWrapper level="Bachelor">
            {progressStats.isSuccess && progressStats.data && bachelorStats && hasNonZeroStats(bachelorStats) && (
              <Stack gap={2}>
                <ProgressBarChart
                  cypress="FacultyBachelorsProgress"
                  data={{
                    id: faculty.code,
                    stats: bachelorStats.chartStats,
                    years: progressStats.data.years,
                  }}
                />
                <FacultyProgressTable
                  cypress="bachelors"
                  data={bachelorStats.tableStats}
                  programmeNames={progressStats?.data.programmeNames}
                  programmeStats={progressStats?.data.bachelorsProgStats}
                  progressTitles={progressStats?.data.yearlyBachelorTitles}
                  sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bachelorsProgStats).map(
                    listObj => listObj[0]
                  )}
                  titles={bachelorStats.tableTitles}
                />
              </Stack>
            )}
          </AccordionWrapper>
          <AccordionWrapper level={faculty.code === 'H90' ? 'Bachelor + Licentiate' : 'Bachelor + Master'}>
            {progressStats.isSuccess &&
              progressStats.data &&
              bachelorMasterStats &&
              hasNonZeroStats(bachelorMasterStats) && (
                <Stack gap={2}>
                  <ProgressBarChart
                    cypress="faculty-bachelor-masters"
                    data={{
                      id: faculty.code,
                      stats: bachelorMasterStats.chartStats,
                      years: progressStats?.data.years,
                    }}
                  />
                  <FacultyProgressTable
                    cypress="bachelor-masters"
                    data={bachelorMasterStats.tableStats}
                    programmeNames={progressStats.data.programmeNames}
                    programmeStats={progressStats.data.bcMsProgStats}
                    progressTitles={progressStats.data.yearlyBcMsTitles}
                    sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bcMsProgStats).map(
                      listObj => listObj[0]
                    )}
                    titles={bachelorMasterStats.tableTitles}
                  />
                </Stack>
              )}
          </AccordionWrapper>
          <AccordionWrapper level="Master">
            {progressStats.isSuccess &&
              progressStats.data &&
              masterStats &&
              hasNonZeroStats(masterStats) &&
              !(faculty.code === 'H90') && (
                <Stack gap={2}>
                  <ProgressBarChart
                    cypress="faculty-masters"
                    data={{
                      id: faculty.code,
                      stats: masterStats.chartStats,
                      years: progressStats?.data.years,
                    }}
                  />
                  <FacultyProgressTable
                    cypress="masters"
                    data={masterStats.tableStats}
                    programmeNames={progressStats?.data.programmeNames}
                    programmeStats={progressStats?.data.mastersProgStats}
                    progressTitles={progressStats?.data.yearlyMasterTitles}
                    sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.mastersProgStats).map(
                      listObj => listObj[0]
                    )}
                    titles={masterStats.tableTitles}
                  />
                </Stack>
              )}
          </AccordionWrapper>
          <AccordionWrapper level="Doctor">
            {progressStats.isSuccess && progressStats.data && doctorStats && hasNonZeroStats(doctorStats) && (
              <Stack gap={2}>
                <ProgressBarChart
                  cypress="faculty-doctoral"
                  data={{
                    id: faculty.code,
                    stats: doctorStats.chartStats,
                    years: progressStats?.data.years,
                  }}
                />
                <FacultyProgressTable
                  cypress="doctoral"
                  data={doctorStats.tableStats}
                  programmeNames={progressStats?.data.programmeNames}
                  programmeStats={progressStats?.data.doctoralProgStats}
                  sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.doctoralProgStats).map(
                    listObj => listObj[0]
                  )}
                  titles={doctorStats.tableTitles}
                />
              </Stack>
            )}
          </AccordionWrapper>
        </Stack>
      </Section>
    </Stack>
  )
}
