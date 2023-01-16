import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea } from 'semantic-ui-react'
import { shape, func, arrayOf, bool } from 'prop-types'
import { useProgress, useTitle } from '../../common/hooks'
import { getCustomPopulation } from '../../redux/populations'
import {
  getCustomPopulationSearches,
  saveCustomPopulationSearch,
  updateCustomPopulationSearch,
  selectCustomPopulationSearch,
  deleteCustomPopulationSearch,
} from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import SearchHistory from '../SearchHistory'

const CustomPopulationSearch = ({
  getCustomPopulationDispatch,
  getCustomPopulationCoursesByStudentnumbers,
  getCustomPopulationSearchesDispatch,
  saveCustomPopulationSearchDispatch,
  updateCustomPopulationSearchDispatch,
  selectCustomPopulationSearchDispatch,
  deleteCustomPopulationSearchDispatch,
  loading,
  customPopulationSearches,
  customPopulationSearchSaving,
}) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [selectedSearchId, setSelectedSearchId] = useState('')

  const { onProgress } = useProgress(loading)

  useTitle('Custom population')

  useEffect(() => {
    getCustomPopulationSearchesDispatch()
  }, [])

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
    const studentnumbers = input.match(/[0-9]+/g).map(sNumber => (sNumber.length === 8 ? `0${sNumber}` : sNumber))
    getCustomPopulationDispatch({ studentnumberlist: studentnumbers, onProgress })
    getCustomPopulationCoursesByStudentnumbers({ studentnumberlist: studentnumbers })
    selectCustomPopulationSearchDispatch(selectedSearchId || null)
    handleClose()
  }

  return (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)} data-cy="custom-pop-search-button">
          Custom population
        </Button>
      }
      open={modal}
      onClose={handleClose}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Custom population new</h2>
          <Form.Field>
            <em> Insert name for this custom population if you wish to save it </em>
            <Form.Input disabled={!!selectedSearchId} value={name} placeholder="name" onChange={handleNameChange} />
          </Form.Field>
          <Form.Field>
            <em> Insert studentnumbers you wish to use for population here </em>
            <TextArea
              value={input}
              placeholder="011111111"
              onChange={e => setInput(e.target.value)}
              data-cy="student-no-input"
            />
          </Form.Field>
        </Form>
        <SearchHistory
          header="Saved populations"
          items={customPopulationSearches.map(s => ({
            ...s,
            text: s.name,
            timestamp: s.updatedAt,
            params: { id: s.id },
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
        <Button positive onClick={e => onClicker(e)} data-cy="search-button">
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

CustomPopulationSearch.propTypes = {
  getCustomPopulationDispatch: func.isRequired,
  getCustomPopulationCoursesByStudentnumbers: func.isRequired,
  loading: bool.isRequired,
  customPopulationSearches: arrayOf(shape({})).isRequired,
  customPopulationSearchSaving: bool.isRequired,
  saveCustomPopulationSearchDispatch: func.isRequired,
  getCustomPopulationSearchesDispatch: func.isRequired,
  updateCustomPopulationSearchDispatch: func.isRequired,
  selectCustomPopulationSearchDispatch: func.isRequired,
  deleteCustomPopulationSearchDispatch: func.isRequired,
}

const mapStateToProps = ({ populations, populationCourses, customPopulationSearch }) => ({
  loading: populations.pending,
  custompop: populations.data.students || [],
  courses: populationCourses.data,
  customPopulationSearches: customPopulationSearch.customPopulationSearches,
  customPopulationSearchSaving: customPopulationSearch.saving,
})

export default connect(mapStateToProps, {
  getCustomPopulationDispatch: getCustomPopulation,
  getCustomPopulationCoursesByStudentnumbers,
  saveCustomPopulationSearchDispatch: saveCustomPopulationSearch,
  getCustomPopulationSearchesDispatch: getCustomPopulationSearches,
  updateCustomPopulationSearchDispatch: updateCustomPopulationSearch,
  selectCustomPopulationSearchDispatch: selectCustomPopulationSearch,
  deleteCustomPopulationSearchDispatch: deleteCustomPopulationSearch,
})(CustomPopulationSearch)
