/* eslint-disable react/prop-types */
// temp disable prop types
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Loader, Header, Accordion, Divider, Segment } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom'
import scrollToComponent from 'react-scroll-to-component'
import { getCustomPopulation } from '../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import StyledMessage from './StyledMessage'
import { getTextIn } from '../../common'
import FilterTray from '../FilterTray'
import useFilters from '../FilterTray/useFilters'
import { CustomPopulationFilters } from '../FilterTray/FilterSets'
import useFilterTray from '../FilterTray/useFilterTray'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import CustomPopulationProgrammeDist from '../CustomPopulation/CustomPopulationProgrammeDist'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'

const SingleStudyGroupContent = ({ population, language }) => {
  const custompop = population?.students || []
  const { setAllStudents, filteredStudents } = useFilters()
  const [trayOpen] = useFilterTray()
  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)
  const creditGainRef = useRef()
  const programmeRef = useRef()
  const coursesRef = useRef()
  const studentRef = useRef()
  const refs = [creditGainRef, programmeRef, coursesRef, studentRef]
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)

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
    setAllStudents(custompop)
    handleClick(0)
  }, [custompop])

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
            Credit accumulation (for {selectedStudents.length} students)
          </span>
        ),
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: (
          <div ref={creditGainRef}>
            <CreditAccumulationGraphHighCharts
              students={custompop}
              selectedStudents={selectedStudents}
              render={false}
              trayOpen={trayOpen}
              language={language}
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
            Programme distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: (
          <div ref={programmeRef}>
            <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
            <CustomPopulationProgrammeDist samples={custompop} selectedStudents={selectedStudents} />
          </div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
        ),
      },
      onTitleClick: () => handleClick(2),
      content: {
        content: (
          <div ref={coursesRef}>
            <CustomPopulationCourses selectedStudents={selectedStudents} />
          </div>
        ),
      },
    },
    {
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({selectedStudents.length})
          </span>
        ),
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents language={language} filteredStudents={filteredStudents} customPopulation />
          </div>
        ),
      },
    },
  ]

  return (
    <FilterTray filterSet={<CustomPopulationFilters />}>
      <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
    </FilterTray>
  )
}

const SingleStudyGroupViewWrapper = ({ history, groupName, language, children }) => {
  return (
    <>
      <div className="segmentContainer">
        <Segment className="contentSegment">
          <Button icon="arrow circle left" content="Back" onClick={() => history.push('/studyguidancegroups')} />
          <Divider />
          <Header size="medium">{getTextIn(groupName, language)}</Header>
        </Segment>
      </div>
      {children}
    </>
  )
}

const SingleStudyGuidanceGroupContainer = ({ groupid }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const { language } = useSelector(({ settings }) => settings)
  const { data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
  const group = groups.find(g => g.id === groupid)
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const { data: population, pending } = useSelector(({ populations }) => populations)

  useEffect(() => {
    if (!group) return
    const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
    if (groupStudentNumbers.length === 0) return
    dispatch(getCustomPopulation({ studentnumberlist: groupStudentNumbers, usingStudyGuidanceGroups: true }))
    dispatch(
      getCustomPopulationCoursesByStudentnumbers({
        studentnumberlist: groupStudentNumbers,
        usingStudyGuidanceGroups: true,
      })
    )
  }, [])

  if (!group) {
    return (
      <StyledMessage>
        Couldn't find group with id {groupid}! Please check that id is correct and you have rights to this study
        guidance group.
      </StyledMessage>
    )
  }

  const isLoading = pending === undefined || pending === true
  const isLoaded = pending === false && Object.keys(population).length > 0
  const renderMessage = groupStudentNumbers.length === 0
  const renderLoader = groupStudentNumbers.length > 0 && isLoading
  const renderGroup = groupStudentNumbers.length > 0 && isLoaded

  return (
    <SingleStudyGroupViewWrapper history={history} groupName={group.name} language={language}>
      {renderMessage ? <StyledMessage>This study guidance group doesn't contain any students.</StyledMessage> : null}
      {renderLoader ? (
        <Loader active inline="centered">
          Loading
        </Loader>
      ) : null}
      {renderGroup ? <SingleStudyGroupContent population={population} language={language} /> : null}
    </SingleStudyGroupViewWrapper>
  )
}

export default SingleStudyGuidanceGroupContainer
