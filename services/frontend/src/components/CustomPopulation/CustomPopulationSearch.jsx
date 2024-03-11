import React, { useState } from 'react'
import { Button, Form, Modal, TextArea } from 'semantic-ui-react'

import { textAndDescriptionSearch } from '@/common'
import { useTitle } from '@/common/hooks'
import { SearchHistory } from '@/components/SearchHistory'
import {
  useCreateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
  useGetCustomPopulationSearchesQuery,
  useUpdateCustomPopulationSearchMutation,
} from '@/redux/customPopulationSearch'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'

export const CustomPopulationSearch = ({ setCustomPopulationState }) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [associatedProgramme, setAssociatedProgramme] = useState('')
  const [selectedSearch, setSelectedSearch] = useState(null)
  const programmes = useFilteredAndFormattedElementDetails()

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
    const studentNumbers = parseInput(input)
    setCustomPopulationState({ selectedSearch, studentNumbers, associatedProgramme })
    handleClose()
  }

  if (!searches) return null

  return (
    <Modal
      onClose={handleClose}
      open={modal}
      size="small"
      trigger={
        <Button color="blue" data-cy="custom-pop-search-button" onClick={() => setModal(true)} size="small">
          Custom population
        </Button>
      }
    >
      <Modal.Content>
        <Form>
          <h2>New custom population</h2>
          <Form.Field>
            <em>Insert name for this custom population if you wish to save it</em>
            <Form.Input disabled={!!selectedSearch} onChange={handleNameChange} placeholder="name" value={name} />
          </Form.Field>
          <Form.Field>
            <em>Insert student numbers you wish to use for population here</em>
            <TextArea
              data-cy="student-no-input"
              onChange={e => setInput(e.target.value)}
              placeholder="011111111"
              value={input}
            />
          </Form.Field>
          <Form.Select
            clearable
            closeOnChange
            name="Associated programme"
            onChange={(_, value) => setAssociatedProgramme(value?.value)}
            options={programmes}
            placeholder="Select associated study programme for the population"
            search={textAndDescriptionSearch}
            value={associatedProgramme}
          />
        </Form>
        <SearchHistory
          handleSearch={({ id }) => onSelectSearch(id)}
          header="Saved populations"
          items={searches.map(s => ({
            ...s,
            text: s.name,
            timestamp: new Date(s.updatedAt),
            params: { id: s.id },
          }))}
          updateItem={() => null}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          content="Save"
          disabled={!name || isFetching}
          floated="left"
          icon="save"
          loading={isFetching}
          onClick={onSave}
        />
        <Button content="Delete" disabled={!selectedSearch} floated="left" icon="trash" negative onClick={onDelete} />
        <Button onClick={handleClose}>Cancel</Button>
        <Button data-cy="search-button" onClick={e => onClicker(e)} positive>
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
