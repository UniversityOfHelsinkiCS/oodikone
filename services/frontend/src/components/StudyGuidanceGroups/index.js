/* eslint-disable react/prop-types */
// temp disable prop types
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useRouteMatch, useHistory } from 'react-router-dom'
import { Button, Loader, Segment, Message, Header, Accordion, Divider } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import { useProgress, useTitle } from '../../common/hooks'
import { getStudyGuidanceGroups } from '../../redux/studyGuidanceGroups'
import SortableTable from '../SortableTable'
import { getTextIn } from '../../common'
import { getCustomPopulation } from '../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
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

const SingleStudyGroupView = ({ group }) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const { data, pending } = useSelector(state => state.populations)
  const { language } = useSelector(state => state.settings)
  const custompop = data.students || []
  const { onProgress } = useProgress(pending)
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
    if (!custompop || custompop.length === 0) return
    setAllStudents(custompop)
    handleClick(0)
  }, [custompop])

  useEffect(() => {
    if (!group) return
    const studentnumberlist = group.members.map(({ personStudentNumber }) => personStudentNumber)
    dispatch(getCustomPopulation({ studentnumberlist, onProgress }))
    dispatch(getCustomPopulationCoursesByStudentnumbers({ studentnumberlist }))
  }, [group])

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

  if (!group) return null

  return (
    <div>
      <Button icon="arrow circle left" content="Back" onClick={() => history.push('/studyguidancegroups')} />
      <Divider />
      <FilterTray filterSet={<CustomPopulationFilters />}>
        <div className="segmentContainer">
          <Segment className="contentSegment">
            {pending ? <Loader active>Loading</Loader> : null}
            {!pending && custompop ? (
              <>
                <Header className="segmentTitle" size="medium" textAlign="center">
                  Population of group {getTextIn(group.name, language)}
                </Header>
                <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
              </>
            ) : null}
          </Segment>
        </div>
      </FilterTray>
    </div>
  )
}

const StudyGuidanceGroupOverview = ({ groups }) => {
  const { language } = useSelector(state => state.settings)
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: group => getTextIn(group.name, language),
      getRowContent: group => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/studyguidancegroups/${group.id}`}
        >
          {getTextIn(group.name, language)}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
  ]
  return !groups || groups.length === 0 ? (
    <Message>You do not have access to any study guidance groups</Message>
  ) : (
    <SortableTable columns={headers} getRowKey={group => group.id} data={groups} />
  )
}

const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const dispatch = useDispatch()
  const { pending, data } = useSelector(state => state.studyGuidanceGroups)
  const match = useRouteMatch('/studyguidancegroups/:groupid')
  const groupid = match?.params?.groupid

  useEffect(() => {
    dispatch(getStudyGuidanceGroups())
  }, [])

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Study guidance groups
      </Header>
      <Segment className="contentSegment">
        {pending ? <Loader active>Loading</Loader> : null}
        {!pending && !groupid ? <StudyGuidanceGroupOverview groups={data} /> : null}
        {!pending && groupid ? <SingleStudyGroupView group={data.find(g => g.id === groupid)} /> : null}
      </Segment>
    </div>
  )
}

export default StudyGuidanceGroups
