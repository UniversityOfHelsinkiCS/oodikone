import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import LabelIcon from '@mui/icons-material/Label'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router'

import { FilterView } from '@/components/FilterView'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/material/Loading'
import { useGetCustomPopulationQuery } from '@/redux/populations'

import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { StyledMessage } from '../common/StyledMessage'
import { SingleStudyGuidanceGroupPanels } from './SingleStudyGuidanceGroupPanels'
import { startYearToAcademicYear, useGetFilters } from './utils'

export const SingleStudyGuidanceGroupContainer = ({ group }: { group: GroupsWithTags | undefined }) => {
  // Sorting is needed for RTK query cache to work properly
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber).sort() ?? []
  const { data: population, isLoading } = useGetCustomPopulationQuery({
    studentNumbers: groupStudentNumbers,
    tags: {
      studyProgramme: group?.tags?.studyProgramme,
    },
  })

  const navigate = useNavigate()
  const { getTextIn } = useLanguage()
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()

  const { viewFilters, initialOptions } = useGetFilters(group, population)

  const noGroupMsg =
    "Couldn't find a group with this id! Please check that the id is correct and you have the rights to access this study guidance group."
  const noStudentsMsg = "This study guidance group doesn't contain any students."

  if (!group) {
    return <StyledMessage>{noGroupMsg}</StyledMessage>
  }
  if (!groupStudentNumbers.length) {
    return <StyledMessage>{noStudentsMsg}</StyledMessage>
  }

  const groupProgramme = group.tags?.studyProgramme
  const groupYear = group.tags?.year

  const handleBack = () => {
    void navigate('/studyguidancegroups')
  }

  if (isLoading || population === undefined) {
    return <PageLoading isLoading />
  }

  return (
    <FilterView
      courses={population.coursestatistics}
      displayTray={!!population.coursestatistics}
      filters={viewFilters}
      initialOptions={initialOptions}
      name={`StudyGuidanceGroup(${group.id})`}
      students={population.students}
    >
      {(filteredStudents, filteredCourses) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            p: 2,
            flex: 1,
            mx: 'auto',
            maxWidth: '82vw',
          }}
        >
          <Stack spacing={2} textAlign="center">
            <Grid alignItems="center" container spacing={2}>
              <Grid size={2}>
                <Button
                  onClick={handleBack}
                  startIcon={<KeyboardBackspaceIcon />}
                  sx={{ gridColumn: '1' }}
                  variant="outlined"
                >
                  Back to groups
                </Button>
              </Grid>
              <Grid size={8}>
                <Typography
                  sx={{
                    gridColumn: 2,
                    justifySelf: 'center',
                  }}
                  variant="h4"
                >
                  Study guidance group: {getTextIn(group.name)}
                </Typography>
                <Box display="flex" gap={2} justifyContent="center" my="1rem">
                  {!groupProgramme && !groupYear && (
                    <Typography fontStyle="italic">
                      No associated degree programme or starting year set. Some features are disabled.
                    </Typography>
                  )}
                  {!!groupProgramme && (
                    <Tooltip arrow title="Associated degree programme set for the study guidance group">
                      <Chip
                        color="primary"
                        icon={<LabelIcon fontSize="small" />}
                        label={studyProgrammes.find(programme => programme.value === groupProgramme)?.text}
                        sx={{ p: 1 }}
                        variant="filled"
                      />
                    </Tooltip>
                  )}
                  {!!groupYear && (
                    <Tooltip arrow title="Associated starting academic year set for the study guidance group">
                      <Chip
                        color="primary"
                        icon={<CalendarMonthIcon fontSize="small" />}
                        label={startYearToAcademicYear(groupYear)}
                        sx={{ p: 1 }}
                        variant="filled"
                      />
                    </Tooltip>
                  )}
                </Box>
              </Grid>
              <Grid size={2} /> {/* for alignment */}
            </Grid>
            <SingleStudyGuidanceGroupPanels
              filteredCourses={filteredCourses}
              filteredStudents={filteredStudents}
              group={group}
            />
          </Stack>
        </Box>
      )}
    </FilterView>
  )
}
