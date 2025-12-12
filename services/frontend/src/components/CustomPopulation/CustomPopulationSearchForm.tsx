import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { extractItems } from '@/common'
import { SearchHistory } from '@/components/common/SearchHistory'

import {
  useCreateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
  useGetCustomPopulationSearchesQuery,
  useUpdateCustomPopulationSearchMutation,
} from '@/redux/customPopulationSearch'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { CustomPopulationSearch } from '@oodikone/shared/models/kone'
import { PageTitle } from '../common/PageTitle'
import { Section } from '../Section'
import { CustomPopulationState } from '.'

const customPopulationInfo = `
  In this view you can search for a custom population with a list of student numbers. A custom population can be saved
  by giving it a name and clicking the save button in the bottom. Saved populations are personal; they will only be visible to you.  You can only search for students you have access rights to i.e. you have rights to the programme they are in.
`

export const CustomPopulationSearchForm = ({
  setCustomPopulationState,
  showPopulation,
}: {
  setCustomPopulationState: React.Dispatch<React.SetStateAction<CustomPopulationState>>
  showPopulation: () => void
}) => {
  // Form values
  const [nameInput, setNameInput] = useState<string>('')
  const [studentNumberInput, setStudentNumberInput] = useState<string>('')
  const [associatedProgramme, setAssociatedProgramme] = useState<(typeof studyProgrammes)[number] | null>(null)

  const [selectedSearch, setSelectedSearch] = useState<CustomPopulationSearch | null>(null)

  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()
  const { data: searches, isFetching } = useGetCustomPopulationSearchesQuery(undefined)

  const [createSearch] = useCreateCustomPopulationSearchMutation()
  const [updateSearch] = useUpdateCustomPopulationSearchMutation()
  const [deleteSearch] = useDeleteCustomPopulationSearchMutation()

  const handleNameChange = (newName: string) => {
    setNameInput(newName)
  }

  const clearForm = () => {
    setNameInput('')
    setStudentNumberInput('')
    setAssociatedProgramme(null)
    setSelectedSearch(null)
  }

  const onSave = () => {
    const students = extractItems(studentNumberInput)
    if (selectedSearch) {
      void updateSearch({ id: selectedSearch.id, students })
    } else {
      void createSearch({ name: nameInput, students })
    }
  }

  const onDelete = () => {
    if (selectedSearch) {
      void deleteSearch({ id: selectedSearch.id })
      clearForm()
    }
  }

  const onSelectSearch = (selectedId: string) => {
    if (!selectedId) {
      clearForm()
      return
    }
    const selectedSearch = searches?.find(({ id }) => id === selectedId)
    if (selectedSearch) {
      setStudentNumberInput(selectedSearch.students.join('\n'))
      setNameInput(selectedSearch.name)
      setSelectedSearch(selectedSearch)
    }
  }

  const onSearch = event => {
    event.preventDefault()
    const studentNumbers = extractItems(studentNumberInput)

    if (studentNumbers.length) {
      setCustomPopulationState({ selectedSearch, studentNumbers, associatedProgramme: associatedProgramme?.key })
      showPopulation()
    }
  }

  if (!searches) return null

  return (
    <Box maxWidth="md" mx="auto" width="100%">
      <PageTitle title="Custom population" />
      <Section
        contentSx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        infoBoxContent={customPopulationInfo}
        title="New custom population"
      >
        <Box>
          <Typography>Insert a name for this custom population if you wish to save it</Typography>
          <TextField
            data-cy="custom-population-name-input"
            disabled={!!selectedSearch}
            fullWidth
            onChange={event => handleNameChange(event.target.value)}
            placeholder="Name"
            value={nameInput}
          />
        </Box>

        <Box>
          <Typography>
            Insert student numbers to use for the population. Each student number needs to be separated with a comma, a
            semicolon, a space, or a line break.
          </Typography>
          <TextField
            data-cy="student-number-input"
            fullWidth
            multiline
            onChange={event => setStudentNumberInput(event.target.value)}
            placeholder={'012345678\n012345679'}
            rows={7}
            value={studentNumberInput}
          />
        </Box>

        <Box>
          <Typography>
            (Optional) Associate a degree programme for this search. This will affect how some degree programme
            dependent statistics are calculated. If unset, defaults to the latest active degree programme for each
            student.
          </Typography>
          <Autocomplete
            autoHighlight
            getOptionLabel={opt => `${opt.text} - ${opt.value}`}
            isOptionEqualToValue={(opt, value) => opt.value === value.value}
            onChange={(_, value) => setAssociatedProgramme(value)}
            options={studyProgrammes}
            renderInput={params => (
              <TextField {...params} placeholder="Search for degree programme" sx={{ p: 0, border: 'none' }} />
            )}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props
              return (
                <li key={key} style={{ justifyContent: 'space-between' }} {...optionProps}>
                  <Typography>{option.text}</Typography>
                  <Typography fontWeight="lighter">{option.description}</Typography>
                </li>
              )
            }}
            value={associatedProgramme}
          />
        </Box>

        <SearchHistory
          handleSearch={selected => onSelectSearch(selected?.id)}
          header="Saved populations"
          items={searches?.map(search => ({
            id: search.id,
            text: search.name,
            timestamp: new Date(search.updatedAt!),
            params: { id: search.id },
          }))}
          updateItem={() => null}
        />

        <Box sx={{ py: 2 }}>
          <Stack flexDirection="row" sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Button
                color="success"
                disabled={!nameInput || isFetching || !studentNumberInput}
                endIcon={<SaveIcon />}
                loading={isFetching}
                onClick={onSave}
                variant="contained"
              >
                Save
              </Button>
              <Button
                color="error"
                disabled={!selectedSearch}
                endIcon={<DeleteIcon />}
                onClick={onDelete}
                sx={{ ml: 1 }}
                variant="contained"
              >
                Delete
              </Button>
            </Box>
            <Box>
              <Button color="info" onClick={clearForm} variant="text">
                Clear form
              </Button>
              <Button
                data-cy="search-button"
                disabled={!studentNumberInput}
                endIcon={<SendIcon />}
                onClick={event => onSearch(event)}
                sx={{ ml: 1 }}
                variant="contained"
              >
                Search population
              </Button>
            </Box>
          </Stack>
        </Box>
      </Section>
    </Box>
  )
}
