import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea, Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import { intersection, difference } from 'lodash'
import { getUserIsAdmin, useProgress } from '../../common'
import { getCustomPopulation } from '../../redux/populations'
import {
  getCustomPopulationSearches,
  saveCustomPopulationSearch,
  updateCustomPopulationSearch
} from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import { clearPopulationFilters } from '../../redux/populationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import SearchHistory from '../SearchHistory'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationFilters from '../CustomPopulationFilters'
import CustomPopulationCourses from '../CustomPopulationCourses'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'

const CustomPopulation = ({
  getCustomPopulationDispatch,
  getCustomPopulationCoursesByStudentnumbers,
  getCustomPopulationSearchesDispatch,
  saveCustomPopulationSearchDispatch,
  updateCustomPopulationSearchDispatch,
  custompop,
  translate,
  isAdmin,
  selectedStudents,
  clearPopulationFiltersDispatch,
  loading,
  customPopulationSearches,
  latestCreatedcustomPopulationSearchId,
  customPopulationSearchSaving
}) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [selectedSearchId, setSelectedSearchId] = useState('')
  const { onProgress, progress } = useProgress(loading)

  useEffect(() => {
    getCustomPopulationSearchesDispatch()
  }, [])

  useEffect(() => {
    if (latestCreatedcustomPopulationSearchId) {
      setSelectedSearchId(latestCreatedcustomPopulationSearchId)
    }
  }, [latestCreatedcustomPopulationSearchId])

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
    clearPopulationFiltersDispatch()
    handleClose()
  }
  const renderCustomPopulationSearch = () => (
    <Modal
      trigger={
        <Button size="small" onClick={() => setModal(true)}>
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
        <Button negative onClick={handleClose}>
          Cancel
        </Button>
        <Button positive onClick={e => onClicker(e)}>
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )

  const renderCustomPopulation = () => (
    <div>
      <Segment>
        <CustomPopulationFilters samples={custompop} />
        <Segment>
          <Header size="medium" dividing>
            {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
          </Header>
          <CreditAccumulationGraphHighCharts
            students={custompop}
            selectedStudents={selectedStudents}
            translate={translate}
          />
        </Segment>
      </Segment>
      <Segment>
        <Header>Programme distribution</Header>
        <CustomPopulationProgrammeDist samples={custompop} selectedStudents={selectedStudents} />
      </Segment>
      <CustomPopulationCourses selectedStudents={selectedStudents} />
      <PopulationStudents samples={custompop} selectedStudents={selectedStudents} />
    </div>
  )

  if (!isAdmin) return <div>you are not an admin, go away</div>

  return (
    <div>
      {renderCustomPopulationSearch()}
      {custompop.length > 0 ? (
        renderCustomPopulation()
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
    </div>
  )
}

CustomPopulation.defaultProps = {
  latestCreatedcustomPopulationSearchId: null
}

CustomPopulation.propTypes = {
  translate: func.isRequired,
  custompop: arrayOf(shape({})).isRequired,
  getCustomPopulationDispatch: func.isRequired,
  getCustomPopulationCoursesByStudentnumbers: func.isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  isAdmin: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  loading: bool.isRequired,
  customPopulationSearches: arrayOf(shape({})).isRequired,
  customPopulationSearchSaving: bool.isRequired,
  latestCreatedcustomPopulationSearchId: string,
  saveCustomPopulationSearchDispatch: func.isRequired,
  getCustomPopulationSearchesDispatch: func.isRequired,
  updateCustomPopulationSearchDispatch: func.isRequired
}

const mapStateToProps = ({
  populationFilters,
  populations,
  localize,
  populationCourses,
  auth: {
    token: { roles }
  },
  customPopulationSearch
}) => {
  const samples = populations.data.students ? populations.data.students : []
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []
  const { complemented } = populationFilters

  if (samples.length > 0 && populationFilters.filters.length > 0) {
    const studentsForFilter = f => {
      return samples.filter(f.filter).map(s => s.studentNumber)
    }

    const matchingStudents = populationFilters.filters.map(studentsForFilter)
    selectedStudents = intersection(...matchingStudents)

    if (complemented) {
      selectedStudents = difference(samples.map(s => s.studentNumber), selectedStudents)
    }
  }

  return {
    translate: getTranslate(localize),
    loading: populations.pending,
    custompop: populations.data.students || [],
    courses: populationCourses.data,
    pending: populationCourses.pending,
    isAdmin: getUserIsAdmin(roles),
    selectedStudents,
    customPopulationSearches: customPopulationSearch.customPopulationSearches,
    customPopulationSearchSaving: customPopulationSearch.saving,
    latestCreatedcustomPopulationSearchId: customPopulationSearch.latestCreatedcustomPopulationSearchId
  }
}

export default connect(
  mapStateToProps,
  {
    getCustomPopulationDispatch: getCustomPopulation,
    getCustomPopulationCoursesByStudentnumbers,
    clearPopulationFiltersDispatch: clearPopulationFilters,
    saveCustomPopulationSearchDispatch: saveCustomPopulationSearch,
    getCustomPopulationSearchesDispatch: getCustomPopulationSearches,
    updateCustomPopulationSearchDispatch: updateCustomPopulationSearch
  }
)(CustomPopulation)
