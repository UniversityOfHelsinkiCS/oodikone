import * as filters from 'components/FilterView/filters'
import { Button, Header, Accordion, Divider, Label } from 'semantic-ui-react'
import moment from 'moment'
import CreditAccumulationGraphHighCharts from 'components/CreditAccumulationGraphHighCharts'
import _ from 'lodash'
import { getTextIn } from 'common'
import PopulationStudents from 'components/PopulationStudents'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import scrollToComponent from 'react-scroll-to-component'
import SegmentDimmer from 'components/SegmentDimmer'
import useFilters from 'components/FilterView/useFilters'
import creditDateFilter from 'components/FilterView/filters/date'
import studyPlanFilter from 'components/FilterView/filters/hops'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import {
  useGetStudyGuidanceGroupPopulationQuery,
  useGetStudyGuidanceGroupPopulationCoursesQuery,
} from 'redux/studyGuidanceGroups'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useToggle } from 'common/hooks'
import StudyGuidanceGroupPopulationCourses from './StudyGuidanceGroupPopulationCourses'
import { startYearToAcademicYear, Wrapper, StyledMessage } from './common'
import { useGetSemestersQuery } from '../../redux/semesters'
import FilterView from '../FilterView'

const createAcademicYearStartDate = year => new Date(year, 7, 1)

const useIsMounted = () => {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  return useCallback(() => isMounted.current, [])
}

const useToggleAndSetNewestIndex = ({ defaultValue, indexOfPanelToScroll, setNewestIndex, isMounted }) => {
  const [state, toggle] = useToggle(defaultValue)
  useEffect(() => {
    if (isMounted()) setNewestIndex(indexOfPanelToScroll)
  }, [state])
  return [state, toggle]
}

const SingleStudyGroupContent = ({ filteredStudents, population, group, language }) => {
  const { useFilterSelector, filterDispatch } = useFilters()
  const refs = [useRef(), useRef(), useRef(), useRef()]
  const [activeIndex, setActiveIndex] = useState([])
  const [newestIndex, setNewestIndex] = useState(null)
  const isMounted = useIsMounted()

  const { data: courses, isLoading: coursesAreLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery(
    _.map(filteredStudents, 'studentNumber')
  )

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive)
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

  const [coursesStructuredByProgramme, toggleCoursesStructuredByProgramme] = useToggleAndSetNewestIndex({
    defaultValue: !!group.tags?.studyProgramme,
    indexOfPanelToScroll: 1,
    setNewestIndex,
    isMounted,
  })

  const togglePanel = index => {
    const currentActiveIndex = new Set(activeIndex)
    if (currentActiveIndex.has(index)) {
      currentActiveIndex.delete(index)
    } else {
      currentActiveIndex.add(index)
      setNewestIndex(index)
    }
    setActiveIndex([...currentActiveIndex])
  }

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

  useEffect(() => {
    if (newestIndex) scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
  }, [newestIndex])

  useEffect(() => {
    togglePanel(0)
  }, [population])

  const customStudyStartYear = group?.tags?.year ? new Date(`${group.tags.year}-07-31`) : null

  const createPanels = students => [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {students.length} students)
          </span>
        ),
      },
      onTitleClick: () => togglePanel(0),
      content: {
        content: (
          <div ref={refs[0]}>
            {group.tags?.year && (
              <Button primary onClick={() => toggleCreditDateFilter()}>
                {creditDateFilterActive ? 'Show all credits' : 'Show starting from associated year'}
              </Button>
            )}
            <CreditAccumulationGraphHighCharts
              students={students}
              studyPlanFilterIsActive={studyPlanFilterIsActive}
              programmeCode={group?.tags?.studyProgramme}
              customStudyStartYear={customStudyStartYear}
            />
          </div>
        ),
      },
    },
    {
      key: 1,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
        ),
      },
      onTitleClick: () => togglePanel(1),
      content: {
        content: (
          <div ref={refs[1]}>
            {coursesAreLoading ? (
              <SegmentDimmer isLoading={coursesAreLoading} />
            ) : (
              <StudyGuidanceGroupPopulationCourses
                courses={courses}
                filteredStudents={students}
                showStructured={coursesStructuredByProgramme}
                toggleShowStructured={toggleCoursesStructuredByProgramme}
                studyProgramme={group.tags?.studyProgramme}
              />
            )}
          </div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({students.length})
          </span>
        ),
      },
      onTitleClick: () => togglePanel(2),
      content: {
        content: (
          <div ref={refs[2]}>
            <PopulationStudents
              variant="studyGuidanceGroupPopulation"
              language={language}
              filteredStudents={students}
              studyGuidanceGroup={group}
            />
          </div>
        ),
      },
    },
  ]

  return (
    <div style={{ overflow: 'hidden', flexGrow: 1, padding: '1px' }}>
      <Accordion
        activeIndex={activeIndex}
        exclusive={false}
        styled
        fluid
        panels={createPanels(filteredStudents)}
        style={{ overflow: 'hidden' }}
      />
    </div>
  )
}

const SingleStudyGroupFilterView = props => {
  const semesterQuery = useGetSemestersQuery()
  const allSemesters = semesterQuery.data?.semesters

  const viewFilters = [
    filters.cherrypickFilter,
    filters.enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      language: props.language,
    }),
    filters.ageFilter,
    filters.hopsFilter({ programmeCode: props.group?.tags?.studyProgramme }),
    filters.genderFilter,
    filters.startYearAtUniFilter,
    filters.tagsFilter,
    filters.courseFilter({
      courses: props.courses?.coursestatistics ?? [],
    }),
    filters.creditDateFilter,
    filters.studyTrackFilter,
    filters.programmeFilter({
      additionalModes: props.group?.tags?.year
        ? [
            {
              key: 'assoc-year',
              label: 'Since Assoc. Year',
              description:
                'Student has had a study right since the start year associated with this study guidance group.',
              predicate: (_student, sre) =>
                moment(createAcademicYearStartDate(props.group.tags?.year)).isBetween(
                  sre.startdate,
                  sre.enddate,
                  'day',
                  '[]'
                ),
            },
          ]
        : [],
    }),
  ]

  if (props.group?.tags?.studyProgramme && props.group?.tags?.year && parseInt(props.group.tags.year, 10) >= 2020) {
    viewFilters.push(
      filters.admissionTypeFilter({
        programme: props.group.tags.studyProgramme,
      })
    )
  }

  if (props.group?.tags?.studyProgramme) {
    viewFilters.push(
      filters.graduatedFromProgrammeFilter({
        programme: props.group.tags.studyProgramme,
      })
    )
  }

  const initialOptions = {}

  if (props.group?.tags?.year) {
    initialOptions[filters.creditDateFilter.key] = {
      startDate: moment(createAcademicYearStartDate(props.group.tags?.year)),
    }
    initialOptions[filters.hopsFilter.key] = {
      studyStart: props.group?.tags?.year ? `${props.group.tags.year}-07-31` : null,
      clearCreditDate: true,
    }
  }

  return (
    <FilterView
      name={`StudyGuidanceGroup(${props.group.id})`}
      filters={viewFilters}
      students={props.population?.students ?? []}
      initialOptions={initialOptions}
    >
      {students => <SingleStudyGroupContent {...props} filteredStudents={students} />}
    </FilterView>
  )
}

const SingleStudyGroupViewWrapper = ({ group, language, isLoading, studyProgrammes, children }) => {
  const history = useHistory()
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
            {group && group.name && language && getTextIn(group.name, language)}
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

const SingleStudyGuidanceGroupContainer = ({ group }) => {
  const { language } = useSelector(({ settings }) => settings)
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const studyProgrammes = useFilteredAndFormattedElementDetails(language)
  const { data, isLoading } = useGetStudyGuidanceGroupPopulationQuery(groupStudentNumbers)
  const { data: courses, isLoading: coursesAreLoading } =
    useGetStudyGuidanceGroupPopulationCoursesQuery(groupStudentNumbers)

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
    <SingleStudyGroupViewWrapper
      group={group}
      language={language}
      isLoading={isLoading}
      studyProgrammes={studyProgrammes}
    >
      {isLoading || coursesAreLoading ? (
        <SegmentDimmer isLoading />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <SingleStudyGroupFilterView population={data} language={language} group={group} courses={courses} />
        </div>
      )}
    </SingleStudyGroupViewWrapper>
  )
}

export default SingleStudyGuidanceGroupContainer
