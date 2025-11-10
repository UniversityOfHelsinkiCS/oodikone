import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import LabelIcon from '@mui/icons-material/Label'
import Box from '@mui/material/Box'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { StyledMessage } from '@/components/common/StyledMessage'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { InfoBox } from '@/components/InfoBox'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { ProgressBar } from '@/components/ProgressBar'
import { RightsNotification } from '@/components/RightsNotification'
import { useProgress } from '@/hooks/progress'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { FormattedCourse, FormattedStudent } from '@oodikone/shared/types'

import { CustomPopulationProgrammeDist } from './CustomPopulationProgrammeDist'
import { useColumns as columnsGeneralTab } from './studentColumns'
import { UnihowDataExport } from './UnihowDataExport'

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
  filteredCourses: FormattedCourse[]
  populationName?: string
  discardedStudentNumbers: string[]
  unfilteredPopulationLength: number
  associatedProgramme?: string | null
  isFetchingPopulation: boolean
  resetState: () => void
}) => {
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  const { progress } = useProgress(isFetchingPopulation)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <CreditAccumulationGraphHighCharts
          absences={null}
          customPopulation
          endDate={null}
          programmeCodes={null}
          selectedStudyPlan={null}
          showBachelorAndMaster={null}
          singleStudent={false}
          startDate={null}
          students={filteredStudents}
          studyPlanFilterIsActive={null} // Atm the filter is not enabled in the view
          studyRightId={null}
        />
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.programmeDistributionCustomPopulation} />
          {/* @ts-expect-error FIX later */}
          <CustomPopulationProgrammeDist students={filteredStudents} />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: (
        <>
          <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
          {/* FIXME:TODO: This is ripped off from CourseTableModeSelector */}
          <Stack direction="row" sx={{ alignItems: 'center', mt: '0.5em' }}>
            <Typography fontWeight={500}>Select all courses with at least</Typography>
            <TextField
              onChange={({ target }) => onStudentAmountLimitChange(target.value)}
              size="small"
              sx={{ maxWidth: '6em' }}
              type="number"
              value={studentAmountLimit}
            />
            <Typography fontWeight={500} sx={{ ml: '1em' }}>
              total students
            </Typography>
          </Stack>
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
      <Box textAlign="center">
        <Typography variant="h4">
          {populationName ? `Custom population: ${populationName}` : 'Custom population'}
        </Typography>
      </Box>

      {isFetchingPopulation ? (
        <ProgressBar progress={progress} />
      ) : (
        <>
          {(discardedStudentNumbers?.length ?? 0) > 0 && !isFetchingPopulation && (
            <RightsNotification discardedStudentNumbers={discardedStudentNumbers} />
          )}

          {unfilteredPopulationLength === 0 && (
            <StyledMessage sx={{ my: 2, justifyContent: 'center', width: 'fit-content' }}>
              <Typography>No students found! Please re-check the student number list.</Typography>
            </StyledMessage>
          )}
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
              ) : null}
            </Box>
            <Box sx={{ width: '220px' }} />
          </Box>
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
