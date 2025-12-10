import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import LabelIcon from '@mui/icons-material/Label'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router'

import { FilterView } from '@/components/FilterView'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/Loading'
import { useGetCustomPopulationQuery } from '@/redux/populations'

import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { PageTitle } from '../common/PageTitle'
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
      coursestatistics={population?.coursestatistics}
      displayTray={!!population.coursestatistics}
      filters={viewFilters}
      initialOptions={initialOptions}
      name={`StudyGuidanceGroup(${group.id})`}
      students={population.students}
    >
      {(filteredStudents, filteredCourses) => (
        <>
          <PageTitle title={`Study guidance group: ${getTextIn(group.name)}`}>
            <Box sx={{ display: 'flex', my: 2, alignItems: 'center' }}>
              <Button
                onClick={handleBack}
                startIcon={<KeyboardBackspaceIcon />}
                sx={{ gridColumn: '1' }}
                variant="outlined"
              >
                Back to groups
              </Button>
              <Box gap={1} sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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
                {!groupProgramme && !groupYear && (
                  <Typography fontStyle="italic">
                    No associated degree programme or starting year set. Some features are disabled.
                  </Typography>
                )}
              </Box>
              <Box sx={{ width: '176px' }} />
            </Box>
          </PageTitle>
          <SingleStudyGuidanceGroupPanels
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            group={group}
          />
        </>
      )}
    </FilterView>
  )
}
