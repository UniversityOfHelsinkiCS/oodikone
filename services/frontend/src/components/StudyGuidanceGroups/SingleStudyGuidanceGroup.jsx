import * as filters from 'components/FilterView/filters'
import { Button, Header, Accordion, Divider, Label, Segment } from 'semantic-ui-react'
import CreditAccumulationGraphHighCharts from 'components/CreditAccumulationGraphHighCharts'
import FilterView from '../FilterView'
import _ from 'lodash'
import { getCustomPopulation, clearPopulations } from '../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import { getSemesters } from '../../redux/semesters' 
import { getTextIn } from 'common'
import InfoBox from 'components/Info/InfoBox'
import infotooltips from '../../common/InfoToolTips'
import PopulationStudents from 'components/PopulationStudents'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import scrollToComponent from 'react-scroll-to-component'
import SegmentDimmer from 'components/SegmentDimmer'
import { startYearToAcademicYear, Wrapper, StyledMessage } from './common'
import StudyGuidanceGroupPopulationCourses from './StudyGuidanceGroupPopulationCourses'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import { useGetStudyGuidanceGroupPopulationQuery, useGetStudyGuidanceGroupPopulationCoursesQuery } from 'redux/studyGuidanceGroups'
import { useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useToggle } from 'common/hooks'

const createAcademicYearStartDate = year => new Date(year, 7, 1)

const takeOnlyCoursesStartingFromGivenAcademicYear = ({ students, year }) => {
  if (!year) return students
  const academicYearStartDate = createAcademicYearStartDate(year)
  return students.map(student => ({
    ...student,
    courses: student.courses.filter(course => new Date(course.date) > academicYearStartDate),
  }))
}

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

const SingleStudyGroupContent = ({ filteredStudents, courses, coursesAreLoading, population, group, language }) => {
  const refs = [useRef(), useRef(), useRef(), useRef()]
  const [activeIndex, setActiveIndex] = useState([])
  const [newestIndex, setNewestIndex] = useState(null)
  const isMounted = useIsMounted()

  const [creditsStartingFromAssociatedYear, toggleCreditsStartingFromAssociatedYear] = useToggleAndSetNewestIndex({
    defaultValue: !!group.tags?.year,
    indexOfPanelToScroll: 0,
    setNewestIndex,
    isMounted,
  })

  const [coursesStructuredByProgramme, toggleCoursesStructuredByProgramme] = useToggleAndSetNewestIndex({
    defaultValue: !!group.tags?.studyProgramme,
    indexOfPanelToScroll: 1,
    setNewestIndex,
    isMounted,
  })

  const filteredStudentsWithFilteredCourses = takeOnlyCoursesStartingFromGivenAcademicYear({
    students: filteredStudents,
    year: group.tags?.year,
  })

  const allSemesters = useSelector(state => state.semesters?.data ?? [])
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getSemesters())
  }, [])

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

  useEffect(() => {
    if (newestIndex) scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
  }, [newestIndex])

  useEffect(() => {
    togglePanel(0)
  }, [population])

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
              <Button primary onClick={() => toggleCreditsStartingFromAssociatedYear()}>
                {creditsStartingFromAssociatedYear ? 'Show all credits' : 'Show starting from associated year'}
              </Button>
            )}
            <CreditAccumulationGraphHighCharts
              students={creditsStartingFromAssociatedYear ? filteredStudentsWithFilteredCourses : students}
              startDate={creditsStartingFromAssociatedYear && createAcademicYearStartDate(group.tags?.year)}
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
            {
              coursesAreLoading
                ? <SegmentDimmer isLoading={coursesAreLoading} />
                : (
                  <StudyGuidanceGroupPopulationCourses
                    courses={courses}
                    selectedStudents={students.map(({ studentNumber }) => studentNumber)}
                    showStructured={coursesStructuredByProgramme}
                    toggleShowStructured={toggleCoursesStructuredByProgramme}
                    studyProgramme={group.tags?.studyProgramme}
                  />
                )
            }
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

  const viewFilters = [
    filters.enrollmentStatusFilter({
      allSemesters,
      language,
    }),
    filters.ageFilter,
    filters.genderFilter,
    filters.startYearAtUniFilter,
    filters.tagsFilter,
    filters.courseFilter({ courses }),
    filters.creditDateFilter,
  ]

  return (
    <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={createPanels(students)} />
  )
}

const SingleStudyGroupFilterView = (props) => {
  const dispatch = useDispatch()
  const allSemesters = useSelector((state) => state.semesters.data?.semesters);

  useEffect(() => {
    dispatch(getSemesters());
  }, []);

  console.log('Courses', props.courses)

  const viewFilters = [
    filters.enrollmentStatusFilter(allSemesters ?? [], props.language),
    filters.ageFilter,
    filters.genderFilter,
    filters.startYearAtUniFilter,
    filters.tagsFilter,
    filters.courseFilter(props.courses),
    filters.creditDateFilter,
  ]

  if (props.group?.tags?.studyProgramme && group?.tags?.year >= 2020) {
    viewFilters.push(
      filters.admissionTypeFilter(),
    );
  }

  if (props.group?.tags?.studyprogramme) {
    viewFilters.push(
      filters.graduatedFromProgrammeFilter(group.tags.studyProgramme),
    );
  }

  return (
    <FilterView filters={viewFilters} students={props.population?.students ?? []}>
      {(students) => (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <FilterTray />
          <SingleStudyGroupContent {...props } filteredStudents={students} />
        </div>
      )}
    </FilterView>
  );
};

const SingleStudyGroupViewWrapper = ({ group, language, isLoading, studyProgrammes, children }) => {
  const history = useHistory()
  const handleBack = () => {
    history.push('/studyguidancegroups')
  }

  return (
    <>
      <Wrapper isLoading={isLoading}>
        <Button icon="arrow circle left" content="Back" onClick={handleBack} />
        <Divider />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <Header size="medium" style={{ marginRight: 'auto' }}>
            {group.name && language && getTextIn(group.name, language)}
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
  const { data: courses, isLoading: coursesAreLoading } = useGetStudyGuidanceGroupPopulationCoursesQuery(groupStudentNumbers)

  if (!group) {
    return (
      <SingleStudyGroupViewWrapper>
        <StyledMessage>
          Couldn't find group with this id! Please check that id is correct and you have rights to this study guidance
          group.
        </StyledMessage>
      </SingleStudyGroupViewWrapper>
    )
  }

  if (groupStudentNumbers.length === 0) {
    return (
      <SingleStudyGroupViewWrapper>
        <StyledMessage>This study guidance group doesn't contain any students.</StyledMessage>
      </SingleStudyGroupViewWrapper>
    )
  }

  return (
    <SingleStudyGroupViewWrapper
      group={group}
      language={language}
      isLoading={isLoading}
      studyProgrammes={studyProgrammes}
    >
      {!isLoading &&
        <SingleStudyGroupFilterView
          population={data}
          language={language}
          group={group}
          courses={courses?.coursestatistics}
          coursesAreLoading={coursesAreLoading}
        />
      }
    </SingleStudyGroupViewWrapper>
  )
}

export default SingleStudyGuidanceGroupContainer
