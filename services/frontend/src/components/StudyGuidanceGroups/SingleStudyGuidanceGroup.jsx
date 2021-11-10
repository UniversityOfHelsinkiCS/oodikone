import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Button, Header, Accordion, Divider } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom'
import scrollToComponent from 'react-scroll-to-component'
import { getTextIn } from 'common'
import { useToggle } from 'common/hooks'
import FilterTray from 'components/FilterTray'
import useFilters from 'components/FilterTray/useFilters'
import CreditAccumulationGraphHighCharts from 'components/CreditAccumulationGraphHighCharts'
import { StudyGuidanceGroupFilters } from 'components/FilterTray/FilterSets'
import { useGetStudyGuidanceGroupPopulationQuery } from 'redux/studyGuidanceGroups'
import StudyGuidanceGroupPopulationCourses from './StudyGuidanceGroupPopulationCourses'
import Wrapper from './Wrapper'
import StyledMessage from './StyledMessage'

const createAcademicYearStartDate = year => new Date(year, 7, 1)

const takeOnlyCoursesStartingFromGivenAcademicYear = ({ students, year }) => {
  if (!year) return students
  const academicYearStartDate = createAcademicYearStartDate(year)
  return students.map(student => ({
    ...student,
    courses: student.courses.filter(course => new Date(course.date) > academicYearStartDate),
  }))
}

const SingleStudyGroupContent = ({ population, group }) => {
  const { setAllStudents, filteredStudents } = useFilters()
  const refs = [useRef(), useRef(), useRef(), useRef()]
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)
  const [creditsStartingFromAssociatedYear, toggleCreditsStartingFromAssociatedYear] = useToggle(!!group.tags?.year)
  const [coursesStructuredByProgramme, toggleCoursesStructuredByProgramme] = useToggle(!!group.tags?.studyProgramme)
  const filteredStudentsWithFilteredCourses = takeOnlyCoursesStartingFromGivenAcademicYear({
    students: filteredStudents,
    year: group.tags?.year,
  })

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(
        indexes.findIndex(ind => ind === index),
        1
      )
    } else {
      indexes.push(index)
    }
    if (activeIndex.length < indexes.length) setNewest(index)
    else setNewest(null)
    setIndex(indexes)
  }

  useEffect(() => {
    setAllStudents(population?.students || [])
    handleClick(0)
  }, [population])

  useEffect(() => {
    if (newestIndex) {
      scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
    }
  }, [activeIndex])

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
      onTitleClick: () => handleClick(0),
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
      onTitleClick: () => handleClick(1),
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
  ]

  return (
    <FilterTray filterSet={<StudyGuidanceGroupFilters />}>
      <div className="segmentContainer">
        <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
      </div>
    </FilterTray>
  )
}

const SingleStudyGroupViewWrapper = ({ groupName, language, isLoading, children }) => {
  const history = useHistory()
  const handleBack = () => {
    history.push('/studyguidancegroups')
  }

  return (
    <>
      <Wrapper isLoading={isLoading}>
        <Button icon="arrow circle left" content="Back" onClick={handleBack} />
        <Divider />
        <Header size="medium">{groupName && language && getTextIn(groupName, language)}</Header>
      </Wrapper>
      {children}
    </>
  )
}

const SingleStudyGuidanceGroupContainer = ({ group }) => {
  const { language } = useSelector(({ settings }) => settings)
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
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
    <SingleStudyGroupViewWrapper groupName={group.name} language={language} isLoading={isLoading}>
      {!isLoading && <SingleStudyGroupContent population={data} group={group} language={language} />}
    </SingleStudyGroupViewWrapper>
  )
}

export default SingleStudyGuidanceGroupContainer
