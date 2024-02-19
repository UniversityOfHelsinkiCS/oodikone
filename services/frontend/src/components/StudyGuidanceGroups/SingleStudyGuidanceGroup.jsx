import React, { useState } from 'react'
import { Button, Header, Divider, Label } from 'semantic-ui-react'
import moment from 'moment'
import _ from 'lodash'
import { useHistory } from 'react-router-dom'

import * as filters from 'components/FilterView/filters'
import { CreditAccumulationGraphHighCharts } from 'components/CreditAccumulationGraphHighCharts'
import { PopulationStudentsContainer as PopulationStudents } from 'components/PopulationStudents'
import { SegmentDimmer } from 'components/SegmentDimmer'
import { useFilters } from 'components/FilterView/useFilters'
import { creditDateFilter, hopsFilter as studyPlanFilter } from 'components/FilterView/filters'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import {
  useGetStudyGuidanceGroupPopulationQuery,
  useGetStudyGuidanceGroupPopulationCoursesQuery,
} from 'redux/studyGuidanceGroups'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import { isMastersProgramme } from 'common'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { AgeStats } from 'components/PopulationDetails/AgeStats'
import { CreditGainStats } from 'components/PopulationDetails/CreditGainStats'
import { PanelView } from 'components/common/PanelView'
import { StudyGuidanceGroupPopulationCourses } from './StudyGuidanceGroupPopulationCourses'
import { startYearToAcademicYear, Wrapper, StyledMessage } from './common'
import { useGetSemestersQuery } from '../../redux/semesters'
import { FilterView } from '../FilterView'

const createAcademicYearStartDate = year => new Date(year, 7, 1)

const SingleStudyGroupContent = ({ filteredStudents, group }) => {
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

  const { data: courses, isLoading: coursesAreLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: _.map(filteredStudents, 'studentNumber'),
    year: group?.tags?.year,
  })

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive)
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

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

  const customStudyStartYear = year ? new Date(`${year}-07-31`) : null

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <>
          {group.tags?.year && (
            <Button primary onClick={() => toggleCreditDateFilter()}>
              {creditDateFilterActive ? 'Show all credits' : 'Show starting from associated year'}
            </Button>
          )}
          <CreditAccumulationGraphHighCharts
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
            programmeCodes={group?.tags?.studyProgramme ? programmeCodes : []}
            customStudyStartYear={customStudyStartYear}
          />
        </>
      ),
    },
    ((programmeCodes?.length && programmeCodes[0]) || group?.tags?.studyProgramme) && year
      ? {
          title: 'Credit statistics',
          content: !query?.years ? (
            <div>
              <CreditGainStats
                query={query}
                filteredStudents={filteredStudents}
                creditDateFilterOptions={creditDateFilterOptions}
                year={group.tags.year}
              />
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
          {coursesAreLoading ? (
            <SegmentDimmer isLoading={coursesAreLoading} />
          ) : (
            <StudyGuidanceGroupPopulationCourses
              courses={courses}
              filteredStudents={filteredStudents}
              studyProgramme={group.tags?.studyProgramme ? programmeCodes[0] : null}
              year={year}
              curriculum={curriculum}
              setCurriculum={setCurriculum}
            />
          )}
        </div>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <div>
          <PopulationStudents
            variant="studyGuidanceGroupPopulation"
            filteredStudents={filteredStudents}
            criteria={criteria}
            studyGuidanceGroup={group}
            curriculum={curriculum}
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

const SingleStudyGroupFilterView = ({ courses, group, population, ...otherProps }) => {
  const semesterQuery = useGetSemestersQuery()
  const allSemesters = semesterQuery.data?.semesters
  const { language } = useLanguage()
  const viewFilters = [
    filters.studentNumberFilter,
    filters.enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      language,
    }),
    filters.ageFilter,
    filters.genderFilter,
    filters.startYearAtUniFilter,
    filters.tagsFilter,
    filters.courseFilter({
      courses: courses?.coursestatistics ?? [],
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
                label: 'Since Assoc. Year',
                description:
                  'Student has had a study right since the start year associated with this study guidance group.',
                predicate: (_student, sre) =>
                  moment(createAcademicYearStartDate(group.tags?.year)).isBetween(
                    sre.startdate,
                    sre.enddate,
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
      filters.studyrightTypeFilter({
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
      filters.graduatedFromProgrammeFilter({
        code: programmes[0],
        combinedProgrammeCode: programmes.length > 1 ? programmes[1] : '',
      })
    )
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
      name={`StudyGuidanceGroup(${group.id})`}
      filters={viewFilters}
      students={population?.students ?? []}
      initialOptions={initialOptions}
    >
      {students => (
        <SingleStudyGroupContent
          courses={courses}
          group={group}
          population={population}
          {...otherProps}
          filteredStudents={students}
        />
      )}
    </FilterView>
  )
}

const SingleStudyGroupViewWrapper = ({ group, isLoading, studyProgrammes, children }) => {
  const history = useHistory()
  const { getTextIn } = useLanguage()
  const handleBack = () => {
    history.push('/studyguidancegroups')
  }

  if (!group) return null

  return (
    <>
      <Wrapper isLoading={isLoading}>
        <Button icon="arrow circle left" content="Back" onClick={handleBack} />
        <Divider />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <Header size="medium" style={{ marginRight: 'auto' }}>
            {group && group.name && getTextIn(group.name)}
          </Header>
          {group.tags?.studyProgramme && (
            <Label tag content={studyProgrammes.find(p => p.value === group.tags.studyProgramme)?.text} color="blue" />
          )}
          {group.tags?.year && <Label tag content={startYearToAcademicYear(group.tags.year)} color="blue" />}
        </div>
      </Wrapper>
      {children}
    </>
  )
}

export const SingleStudyGuidanceGroupContainer = ({ group }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const studyProgrammes = useFilteredAndFormattedElementDetails()
  const { tags } = group
  const { data, isLoading } = useGetStudyGuidanceGroupPopulationQuery({ studentnumberlist: groupStudentNumbers, tags })
  const { data: courses, isLoading: coursesAreLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: groupStudentNumbers,
    year: group?.tags?.year,
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
    <SingleStudyGroupViewWrapper group={group} isLoading={isLoading} studyProgrammes={studyProgrammes}>
      {isLoading || coursesAreLoading ? (
        <SegmentDimmer isLoading />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <SingleStudyGroupFilterView population={data} group={group} courses={courses} />
        </div>
      )}
    </SingleStudyGroupViewWrapper>
  )
}
