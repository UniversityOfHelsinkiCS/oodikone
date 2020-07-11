import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea, Segment, Header, Accordion, Popup, Message } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import ReactMarkdown from 'react-markdown'
import scrollToComponent from 'react-scroll-to-component'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import { getCustomPopulation } from '../../redux/populations'
import {
  getCustomPopulationSearches,
  saveCustomPopulationSearch,
  updateCustomPopulationSearch,
  selectCustomPopulationSearch,
  deleteCustomPopulationSearch
} from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import SearchHistory from '../SearchHistory'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationCourses from './CustomPopulationCourses'
import CustomPopulationProgrammeDist from './CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import InfoBox from '../InfoBox'
import FilterTray from '../FilterTray'
import useFilters from '../FilterTray/useFilters'
import { CustomPopulationFilters } from '../FilterTray/FilterSets'

const CustomPopulation = ({
  getCustomPopulationDispatch,
  getCustomPopulationCoursesByStudentnumbers,
  getCustomPopulationSearchesDispatch,
  saveCustomPopulationSearchDispatch,
  updateCustomPopulationSearchDispatch,
  selectCustomPopulationSearchDispatch,
  deleteCustomPopulationSearchDispatch,
  custompop,
  customPopulationFlag,
  translate,
  loading,
  customPopulationSearches,
  latestCreatedCustomPopulationSearchId,
  customPopulationSearchSaving,
  searchedCustomPopulationSearchId
}) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [activeIndex, setIndex] = useState([])
  const [selectedSearchId, setSelectedSearchId] = useState('')
  const [newestIndex, setNewest] = useState(null)
  const { setAllStudents, filteredStudents } = useFilters()
  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)

  const { onProgress, progress } = useProgress(loading)

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

  const handleNameChange = e => {
    setName(e.target.value)
  }

  const clearForm = () => {
    setName('')
    setInput('')
    setSelectedSearchId('')
  }

  const handleClose = () => {
    setModal(false)
    clearForm()
  }

  const onSave = () => {
    const studentnumberlist = input.match(/[0-9]+/g)
    if (selectedSearchId) {
      updateCustomPopulationSearchDispatch({ id: selectedSearchId, studentnumberlist })
    } else {
      saveCustomPopulationSearchDispatch({ name, studentnumberlist })
    }
  }

  const onDelete = () => {
    if (selectedSearchId) {
      deleteCustomPopulationSearchDispatch({ id: selectedSearchId })
      clearForm()
    }
  }

  const onSelectSearch = selected => {
    if (!selected) {
      clearForm()
      return
    }

    const { id: selectedSearchId } = selected
    const selectedSearch = customPopulationSearches.find(({ id }) => id === selectedSearchId)
    if (selectedSearch) {
      setInput(selectedSearch.students.join('\n'))
      setName(selectedSearch.name)
      setSelectedSearchId(selectedSearch.id)
    }
  }

  const onClicker = e => {
    e.preventDefault()
    const studentnumbers = input.match(/[0-9]+/g)
    getCustomPopulationDispatch({ studentnumberlist: studentnumbers, onProgress })
    getCustomPopulationCoursesByStudentnumbers({ studentnumberlist: studentnumbers })
    selectCustomPopulationSearchDispatch(selectedSearchId || null)
    handleClose()
  }
  const renderCustomPopulationSearch = () => (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)}>
          Custom population
        </Button>
      }
      open={modal}
      onClose={handleClose}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Custom population </h2>
          <Form.Field>
            <em> Insert name for this custom population if you wish to save it </em>
            <Form.Input disabled={!!selectedSearchId} value={name} placeholder="name" onChange={handleNameChange} />
          </Form.Field>
          <Form.Field>
            <em> Insert studentnumbers you wish to use for population here </em>
            <TextArea value={input} placeholder="011111111" onChange={e => setInput(e.target.value)} />
          </Form.Field>
        </Form>
        <SearchHistory
          header="Saved populations"
          items={customPopulationSearches.map(s => ({
            ...s,
            text: s.name,
            timestamp: s.updatedAt,
            params: { id: s.id }
          }))}
          updateItem={() => null}
          handleSearch={onSelectSearch}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          disabled={!name || customPopulationSearchSaving}
          loading={customPopulationSearchSaving}
          floated="left"
          icon="save"
          onClick={onSave}
          content="Save"
        />
        <Button disabled={!selectedSearchId} negative floated="left" icon="trash" onClick={onDelete} content="Delete" />
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive onClick={e => onClicker(e)}>
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )

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
          <>
            {activeIndex.includes(0) ? (
              <>
                {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
              </>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
                  </span>
                }
                position="top center"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.CreditAccumulationGraph.AccordionTitle}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: (
          <div ref={creditGainRef}>
            <CreditAccumulationGraphHighCharts
              students={custompop}
              selectedStudents={selectedStudents}
              translate={translate}
              render={false}
            />
          </div>
        )
      }
    },
    {
      key: 1,
      title: {
        content: (
          <>
            {activeIndex.includes(1) ? (
              <>Programme distribution</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Programme distribution
                  </span>
                }
                position="top center"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
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
          <>
            {activeIndex.includes(2) ? (
              <>Courses of population</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Courses of population
                  </span>
                }
                position="top center"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.CreditDistributionCoursePopulation}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
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
          <>
            {activeIndex.includes(3) ? (
              <>Students ({selectedStudents.length})</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Students ({selectedStudents.length})
                  </span>
                }
                position="top center"
                wide="very"
              >
                <Popup.Content>
                  {' '}
                  <ReactMarkdown
                    source={infotooltips.PopulationStatistics.Students.AccordionTitle}
                    escapeHtml={false}
                  />
                </Popup.Content>
              </Popup>
            )}
          </>
        )
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentRef}>
            <PopulationStudents mandatoryToggle={false} filteredStudents={filteredStudents} customPopulation />
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
        {renderCustomPopulationSearch()}
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
  translate: func.isRequired,
  custompop: arrayOf(shape({})).isRequired,
  customPopulationFlag: bool.isRequired,
  getCustomPopulationDispatch: func.isRequired,
  getCustomPopulationCoursesByStudentnumbers: func.isRequired,
  loading: bool.isRequired,
  customPopulationSearches: arrayOf(shape({})).isRequired,
  customPopulationSearchSaving: bool.isRequired,
  latestCreatedCustomPopulationSearchId: string,
  searchedCustomPopulationSearchId: string,
  saveCustomPopulationSearchDispatch: func.isRequired,
  getCustomPopulationSearchesDispatch: func.isRequired,
  updateCustomPopulationSearchDispatch: func.isRequired,
  selectCustomPopulationSearchDispatch: func.isRequired,
  deleteCustomPopulationSearchDispatch: func.isRequired
}

const mapStateToProps = ({ populations, localize, populationCourses, customPopulationSearch }) => ({
  translate: getTranslate(localize),
  loading: populations.pending,
  custompop: populations.data.students || [],
  courses: populationCourses.data,
  pending: populationCourses.pending,
  customPopulationFlag: populations.customPopulationFlag,
  customPopulationSearches: customPopulationSearch.customPopulationSearches,
  customPopulationSearchSaving: customPopulationSearch.saving,
  latestCreatedCustomPopulationSearchId: customPopulationSearch.latestCreatedCustomPopulationSearchId,
  searchedCustomPopulationSearchId: customPopulationSearch.searchedCustomPopulationSearchId
})

export default connect(
  mapStateToProps,
  {
    getCustomPopulationDispatch: getCustomPopulation,
    getCustomPopulationCoursesByStudentnumbers,
    saveCustomPopulationSearchDispatch: saveCustomPopulationSearch,
    getCustomPopulationSearchesDispatch: getCustomPopulationSearches,
    updateCustomPopulationSearchDispatch: updateCustomPopulationSearch,
    selectCustomPopulationSearchDispatch: selectCustomPopulationSearch,
    deleteCustomPopulationSearchDispatch: deleteCustomPopulationSearch
  }
)(CustomPopulation)
