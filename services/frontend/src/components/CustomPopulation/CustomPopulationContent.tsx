import Box from '@mui/material/Box'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageTitle } from '@/components/common/PageTitle'
import { PanelView } from '@/components/common/PanelView'
import { StudentAmountLimiter } from '@/components/common/StudentAmountLimiter'
import { StyledMessage } from '@/components/common/StyledMessage'
import { useColumns as columnsGeneralTab } from '@/components/CustomPopulation/studentColumns'
import { UnihowDataExport } from '@/components/CustomPopulation/UnihowDataExport'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { Loading } from '@/components/Loading'
import { CreditAccumulationGraph } from '@/components/PopulationComponents/CreditAccumulation'
import { CustomPopulationProgrammeDist } from '@/components/PopulationComponents/ProgrammeDist'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { RightsNotification } from '@/components/RightsNotification'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { KeyboardBackspaceIcon, LabelIcon } from '@/theme'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { FormattedStudent } from '@oodikone/shared/types'

export const CustomPopulationContent = ({
  filteredStudents,
  filteredCourses,
  populationName,
  discardedStudentNumbers,
  unfilteredPopulationLength,
  associatedProgramme,
  isFetchingPopulation,
  resetState,
}: {
  filteredStudents: FormattedStudent[]
  filteredCourses: FilteredCourse[]
  populationName?: string
  discardedStudentNumbers: string[]
  unfilteredPopulationLength: number
  associatedProgramme?: string | null
  isFetchingPopulation: boolean
  resetState: () => void
}) => {
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes().filteredProgrammes
  const [studentAmountLimit, setStudentAmountLimit] = useDebouncedState(0, 1000)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <CreditAccumulationGraph
          programmeCodes={[associatedProgramme].filter(Boolean) as string[]}
          students={filteredStudents}
          studyPlanFilter={false} // Not enabled for custom population yet.
        />
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <CustomPopulationProgrammeDist
          infotext={populationStatisticsToolTips.programmeDistributionCustomPopulation}
          students={filteredStudents}
        />
      ),
    },
    {
      title: 'Courses of population',
      content: (
        <>
          <InfoBox content={populationStatisticsToolTips.coursesOfClass.showAllWithAtLeast} />
          <StudentAmountLimiter
            onStudentAmountLimitChange={onStudentAmountLimitChange}
            studentAmountLimit={studentAmountLimit}
          />
          <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
        </>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <PopulationStudents
          dataExport={<UnihowDataExport students={filteredStudents} />}
          filteredStudents={filteredStudents}
          generalTabColumnFunction={() =>
            columnsGeneralTab({
              programme: associatedProgramme ?? null,
            })
          }
          generalTabFormattingFunction={() =>
            formatGeneralTab({
              variant: 'customPopulation',
              filteredStudents,

              years: [],

              programme: associatedProgramme ?? undefined,
              combinedProgramme: undefined,

              showBachelorAndMaster: false,
              includePrimaryProgramme: false,

              coursecodes: [],
              from: undefined,
              to: undefined,
            })
          }
          variant="customPopulation"
        />
      ),
    },
  ]

  return (
    <Box>
      {isFetchingPopulation ? (
        <Loading />
      ) : (
        <>
          <PageTitle title={populationName ? `Custom population: ${populationName}` : 'Custom population'}>
            <Box sx={{ display: 'flex', my: 2, alignItems: 'center' }}>
              <Button onClick={resetState} startIcon={<KeyboardBackspaceIcon />} variant="outlined">
                Back to search form
              </Button>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {associatedProgramme ? (
                  <Tooltip title="Degree programme associated with the custom population">
                    <Chip
                      color="primary"
                      icon={<LabelIcon fontSize="small" />}
                      label={studyProgrammes.find(programme => programme.key === associatedProgramme)?.text}
                      sx={{ width: 'fit-content', p: 1, justifySelf: 'center' }}
                      variant="filled"
                    />
                  </Tooltip>
                ) : (
                  <Typography fontStyle="italic">
                    No associated degree programme. Defaults to the latest active degree programme for each student.
                  </Typography>
                )}
              </Box>
              <Box sx={{ width: '220px' }} />
            </Box>
          </PageTitle>
          {(discardedStudentNumbers?.length ?? 0) > 0 && !isFetchingPopulation && (
            <RightsNotification discardedStudentNumbers={discardedStudentNumbers} />
          )}

          {unfilteredPopulationLength === 0 && (
            <StyledMessage sx={{ justifyContent: 'center', width: 'fit-content' }}>
              <Typography>No students found! Please re-check the student number list.</Typography>
            </StyledMessage>
          )}
          {unfilteredPopulationLength > 0 && (
            <Box sx={{ mt: 2 }}>
              <PanelView panels={panels} />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
