import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { useNavigate } from 'react-router'

import { isMastersProgramme } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { FilterView } from '@/components/FilterView'
import * as filters from '@/components/FilterView/filters'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { AgeStats } from '@/components/PopulationDetails/AgeStats'
import { CreditStatistics } from '@/components/PopulationDetails/CreditGainStats'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { FormattedStudent, FormattedCourse } from '@oodikone/shared/types'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { useCurriculumState } from '../../hooks/useCurriculums'
import { StyledMessage } from '../common/StyledMessage'
import { startYearToAcademicYear, Wrapper } from './common'
import { useColumns as columnsGeneralTab } from './studentColumns'
import { StudyGuidanceGroupPopulationCourses } from './StudyGuidanceGroupPopulationCourses'

dayjsExtend(isBetween)

const createAcademicYearStartDate = year => new Date(year, 7, 1)

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

  const year = group?.tags?.year

  const [programme, combinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []
  const query = {
    programme,
    combinedProgramme,
    years: year ? [Number(year)] : [],
  }

  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, year!) // TODO: fix year

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const toggleCreditDateFilter = () => {
    if (creditDateFilterActive) {
      filterDispatch(creditDateFilter.actions.reset(undefined))
    } else {
      filterDispatch(
        creditDateFilter.actions.setOptions({
          startDate: dayjs(createAcademicYearStartDate(group.tags?.year)),
          endDate: null,
        })
      )
    }
  }

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <>
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
        </>
      ),
    },
    (programme || group?.tags?.studyProgramme) && year
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
            year={year}
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

                years: year ? [Number(year)] : [],

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
            year={year ?? undefined}
          />
        </div>
      ),
    },
  ]

  return (
    <div style={{ overflowX: 'auto', flexGrow: 1, padding: '1px' }}>
      <PanelView panels={panels} />
    </div>
  )
}

const SingleStudyGroupFilterView = ({ group, population }) => {
  const { data } = useGetSemestersQuery()
  const { semesters: allSemesters } = data ?? { semesters: {} }
  const viewFilters = [
    filters.studentNumberFilter(),
    filters.enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      programme: group?.tags?.studyProgramme,
    }),
    filters.ageFilter(),
    filters.genderFilter(),
    filters.startYearAtUniFilter(),
    filters.tagsFilter(),
    filters.courseFilter({
      courses: population?.coursestatistics ?? [],
    }),
    filters.creditDateFilter(),
    filters.creditsEarnedFilter(),
  ]

  if (!group?.tags?.studyProgramme) {
    viewFilters.push(
      filters.programmeFilter({
        additionalModes: group?.tags?.year
          ? [
              {
                key: 'assoc-year',
                label: 'Since associated year',
                description:
                  'Student has had a study right since the start year associated with this study guidance group.',
                predicate: (_student, studyRightElement) =>
                  dayjs(createAcademicYearStartDate(group.tags?.year)).isBetween(
                    studyRightElement.startDate,
                    studyRightElement.endDate,
                    'day',
                    '[]'
                  ),
              },
            ]
          : [],
      })
    )
  }

  if (group?.tags?.studyProgramme && isMastersProgramme(group.tags.studyProgramme)) {
    viewFilters.push(
      filters.studyRightTypeFilter({
        programme: group.tags.studyProgramme,
        year: group.tags.year,
      })
    )
  }

  if (group?.tags?.studyProgramme && group?.tags?.year && parseInt(group.tags.year, 10) >= 2020) {
    viewFilters.push(
      filters.admissionTypeFilter({
        programme: group.tags.studyProgramme,
      })
    )
  }

  if (group?.tags?.studyProgramme) {
    const programmes = group?.tags?.studyProgramme?.split('+')
    viewFilters.push(
      filters.hopsFilter({
        programmeCode: programmes[0],
        combinedProgrammeCode: programmes[1] ?? '',
      })
    )
    viewFilters.push(filters.studyTrackFilter({ code: programmes[0] }))
  }

  const initialOptions = {}

  if (group?.tags?.year) {
    initialOptions[filters.hopsFilter.key] = {
      studyStart: group?.tags?.year ? `${group.tags.year}-07-31` : null,
      clearCreditDate: true,
    }
  }

  return (
    <FilterView
      courses={population?.coursestatistics ?? []}
      displayTray={!!population?.coursestatistics}
      filters={viewFilters}
      initialOptions={initialOptions}
      name={`StudyGuidanceGroup(${group.id})`}
      students={population?.students ?? []}
    >
      {(filteredStudents, filteredCourses) => (
        <SingleStudyGroupContent filteredCourses={filteredCourses} filteredStudents={filteredStudents} group={group} />
      )}
    </FilterView>
  )
}

const SingleStudyGroupViewWrapper = ({ group, isLoading, children }) => {
  const navigate = useNavigate()
  const { getTextIn } = useLanguage()
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()
  const handleBack = () => {
    void navigate('/studyguidancegroups')
  }

  return (
    <>
      <Wrapper isLoading={isLoading}>
        <Button onClick={handleBack} startIcon={<KeyboardBackspaceIcon />} variant="outlined">
          Back
        </Button>
        <Divider sx={{ margin: 2 }} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <Typography variant="h4">{getTextIn(group?.name)}</Typography>
          {!!group.tags?.studyProgramme && (
            <Chip
              color="primary"
              label={studyProgrammes.find(programme => programme.value === group.tags.studyProgramme)?.text}
              sx={{ width: 'fit-content' }}
              variant="filled"
            />
          )}
          {!!group.tags?.year && (
            <Chip
              color="primary"
              label={startYearToAcademicYear(group.tags.year)}
              sx={{ width: 'fit-content' }}
              variant="filled"
            />
          )}
        </div>
      </Wrapper>
      {children}
    </>
  )
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

  if (!group) {
    return (
      <StyledMessage>
        Couldn't find group with this id! Please check that id is correct and you have rights to this study guidance
        group.
      </StyledMessage>
    )
  }

  if (!groupStudentNumbers.length) {
    return <StyledMessage>This study guidance group doesn't contain any students.</StyledMessage>
  }

  return (
    <SingleStudyGroupViewWrapper group={group} isLoading={isLoading}>
      {isLoading ? (
        <SegmentDimmer isLoading />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <SingleStudyGroupFilterView group={group} population={population} />
        </div>
      )}
    </SingleStudyGroupViewWrapper>
  )
}
