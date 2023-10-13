import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea } from 'semantic-ui-react'
import { textAndDescriptionSearch } from 'common'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'
import { useProgress, useTitle } from '../../common/hooks'
import { getCustomPopulation } from '../../redux/populations'
import {
  useGetCustomPopulationSearchesQuery,
  useCreateCustomPopulationSearchMutation,
  useUpdateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
} from '../../redux/customPopulationSearch'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import SearchHistory from '../SearchHistory'

const CustomPopulationSearch = ({
  getCustomPopulationDispatch,
  getCustomPopulationCoursesByStudentnumbers,
  loading,
  onPopulationChange,
}) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [programme, setProgramme] = useState('')
  const [selectedSearch, setSelectedSearch] = useState(null)
  const programmes = useFilteredAndFormattedElementDetails()
  const { onProgress } = useProgress(loading)

  useTitle('Custom population')

  const { data: searches, isFetching } = useGetCustomPopulationSearchesQuery()
  const [createSearch] = useCreateCustomPopulationSearchMutation()
  const [updateSearch] = useUpdateCustomPopulationSearchMutation()
  const [deleteSearch] = useDeleteCustomPopulationSearchMutation()

  const handleNameChange = e => {
    setName(e.target.value)
  }

  const clearForm = () => {
    setName('')
    setInput('')
    setSelectedSearch(null)
  }

  const handleClose = () => {
    setModal(false)
    clearForm()
  }

  const parseInput = studentNumbers =>
    studentNumbers
      .split(/[\s,]+/)
      .map(code => code.trim())
      .filter(s => s !== '')
      .map(s => (s.length === 8 ? `0${s}` : s))

  const onSave = () => {
    const students = parseInput(input)
    if (selectedSearch) {
      updateSearch({ id: selectedSearch.id, students })
    } else {
      createSearch({ name, students })
    }
  }

  const onDelete = () => {
    if (selectedSearch) {
      deleteSearch({ id: selectedSearch.id })
      clearForm()
    }
  }

  const onSelectSearch = selectedId => {
    if (!selectedId) {
      clearForm()
      return
    }
    const selectedSearch = searches.find(({ id }) => id === selectedId)
    if (selectedSearch) {
      setInput(selectedSearch.students.join('\n'))
      setName(selectedSearch.name)
      setSelectedSearch(selectedSearch)
    }
  }

  const onClicker = e => {
    e.preventDefault()
    const studentnumbers = parseInput(input)
    getCustomPopulationDispatch({ studentnumberlist: studentnumbers, onProgress, associatedProgramme: programme })
    getCustomPopulationCoursesByStudentnumbers({ studentnumberlist: studentnumbers })
    onPopulationChange(selectedSearch)
    handleClose()
  }

  if (!searches) return null

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
          <h2>New custom population</h2>
          <Form.Field>
            <em>Insert name for this custom population if you wish to save it</em>
            <Form.Input disabled={!!selectedSearch} value={name} placeholder="name" onChange={handleNameChange} />
          </Form.Field>
          <Form.Field>
            <em>Insert student numbers you wish to use for population here</em>
            <TextArea
              value={input}
              placeholder="011111111"
              onChange={e => setInput(e.target.value)}
              data-cy="student-no-input"
            />
          </Form.Field>
          <Form.Select
            name="Associated programme"
            search={textAndDescriptionSearch}
            options={programmes}
            onChange={(_, value) => setProgramme(value?.value)}
            value={programme}
            closeOnChange
            clearable
            placeholder="Select associated study programme for the population"
          />
        </Form>
        <SearchHistory
          header="Saved populations"
          items={searches.map(s => ({
            ...s,
            text: s.name,
            timestamp: new Date(s.updatedAt),
            params: { id: s.id },
          }))}
          updateItem={() => null}
          handleSearch={({ id }) => onSelectSearch(id)}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          disabled={!name || isFetching}
          loading={isFetching}
          floated="left"
          icon="save"
          onClick={onSave}
          content="Save"
        />
        <Button disabled={!selectedSearch} negative floated="left" icon="trash" onClick={onDelete} content="Delete" />
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive onClick={e => onClicker(e)} data-cy="search-button">
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

const mapStateToProps = ({ populations }) => ({
  loading: populations.pending,
})

export default connect(mapStateToProps, {
  getCustomPopulationDispatch: getCustomPopulation,
  getCustomPopulationCoursesByStudentnumbers,
})(CustomPopulationSearch)
