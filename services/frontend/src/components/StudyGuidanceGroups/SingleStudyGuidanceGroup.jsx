import moment from 'moment'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Divider, Header, Label } from 'semantic-ui-react'

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
import { CreditGainStats } from '@/components/PopulationDetails/CreditGainStats'
import { PopulationStudentsContainer as PopulationStudents } from '@/components/PopulationStudents'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { startYearToAcademicYear, StyledMessage, Wrapper } from './common'
import { StudyGuidanceGroupPopulationCourses } from './StudyGuidanceGroupPopulationCourses'

const createAcademicYearStartDate = year => new Date(year, 7, 1)

const SingleStudyGroupContent = ({ filteredStudents, filteredCourses, group }) => {
  const { useFilterSelector, filterDispatch } = useFilters()
  const [curriculum, setCurriculum] = useState(null)

  const criteria = useGetProgressCriteriaQuery({
    programmeCode: group?.tags?.studyProgramme ? group?.tags?.studyProgramme : '',
  }).data
  const year = group?.tags?.year

  const programmeCodes = group?.tags?.studyProgramme?.includes('+')
    ? group?.tags?.studyProgramme.split('+')
    : [group?.tags?.studyProgramme]
  const query = {
    studyRights: {
      programme: programmeCodes[0],
      combinedProgramme: programmeCodes[1] ? programmeCodes[1] : undefined,
    },
  }

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const toggleCreditDateFilter = () => {
    if (creditDateFilterActive) {
      filterDispatch(creditDateFilter.actions.reset())
    } else {
      filterDispatch(
        creditDateFilter.actions.setOptions({
          startDate: moment(createAcademicYearStartDate(group.tags?.year)),
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
          {group.tags?.year && (
            <Button onClick={() => toggleCreditDateFilter()} primary>
              {creditDateFilterActive ? 'Show all credits' : 'Show starting from associated year'}
            </Button>
          )}
          <CreditAccumulationGraphHighCharts
            programmeCodes={group?.tags?.studyProgramme ? programmeCodes : []}
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
          />
        </>
      ),
    },
    ((programmeCodes?.length && programmeCodes[0]) || group?.tags?.studyProgramme) && year
      ? {
          title: 'Credit statistics',
          content: !query?.years ? (
            <div>
              <CreditGainStats filteredStudents={filteredStudents} query={query} year={group.tags.year} />
            </div>
          ) : (
            <div>This table is omitted when searching population of multiple years</div>
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
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            setCurriculum={setCurriculum}
            studyProgramme={group.tags?.studyProgramme ? programmeCodes[0] : null}
            year={year}
          />
        </div>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <div>
          <PopulationStudents
            criteria={criteria}
            curriculum={curriculum}
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            studyGuidanceGroup={group}
            variant="studyGuidanceGroupPopulation"
            year={year}
          />
        </div>
      ),
    },
  ]

  return (
    <div style={{ overflowX: 'auto', flexGrow: 1, padding: '1px' }}>
      <PanelView panels={panels} viewTitle="studyguidancegroup" />
    </div>
  )
}

const SingleStudyGroupFilterView = ({ group, population }) => {
  const { data } = useGetSemestersQuery()
  const { semesters: allSemesters } = data ?? { semesters: {} }
  const viewFilters = [
    filters.studentNumberFilter,
    filters.enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      programme: group?.tags?.studyProgramme,
    }),
    filters.ageFilter,
    filters.genderFilter,
    filters.startYearAtUniFilter,
    filters.tagsFilter,
    filters.courseFilter({
      courses: population?.coursestatistics ?? [],
    }),
    filters.creditDateFilter,
    filters.creditsEarnedFilter,
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
                  moment(createAcademicYearStartDate(group.tags?.year)).isBetween(
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
    const programmes = group?.tags?.studyProgramme.includes('+')
      ? group?.tags?.studyProgramme.split('+')
      : [group?.tags?.studyProgramme]
    viewFilters.push(
      filters.hopsFilter({
        programmeCode: programmes[0],
        combinedProgrammeCode: programmes.length > 1 ? programmes[1] : '',
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
    navigate('/studyguidancegroups')
  }

  return (
    <>
      <Wrapper isLoading={isLoading}>
        <Button content="Back" icon="arrow circle left" onClick={handleBack} />
        <Divider />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <Header size="medium" style={{ marginRight: 'auto' }}>
            {group && group.name && getTextIn(group.name)}
          </Header>
          {group.tags?.studyProgramme && (
            <Label
              color="blue"
              content={studyProgrammes.find(programme => programme.value === group.tags.studyProgramme)?.text}
              tag
            />
          )}
          {group.tags?.year && <Label color="blue" content={startYearToAcademicYear(group.tags.year)} tag />}
        </div>
      </Wrapper>
      {children}
    </>
  )
}

export const SingleStudyGuidanceGroupContainer = ({ group }) => {
  // Sorting is needed for RTK query cache to work properly
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber).sort() || []
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
