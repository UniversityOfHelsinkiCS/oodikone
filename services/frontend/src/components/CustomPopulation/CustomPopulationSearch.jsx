import { useState } from 'react'
import { Button, Form, Modal, TextArea } from 'semantic-ui-react'

import { extractItems, textAndDescriptionSearch } from '@/common'
import { SearchHistory } from '@/components/SearchHistory'
import { useTitle } from '@/hooks/title'
import {
  useCreateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
  useGetCustomPopulationSearchesQuery,
  useUpdateCustomPopulationSearchMutation,
} from '@/redux/customPopulationSearch'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'

export const CustomPopulationSearch = ({ setCustomPopulationState }) => {
  useTitle('Custom population')

  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [associatedProgramme, setAssociatedProgramme] = useState('')
  const [selectedSearch, setSelectedSearch] = useState(null)
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()
  const { data: searches, isFetching } = useGetCustomPopulationSearchesQuery()
  const [createSearch] = useCreateCustomPopulationSearchMutation()
  const [updateSearch] = useUpdateCustomPopulationSearchMutation()
  const [deleteSearch] = useDeleteCustomPopulationSearchMutation()

  const handleNameChange = event => {
    setName(event.target.value)
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

  const onSave = () => {
    const students = extractItems(input)
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

  const onClicker = event => {
    event.preventDefault()
    const studentNumbers = extractItems(input)

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
            <label>Insert name for this custom population if you wish to save it</label>
            <Form.Input
              data-cy="custom-population-name-input"
              disabled={!!selectedSearch}
              onChange={handleNameChange}
              placeholder="name"
              value={name}
            />
          </Form.Field>
          <Form.Field>
            <label>
              Insert student numbers you wish to use for population. Separate each number with a comma, semicolon,
              space, or newline.
            </label>
            <TextArea
              data-cy="student-number-input"
              onChange={(_, { value }) => setInput(value)}
              placeholder="011111111"
              rows={10}
              value={input}
            />
          </Form.Field>
          <Form.Select
            clearable
            closeOnChange
            name="Associated programme"
            onChange={(_, value) => setAssociatedProgramme(value?.value)}
            options={studyProgrammes}
            placeholder="Select associated study programme for the population"
            search={textAndDescriptionSearch}
            value={associatedProgramme}
          />
        </Form>
        <SearchHistory
          handleSearch={selected => onSelectSearch(selected?.id)}
          header="Saved populations"
          items={searches.map(search => ({
            ...search,
            text: search.name,
            timestamp: new Date(search.updatedAt),
            params: { id: search.id },
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
        <Button data-cy="search-button" onClick={event => onClicker(event)} positive>
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
