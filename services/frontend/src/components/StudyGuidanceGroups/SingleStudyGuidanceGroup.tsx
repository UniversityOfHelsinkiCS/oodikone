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
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { useNavigate } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { FilterView } from '@/components/FilterView'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/material/Loading'
import { AgeStats } from '@/components/PopulationDetails/AgeStats'
import { CreditStatistics } from '@/components/PopulationDetails/CreditGainStats'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { useGetCustomPopulationQuery } from '@/redux/populations'

import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { FormattedStudent, FormattedCourse } from '@oodikone/shared/types'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { useCurriculumState } from '../../hooks/useCurriculums'
import { StyledMessage } from '../common/StyledMessage'
import { startYearToAcademicYear } from './common'
import { useColumns as columnsGeneralTab } from './studentColumns'
import { StudyGuidanceGroupPopulationCourses } from './StudyGuidanceGroupPopulationCourses'
import { useGetFilters, createAcademicYearStartDate } from './utils'

dayjsExtend(isBetween)

const SingleStudyGroupContent = ({
  filteredStudents,
  filteredCourses,
  group,
}: {
  filteredStudents: FormattedStudent[]
  filteredCourses: FormattedCourse[]
  group: GroupsWithTags
}) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const groupYear = group.tags?.year
  const groupProgramme = group.tags?.studyProgramme

  const [programme, combinedProgramme] = groupProgramme?.split('+') ?? []

  const query = {
    programme,
    combinedProgramme,
    years: groupYear ? [Number(groupYear)] : [],
  }

  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, groupYear!) // TODO: fix year

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const toggleCreditDateFilter = () => {
    if (creditDateFilterActive) {
      filterDispatch(creditDateFilter.actions.reset(undefined))
    } else {
      filterDispatch(
        creditDateFilter.actions.setOptions({
          startDate: dayjs(createAcademicYearStartDate(Number(groupYear))),
          endDate: null,
        })
      )
    }
  }

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <Box>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          {group.tags?.year ? (
            <Button color="primary" onClick={() => toggleCreditDateFilter()} variant="outlined">
              {creditDateFilterActive ? 'Show all credits' : 'Show starting from associated year'}
            </Button>
          ) : null}
          <CreditAccumulationGraphHighCharts
            absences={null}
            endDate={null}
            programmeCodes={group?.tags?.studyProgramme ? [programme, combinedProgramme] : []}
            selectedStudyPlan={null}
            showBachelorAndMaster={null}
            singleStudent={false}
            startDate={null}
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
            studyRightId={null}
          />
        </Box>
      ),
    },
    (programme || group?.tags?.studyProgramme) && groupYear
      ? {
          title: 'Credit statistics',
          content: (
            <div>
              <CreditStatistics filteredStudents={filteredStudents} query={query} />
            </div>
          ),
        }
      : null,
    {
      title: 'Age distribution',
      content: <AgeStats filteredStudents={filteredStudents} query={query} />,
    },
    {
      title: 'Courses of population',
      content: (
        <div>
          <StudyGuidanceGroupPopulationCourses
            curriculum={curriculum}
            curriculumList={curriculumList}
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            setCurriculum={setCurriculum}
            studyProgramme={group.tags?.studyProgramme ? programme : null}
            year={groupYear}
          />
        </div>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <div>
          {/* @ts-expect-error FIX typing */}
          <PopulationStudents
            curriculum={curriculum}
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            generalTabColumnFunction={() => columnsGeneralTab({ group })}
            generalTabFormattingFunction={() =>
              formatGeneralTab({
                variant: 'studyGuidanceGroupPopulation',
                filteredStudents,

                years: groupYear ? [Number(groupYear)] : [],

                programme: group.tags?.studyProgramme?.split('+')[0],
                combinedProgramme: group.tags?.studyProgramme?.split('+')[1],

                showBachelorAndMaster: false,
                includePrimaryProgramme: true,

                coursecodes: [],
                from: undefined,
                to: undefined,
              })
            }
            programme={group.tags?.studyProgramme?.split('+').at(0)}
            studyGuidanceGroup={group}
            variant="studyGuidanceGroupPopulation"
            year={groupYear ?? undefined}
          />
        </div>
      ),
    },
  ]

  return <PanelView panels={panels} />
}

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
            <SingleStudyGroupContent
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
