import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { useSelector, useDispatch } from 'react-redux'
import { Segment, Header, Accordion, Message, Label } from 'semantic-ui-react'
import _ from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import semestersApi from 'redux/semesters'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'

import RightsNotification from 'components/RightsNotification'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import { getCustomPopulationSearches } from '../../redux/customPopulationSearch'
import { useGetStudentListCourseStatisticsQuery } from '../../redux/populationCourses'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationCourses from './CustomPopulationCourses'
import CustomPopulationProgrammeDist from './CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import InfoBox from '../Info/InfoBox'
import FilterView from '../FilterView'
import {
  ageFilter,
  courseFilter,
  programmeFilter,
  creditsEarnedFilter,
  genderFilter,
  transferredToProgrammeFilter,
  startYearAtUniFilter,
  hopsFilter,
  tagsFilter,
  creditDateFilter,
  enrollmentStatusFilter,
} from '../FilterView/filters'
import useLanguage from '../LanguagePicker/useLanguage'
import CustomPopulationSearch from './CustomPopulationSearch'
import UnihowDataExport from './UnihowDataExport'

const selectCustomPopulationData = createSelector(
  semestersApi.endpoints.getSemesters.select(),
  state => state.populations.data,
  (semesters, populations) => ({
    allSemesters: semesters?.data?.semesters ?? [],
    custompop: populations?.students ?? [],
    studyProgramme: populations?.studyProgramme,
  })
)

const CustomPopulation = () => {
  const { language } = useLanguage()
  const dispatch = useDispatch()

  const { allSemesters, custompop, studyProgramme: associatedProgramme } = useSelector(selectCustomPopulationData)

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: custompop.map(s => s.studentNumber),
  })
  useTitle('Custom population')

  useEffect(() => {
    dispatch(getCustomPopulationSearches())
  }, [])

  const filters = useMemo(() => {
    const filtersList = [
      genderFilter,
      ageFilter,
      courseFilter({ courses: courseStats?.coursestatistics ?? [] }),
      creditsEarnedFilter,
      transferredToProgrammeFilter,
      startYearAtUniFilter,
      tagsFilter,
      programmeFilter,
      creditDateFilter,
      enrollmentStatusFilter({
        allSemesters: allSemesters ?? [],
        language,
      }),
    ]
    if (associatedProgramme) {
      filtersList.push(hopsFilter({ programmeCode: associatedProgramme, combinedProgrammeCode: '' }))
    }
    return filtersList
  }, [courseStats, allSemesters, associatedProgramme, language])

  return (
    <FilterView name="CustomPopulation" filters={filters} students={custompop} displayTray={custompop.length > 0}>
      {students => <CustomPopulationContent students={students} custompop={custompop} />}
    </FilterView>
  )
}

const CustomPopulationContent = ({ students, custompop }) => {
  const { language } = useLanguage()
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)
  const [studentsInput, setStudentsInput] = useState(null)
  const [discardedStudentNumbers, setDiscarded] = useState([])
  const studyProgrammes = useFilteredAndFormattedElementDetails(language)
  const creditGainRef = useRef()
  const programmeRef = useRef()
  const coursesRef = useRef()
  const studentRef = useRef()
  const refs = [creditGainRef, programmeRef, coursesRef, studentRef]
  const { customPopulationSearches, searchedCustomPopulationSearchId } = useSelector(
    state => state.customPopulationSearch
  )

  const populations = useSelector(state => state.populations)
  const { customPopulationFlag } = populations

  const { progress } = useProgress(populations.pending)

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: students.map(s => s.studentNumber),
  })

  useEffect(() => {
    setDiscarded(
      _.difference(
        studentsInput,
        students.map(s => s.studentNumber)
      )
    )
  }, [studentsInput, students])

  useEffect(() => {
    if (newestIndex) {
      scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
    }
  }, [activeIndex])

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
  const createPanels = () => [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {students.length} students)
          </span>
        ),
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: (
          <div ref={creditGainRef}>
            <CreditAccumulationGraphHighCharts students={students} customPopulation />
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
            <CustomPopulationProgrammeDist samples={students} selectedStudents={_.map(students, 'studentNumber')} />
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
            <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
            <CustomPopulationCourses filteredStudents={students} courses={courseStats} />
          </div>
        ),
      },
    },
    {
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({students.length})
          </span>
        ),
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents
              variant="customPopulation"
              language={language}
              filteredStudents={students}
              dataExport={<UnihowDataExport students={students} />}
              customPopulation
            />
          </div>
        ),
      },
    },
  ]

  const renderCustomPopulation = () => (
    <div>
      {custompop && (
        <div style={{ width: '40%', margin: 'auto', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          <Header className="segmentTitle" size="large" textAlign="center">
            Custom population
            {searchedCustomPopulationSearchId
              ? ` "${customPopulationSearches.find(({ id }) => id === searchedCustomPopulationSearchId).name}"`
              : ''}
          </Header>{' '}
          {populations.data.studyProgramme && (
            <Label
              style={{ marginLeft: '2em' }}
              tag
              color="blue"
              content={studyProgrammes.find(p => p.key === populations.data.studyProgramme).text}
            />
          )}
        </div>
      )}
      <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={createPanels()} />
    </div>
  )

  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px' }}>
        <Message.Header>Custom population</Message.Header>
        <p>
          Here you can create custom population using a list of studentnumbers. Clicking the blue custom population
          button will open a modal where you can enter a list of studentnumbers. You can also save a custom population
          by giving it a name and clicking the save button in the modal. It will then appear in the saved populations
          list. These populations are personal meaning that they will only show to you. You can only search
          studentnumbers you have access rights to i.e. you have rights to the programme they are in.
        </p>
      </Message>
      {discardedStudentNumbers?.length > 0 && !populations.pending && (
        <RightsNotification discardedStudentNumbers={discardedStudentNumbers} />
      )}
      <CustomPopulationSearch setStudentsInput={setStudentsInput} />
      {custompop.length > 0 && customPopulationFlag ? (
        <Segment className="contentSegment">{renderCustomPopulation()}</Segment>
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
    </div>
  )
}

export default CustomPopulation
