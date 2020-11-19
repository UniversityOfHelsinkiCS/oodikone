import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Accordion, Message } from 'semantic-ui-react'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import scrollToComponent from 'react-scroll-to-component'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import { getCustomPopulationSearches } from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationCourses from './CustomPopulationCourses'
import CustomPopulationProgrammeDist from './CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import InfoBox from '../InfoBox'
import FilterTray from '../FilterTray'
import useFilters from '../FilterTray/useFilters'
import { CustomPopulationFilters } from '../FilterTray/FilterSets'
import useFilterTray from '../FilterTray/useFilterTray'
import useLanguage from '../LanguagePicker/useLanguage'
import CustomPopulationSearch from './CustomPopulationSearch'

const CustomPopulation = ({
  getCustomPopulationSearchesDispatch,
  custompop,
  customPopulationFlag,
  loading,
  customPopulationSearches,
  latestCreatedCustomPopulationSearchId,
  searchedCustomPopulationSearchId
}) => {
  const { language } = useLanguage()
  const [activeIndex, setIndex] = useState([])
  const [, setSelectedSearchId] = useState('')
  const [newestIndex, setNewest] = useState(null)
  const { setAllStudents, filteredStudents } = useFilters()
  const [trayOpen] = useFilterTray()
  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)

  const { progress } = useProgress(loading)

  const creditGainRef = useRef()
  const programmeRef = useRef()
  const coursesRef = useRef()
  const studentRef = useRef()
  const refs = [creditGainRef, programmeRef, coursesRef, studentRef]

  useTitle('Custom population')

  // Pass students to filter context.
  useEffect(() => {
    setAllStudents(custompop || [])
  }, [custompop])

  useEffect(() => {
    getCustomPopulationSearchesDispatch()
  }, [])

  useEffect(() => {
    if (newestIndex) {
      scrollToComponent(refs[newestIndex].current, { align: 'bottom' })
    }
  }, [activeIndex])

  useEffect(() => {
    if (latestCreatedCustomPopulationSearchId) {
      setSelectedSearchId(latestCreatedCustomPopulationSearchId)
    }
  }, [latestCreatedCustomPopulationSearchId])

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(indexes.findIndex(ind => ind === index), 1)
    } else {
      indexes.push(index)
    }
    if (activeIndex.length < indexes.length) setNewest(index)
    else setNewest(null)
    setIndex(indexes)
  }

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {selectedStudents.length} students)
          </span>
        )
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
        )
      }
    },
    {
      key: 1,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Programme distribution
          </span>
        )
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: (
          <div ref={programmeRef}>
            <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
            <CustomPopulationProgrammeDist samples={custompop} selectedStudents={selectedStudents} />
          </div>
        )
      }
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
        )
      },
      onTitleClick: () => handleClick(2),
      content: {
        content: (
          <div ref={coursesRef}>
            <CustomPopulationCourses selectedStudents={selectedStudents} />
          </div>
        )
      }
    },
    {
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({selectedStudents.length})
          </span>
        )
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents
              language={language}
              mandatoryToggle={false}
              filteredStudents={filteredStudents}
              customPopulation
            />
          </div>
        )
      }
    }
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
      <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
    </div>
  )

  return (
    <FilterTray filterSet={<CustomPopulationFilters />}>
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
          <Segment className="contentSegment">{renderCustomPopulation()}</Segment>
        ) : (
          <Segment className="contentSegment">
            <ProgressBar progress={progress} />
          </Segment>
        )}
      </div>
    </FilterTray>
  )
}

CustomPopulation.defaultProps = {
  latestCreatedCustomPopulationSearchId: null,
  searchedCustomPopulationSearchId: null
}

CustomPopulation.propTypes = {
  custompop: arrayOf(shape({})).isRequired,
  customPopulationFlag: bool.isRequired,
  loading: bool.isRequired,
  customPopulationSearches: arrayOf(shape({})).isRequired,
  latestCreatedCustomPopulationSearchId: string,
  searchedCustomPopulationSearchId: string,
  getCustomPopulationSearchesDispatch: func.isRequired
}

const mapStateToProps = ({ populations, populationCourses, customPopulationSearch }) => ({
  loading: populations.pending,
  custompop: populations.data.students || [],
  courses: populationCourses.data,
  customPopulationFlag: populations.customPopulationFlag,
  customPopulationSearches: customPopulationSearch.customPopulationSearches,
  latestCreatedCustomPopulationSearchId: customPopulationSearch.latestCreatedCustomPopulationSearchId,
  searchedCustomPopulationSearchId: customPopulationSearch.searchedCustomPopulationSearchId
})

export default connect(
  mapStateToProps,
  {
    getCustomPopulationCoursesByStudentnumbers,
    getCustomPopulationSearchesDispatch: getCustomPopulationSearches
  }
)(CustomPopulation)
