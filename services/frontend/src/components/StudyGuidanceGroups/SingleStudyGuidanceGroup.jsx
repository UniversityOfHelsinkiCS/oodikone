import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Button, Header, Accordion, Divider, Label, Segment } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom'
import scrollToComponent from 'react-scroll-to-component'
import { getTextIn } from 'common'
import { useToggle } from 'common/hooks'
import FilterTray from 'components/FilterTray'
import useFilters from 'components/FilterTray/useFilters'
import PopulationStudents from 'components/PopulationStudents'
import CreditAccumulationGraphHighCharts from 'components/CreditAccumulationGraphHighCharts'
import { StudyGuidanceGroupFilters } from 'components/FilterTray/FilterSets'
import { useGetStudyGuidanceGroupPopulationQuery } from 'redux/studyGuidanceGroups'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import StudyGuidanceGroupPopulationCourses from './StudyGuidanceGroupPopulationCourses'
import { startYearToAcademicYear, Wrapper, StyledMessage } from './common'

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

const SingleStudyGroupContent = ({ population, group, language }) => {
  const isMounted = useIsMounted()
  const { setAllStudents, filteredStudents } = useFilters()
  const refs = [useRef(), useRef(), useRef(), useRef()]
  const [activeIndex, setActiveIndex] = useState([])
  const [newestIndex, setNewestIndex] = useState(null)
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
    setAllStudents(population?.students || [])
    togglePanel(0)
  }, [population])

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {filteredStudents.length} students)
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
              students={creditsStartingFromAssociatedYear ? filteredStudentsWithFilteredCourses : filteredStudents}
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
            <StudyGuidanceGroupPopulationCourses
              selectedStudents={filteredStudents.map(({ studentNumber }) => studentNumber)}
              showStructured={coursesStructuredByProgramme}
              toggleShowStructured={toggleCoursesStructuredByProgramme}
              studyProgramme={group.tags?.studyProgramme}
            />
          </div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({filteredStudents.length})
          </span>
        ),
      },
      onTitleClick: () => togglePanel(2),
      content: {
        content: (
          <div ref={refs[2]}>
            <PopulationStudents customPopulation language={language} filteredStudents={filteredStudents} />
          </div>
        ),
      },
    },
  ]

  return (
    <FilterTray filterSet={<StudyGuidanceGroupFilters />}>
      <Segment className="contentSegment">
        <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
      </Segment>
    </FilterTray>
  )
}

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
      {!isLoading && <SingleStudyGroupContent population={data} group={group} language={language} />}
    </SingleStudyGroupViewWrapper>
  )
}

export default SingleStudyGuidanceGroupContainer
