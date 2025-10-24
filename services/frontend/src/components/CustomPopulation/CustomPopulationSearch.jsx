import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { extractItems } from '@/common'
import { SearchHistory } from '@/components/material/SearchHistory'
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
      void updateSearch({ id: selectedSearch.id, students })
    } else {
      void createSearch({ name, students })
    }
  }

  const onDelete = () => {
    if (selectedSearch) {
      void deleteSearch({ id: selectedSearch.id })
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
    <>
      <Button
        color="primary"
        data-cy="custom-pop-search-button"
        onClick={() => setModal(true)}
        size="small"
        variant="outlined"
      >
        Custom population
      </Button>
      <Dialog fullWidth onClose={handleClose} open={modal} size="small">
        <Paper sx={{ padding: 2 }}>
          <h2>New custom population</h2>

          <Typography>Insert name for this custom population if you wish to save it</Typography>
          <TextField
            data-cy="custom-population-name-input"
            disabled={!!selectedSearch}
            fullWidth
            onChange={handleNameChange}
            placeholder="name"
            value={name}
          />

          <Typography>
            Insert student numbers you wish to use for population. Separate each number with a comma, semicolon, space,
            or newline.
          </Typography>
          <TextField
            data-cy="student-number-input"
            fullWidth
            multiline
            onChange={event => setInput(event.target.value)}
            placeholder={'012345678\n012345679'}
            rows={10}
            value={input}
          />

          <Stack flexDirection="row">
            <Select
              fullWidth
              label="Associated programme"
              onChange={event => setAssociatedProgramme(event.target.value)}
              placeholder="Select associated degree programme for the population"
              value={associatedProgramme ?? ''}
            >
              {studyProgrammes.map(({ key, value, description, text }) => (
                <MenuItem key={key} sx={{ justifyContent: 'space-between' }} value={value}>
                  <Typography>{text}</Typography>
                  <Typography fontWeight="lighter">{description}</Typography>
                </MenuItem>
              ))}
            </Select>
            <Button
              color="error"
              disabled={!associatedProgramme}
              onClick={() => setAssociatedProgramme('')}
              variant="outlined"
            >
              Clear
            </Button>
          </Stack>

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

          <Box sx={{ py: 2 }}>
            <Stack flexDirection="row" sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Button disabled={!name || isFetching} loading={isFetching} onClick={onSave} variant="outlined">
                  Save
                </Button>
                <Button color="error" disabled={!selectedSearch} onClick={onDelete} sx={{ ml: 0.5 }} variant="outlined">
                  Delete
                </Button>
              </Box>
              <Box>
                <Button color="error" onClick={handleClose} variant="outlined">
                  Cancel
                </Button>
                <Button data-cy="search-button" onClick={event => onClicker(event)} sx={{ ml: 0.5 }} variant="outlined">
                  Search population
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Dialog>
    </>
  )
}
