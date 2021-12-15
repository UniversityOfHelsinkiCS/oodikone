import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch, connect } from 'react-redux'
import { Segment, Header, Accordion, Message } from 'semantic-ui-react'
import _ from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import { getCustomPopulationSearches } from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import { getSemesters } from '../../redux/semesters'
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
  tagsFilter,
  creditDateFilter,
  enrollmentStatusFilter,
} from '../FilterView/filters'
import useLanguage from '../LanguagePicker/useLanguage'
import CustomPopulationSearch from './CustomPopulationSearch'
import UnihowDataExport from './UnihowDataExport'

const CustomPopulation = ({ getCustomPopulationSearchesDispatch, getSemestersDispatch }) => {
  const { language } = useLanguage()

  const allSemesters = useSelector(state => state.semesters.data?.semesters || [])
  const courses = useSelector(state => state.populationCourses.data?.coursestatistics)
  const elementDetails = useSelector(state => state.populations.data.elementdetails?.data ?? [])
  const custompop = useSelector(state => state.populations.data?.students || [])

  useTitle('Custom population')

  useEffect(() => {
    getSemestersDispatch()
    getCustomPopulationSearchesDispatch()
  }, [])

  const filters = useMemo(
    () => [
      genderFilter,
      ageFilter,
      courseFilter({ courses }),
      creditsEarnedFilter,
      transferredToProgrammeFilter,
      startYearAtUniFilter,
      tagsFilter,
      programmeFilter({
        courses: courses ? courses.map(c => c.course.code) : [],
        elementDetails,
      }),
      creditDateFilter,
      enrollmentStatusFilter({
        allSemesters: allSemesters ?? [],
        language,
      }),
    ],
    [courses, elementDetails, allSemesters, language]
  )

  return (
    <FilterView name="CustomPopulation" filters={filters} students={custompop}>
      {students => <CustomPopulationContent students={students} custompop={custompop} />}
    </FilterView>
  )
}

const CustomPopulationContent = ({ students, custompop }) => {
  const { language } = useLanguage()
  const [activeIndex, setIndex] = useState([])
  const [newestIndex, setNewest] = useState(null)
  const creditGainRef = useRef()
  const programmeRef = useRef()
  const coursesRef = useRef()
  const studentRef = useRef()
  const refs = [creditGainRef, programmeRef, coursesRef, studentRef]

  const dispatch = useDispatch()

  const { customPopulationSearches, searchedCustomPopulationSearchId } = useSelector(
    state => state.customPopulationSearch
  )

  const courses = useSelector(state => state.populationCourses.data)
  const populations = useSelector(state => state.populations)
  const { customPopulationFlag } = populations

  const { progress } = useProgress(populations.loading)

  const studentsRef = useRef()

  useEffect(() => {
    const studentNumbers = students.map(s => s.studentNumber)

    if (!_.isEqual(studentsRef.current, studentNumbers)) {
      studentsRef.current = studentNumbers

      dispatch(
        getCustomPopulationCoursesByStudentnumbers({
          studentnumberlist: studentNumbers,
        })
      )
    }
  }, [students])

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
            <CreditAccumulationGraphHighCharts students={students} />
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
            <CustomPopulationCourses filteredStudents={students} courses={courses} />
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
        <Header className="segmentTitle" size="large" textAlign="center">
          Custom population
          {searchedCustomPopulationSearchId
            ? ` "${customPopulationSearches.find(({ id }) => id === searchedCustomPopulationSearchId).name}"`
            : ''}
        </Header>
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
      <CustomPopulationSearch />
      {custompop.length > 0 && customPopulationFlag ? (
        <Segment className="contentSegment">{renderCustomPopulation(students)}</Segment>
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
    </div>
  )
}

const mapStateToProps = ({ populations, populationCourses, customPopulationSearch, semesters }) => ({
  loading: populations.pending,
  custompop: populations.data.students || [],
  courses: populationCourses.data?.coursestatistics,
  customPopulationFlag: populations.customPopulationFlag,
  customPopulationSearches: customPopulationSearch.customPopulationSearches,
  latestCreatedCustomPopulationSearchId: customPopulationSearch.latestCreatedCustomPopulationSearchId,
  searchedCustomPopulationSearchId: customPopulationSearch.searchedCustomPopulationSearchId,
  elementDetails: populations.data.elementdetails?.data ?? [],
  allSemesters: semesters.data?.semesters || [],
})

export default connect(mapStateToProps, {
  getCustomPopulationCoursesByStudentnumbers,
  getCustomPopulationSearchesDispatch: getCustomPopulationSearches,
  getSemestersDispatch: getSemesters,
})(CustomPopulation)
