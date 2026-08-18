import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { extractItems } from '@/common'
import { PageTitle } from '@/components/common/PageTitle'
import { SearchHistory } from '@/components/common/SearchHistory'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { EnrollmentDateSelector } from '@/components/PopulationSearch/EnrollmentDateSelector'
import { Section } from '@/components/Section'

import { CustomPopulationState } from '@/components/CustomPopulation/'
import {
  useCreateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
  useGetCustomPopulationSearchesQuery,
  useUpdateCustomPopulationSearchMutation,
} from '@/redux/customPopulationSearch'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { DeleteIcon, SaveIcon, SendIcon } from '@/theme'
import { CustomPopulationSearch } from '@oodikone/shared/models/kone'
import { ToggleContainer } from '../common/toggle/ToggleContainer'
import { Toggle } from '../common/toggle/Toggle'

const customPopulationInfo = `
  In this view you can search for a custom population with a list of student numbers or with study programme(s) and
  an academic year. A custom population can be saved by giving it a name and clicking the save button in the bottom.
  Saved populations are personal; they will only be visible to you. You can only search for students you have access
  rights to i.e. you have rights to the programme they are in.
`

const getDefaultYear = () => {
  const date = new Date()
  return date.getMonth() < 7 ? date.getFullYear() - 1 : date.getFullYear()
}

type StudyProgrammeOption = { code: string; name: string }

export const CustomPopulationSearchForm = ({
  setCustomPopulationState,
  showPopulation,
}: {
  setCustomPopulationState: React.Dispatch<React.SetStateAction<CustomPopulationState>>
  showPopulation: () => void
}) => {
  const { getTextIn } = useLanguage()

  // Form mode
  const [searchMode, setSearchMode] = useState<'studentNumbers' | 'programmes'>('studentNumbers')

  // Form values
  const [nameInput, setNameInput] = useState<string>('')
  const [studentNumberInput, setStudentNumberInput] = useState<string>('')
  const [associatedProgramme, setAssociatedProgramme] = useState<(typeof filteredStudyProgrammes)[number] | null>(null)

  const [selectedSearch, setSelectedSearch] = useState<CustomPopulationSearch | null>(null)

  // Programme based form values
  const [year, setYear] = useState<number>(getDefaultYear())
  const [selectedProgrammes, setSelectedProgrammes] = useState<StudyProgrammeOption[]>([])
  const [prefixInput, setPrefixInput] = useState<string>('')

  // Only show programmes the current user has access to,
  // see customPopulationInfo above
  const filteredStudyProgrammes = useFilteredAndFormattedStudyProgrammes().filteredProgrammes
  const { data: rawProgrammesData } = useGetProgrammesQuery()
  const filteredProgrammes: StudyProgrammeOption[] = Object.values(rawProgrammesData?.filteredProgrammes ?? {}).map(
    ({ code, name }) => ({ code, name: getTextIn(name) ?? '' })
  )

  const { data: searches, isFetching } = useGetCustomPopulationSearchesQuery(undefined)

  const [createSearch] = useCreateCustomPopulationSearchMutation()
  const [updateSearch] = useUpdateCustomPopulationSearchMutation()
  const [deleteSearch] = useDeleteCustomPopulationSearchMutation()

  const handleNameChange = (newName: string) => {
    setNameInput(newName)
  }

  const handleSearchModeChange = (isModeProgrammes: boolean) => {
    setSearchMode(isModeProgrammes ? 'programmes' : 'studentNumbers')
  }

  const clearForm = () => {
    setNameInput('')
    setStudentNumberInput('')
    setAssociatedProgramme(null)
    setSelectedSearch(null)
    setSelectedProgrammes([])
    setPrefixInput('')
    setYear(getDefaultYear())
  }

  const onSave = () => {
    const students = extractItems(studentNumberInput)
    if (selectedSearch) {
      void updateSearch({ id: selectedSearch.id, mode: searchMode, students, programmes: selectedProgrammes, year })
    } else {
      void createSearch({ name: nameInput, mode: searchMode, students, programmes: selectedProgrammes, year })
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
      setSearchMode(selectedSearch.mode)
      setSelectedProgrammes(selectedSearch.programmes)
      const year = parseInt(selectedSearch.year)
      setYear(!isNaN(year) ? year : getDefaultYear())
    }
  }

  const addProgrammesByPrefix = () => {
    const prefix = prefixInput.trim().toUpperCase()
    if (!prefix) return
    const programmesToAdd = filteredProgrammes.filter(
      programme =>
        programme.code.toUpperCase().startsWith(prefix) &&
        !selectedProgrammes.some(selected => selected.code === programme.code)
    )
    setSelectedProgrammes(prev => [...prev, ...programmesToAdd])
    setPrefixInput('')
  }

  const onSearch = (event: React.MouseEvent) => {
    event.preventDefault()

    if (searchMode === 'studentNumbers') {
      const studentNumbers = extractItems(studentNumberInput)
      if (studentNumbers.length) {
        setCustomPopulationState({
          selectedSearch,
          studentNumbers,
          associatedProgramme: associatedProgramme?.key,
          programmes: [],
          years: [],
        })
        showPopulation()
      }
    } else if (searchMode === 'programmes') {
      setCustomPopulationState({
        selectedSearch: null,
        studentNumbers: [],
        associatedProgramme: undefined,
        programmes: selectedProgrammes.map(programme => programme.code),
        years: [year.toString()],
      })
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
        <ToggleContainer>
          <Toggle
            cypress="search-mode"
            firstLabel="By student numbers"
            secondLabel="By study programme(s)"
            setValue={handleSearchModeChange}
            value={searchMode === 'programmes'}
          />
        </ToggleContainer>

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

        {searchMode === 'studentNumbers' ? (
          <>
            <Box>
              <Typography>
                Insert student numbers to use for the population. Each student number needs to be separated with a
                comma, a semicolon, a space, or a line break.
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
                options={filteredStudyProgrammes}
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
          </>
        ) : (
          <>
            <Box>
              <Typography>Academic year in which the students started in the selected programme(s)</Typography>
              <EnrollmentDateSelector setYear={setYear} year={year} slim />
            </Box>

            <Box>
              <Typography>Select one or more study programmes for the population.</Typography>
              <Autocomplete
                autoHighlight
                fullWidth
                getOptionLabel={opt => `${opt.name} - ${opt.code}`}
                isOptionEqualToValue={(opt, value) => opt.code === value.code}
                multiple
                onChange={(_, value) => setSelectedProgrammes(value)}
                options={filteredProgrammes}
                renderInput={params => (
                  <TextField
                    {...params}
                    data-cy="custom-population-programme-selector"
                    placeholder="Select study programme(s)"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props
                  return (
                    <li key={key} style={{ justifyContent: 'space-between' }} {...optionProps}>
                      <Typography>{option.name}</Typography>
                      <Typography fontWeight="lighter">{option.code}</Typography>
                    </li>
                  )
                }}
                value={selectedProgrammes}
              />
            </Box>

            <Box>
              <Typography>
                Alternatively add all programmes starting with a given prefix, e.g. EEL. Students with non-degree study
                rights are included automatically.
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  data-cy="custom-population-programme-prefix-input"
                  fullWidth
                  onChange={event => setPrefixInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addProgrammesByPrefix()
                    }
                  }}
                  placeholder="e.g. EEL"
                  size="small"
                  value={prefixInput}
                />
                <Button
                  data-cy="custom-population-add-by-prefix-button"
                  disabled={!prefixInput.trim()}
                  onClick={addProgrammesByPrefix}
                  variant="outlined"
                >
                  Add all programmes starting with prefix
                </Button>
              </Stack>
            </Box>
          </>
        )}

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
                disabled={
                  searchMode === 'studentNumbers'
                    ? !nameInput || isFetching || !studentNumberInput
                    : !nameInput || isFetching || !selectedProgrammes.length
                }
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
                disabled={searchMode === 'studentNumbers' ? !studentNumberInput : selectedProgrammes.length === 0}
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
