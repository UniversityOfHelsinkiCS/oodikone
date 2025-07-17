import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { isNewStudyProgramme } from '@/common'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { InfoBox } from '@/components/material/InfoBox'
import { SearchHistory } from '@/components/material/SearchHistory'
import { ToggleablePin } from '@/components/material/ToggleablePin'

import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useSearchHistory } from '@/hooks/searchHistory'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetStudyTracksQuery } from '@/redux/studyProgramme'
import { useGetStudyProgrammePinsQuery } from '@/redux/studyProgrammePins'
import type {
  PopulationSearchProgramme,
  PopulationSearchStudyTrack,
  PopulationQuery,
  Semester,
  StudentStatus,
} from '@/types/populationSearch'
import { createPinnedFirstComparator } from '@/util/comparator'
import { queryParamsToString } from '@/util/queryparams'

const bachelorAndMasterInfoTooltip = `If you choose a Bachelor's programme, toggling 'Show
    Bachelor + Master' on will also show information about the students' master's studies. If you
    choose a Master's programme, you can see information about the students' bachelor's studies.
    #### This feature is experimental and might still change`

export const PopulationSearchForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getTextIn } = useLanguage()
  const { fullAccessToStudentData } = useGetAuthorizedUserQuery()

  const [year, setYear] = useState(2017)
  const [programme, setProgramme] = useState<PopulationSearchProgramme | null>(null)
  const [studyTrack, setStudyTrack] = useState<PopulationSearchStudyTrack | null>(null)
  const [semesters, _setSemesters] = useState<Semester[]>(['FALL', 'SPRING'])
  const [studentStatuses, _setStudentStatuses] = useState<StudentStatus[]>([])
  const [showBachelorAndMaster, setShowBachelorAndMaster] = useState(false)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)
  const [filterProgrammes, setFilterProgrammes] = useState(fullAccessToStudentData)
  const { data: programmes = {}, isLoading: programmesAreLoading } = useGetProgrammesQuery()

  const studyProgrammes =
    (programmes.KH90_001 || programmes.MH90_001) && !Object.keys(programmes).includes('KH90_001+MH90_001')
      ? {
          ...programmes,
          'KH90_001+MH90_001': {
            ...programmes.KH90_001,
            code: 'KH90_001+MH90_001',
            name: {
              fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
              en: "Bachelor's and Degree Programme in Vetenary Medicine",
              sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
            },
          },
        }
      : programmes

  const { data: studyTracks = {}, isLoading: studyTracksAreLoading } = useGetStudyTracksQuery(
    { id: programme?.code ?? '' },
    { skip: !programme }
  )

  const { data: studyProgrammePins } = useGetStudyProgrammePinsQuery()
  const pinnedProgrammes = studyProgrammePins?.studyProgrammes ?? []

  const degreeProgrammeType = useDegreeProgrammeTypes([programme?.code ?? ''])

  const bachelorOrMasterProgrammeIsSelected = programme
    ? ['urn:code:degree-program-type:bachelors-degree', 'urn:code:degree-program-type:masters-degree'].includes(
        degreeProgrammeType[programme.code] ?? ''
      )
    : false

  const handleProgrammeChange = (_event: unknown, newProgramme: PopulationSearchProgramme | null) => {
    setProgramme(newProgramme ?? null)
    setStudyTrack(null)
  }

  const handleStudyTrackChange = (_event: unknown, studyTrack: PopulationSearchStudyTrack | null) => {
    setStudyTrack(studyTrack ?? null)
  }

  const buildQueryFromState = (): PopulationQuery => {
    const [primaryProgramme, combinedProgramme] = programme?.code?.split('+') ?? []
    return {
      programme: primaryProgramme,
      ...(!!combinedProgramme && { combinedProgramme }),
      ...(!!studyTrack?.code && { studyTrack: studyTrack?.code }),
      years: [year],
      semesters,
      showBachelorAndMaster,
    }
  }

  const pushQueryToUrl = (params?: PopulationQuery) => {
    const searchString = queryParamsToString(params ?? buildQueryFromState())
    void navigate({ search: searchString })
  }

  const getSearchHistoryTextFromQuery = () => {
    const programmeText = programme ? `${programme.name}, ${programme.code}` : null
    const studyTrackText = studyTrack ? `${studyTrack.name}, ${studyTrack.code}` : null
    const timeText = `${semesters.join(', ')}/${year}-${year + 1}`

    const studentStatusesText =
      studentStatuses.length > 0
        ? `includes ${studentStatuses.map(status => status.toLowerCase()).join(', ')} students`
        : null

    return [programmeText, studyTrackText, timeText, studentStatusesText].filter(Boolean).join(' - ')
  }

  const handleSubmit = () => {
    const query = buildQueryFromState()
    addItemToSearchHistory({
      text: getSearchHistoryTextFromQuery(),
      params: query,
    })

    pushQueryToUrl(query)
  }

  const handleYearSelection = (event: SelectChangeEvent) => {
    setYear(parseInt(event.target.value, 10))
  }

  const RenderEnrollmentDateSelector = () => {
    const currentYear = new Date().getFullYear()
    const lowestYear = 1970
    const options = [...Array(currentYear + 1 - lowestYear).keys()].map(value => lowestYear + value)
    return (
      <Box>
        <Typography fontWeight="bold" sx={{ mb: 1 }} variant="subtitle1">
          Class of
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0 }}>
          <IconButton
            data-cy="population-year-decrement"
            disabled={year <= lowestYear}
            onClick={() => setYear(year => (year > lowestYear ? year - 1 : year))}
          >
            <RemoveIcon />
          </IconButton>
          <Select
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                },
              },
            }}
            data-cy="population-year-selector"
            onChange={handleYearSelection}
            sx={{ width: 'fit-content', pl: 1, pr: 1 }}
            value={year.toString()}
          >
            {options.map(option => (
              <MenuItem
                key={option}
                sx={{ justifyContent: 'center' }}
                value={option}
              >{`${option} - ${option + 1}`}</MenuItem>
            ))}
          </Select>
          <IconButton
            data-cy="population-year-increment"
            disabled={year >= currentYear}
            onClick={() => setYear(year => year + 1)}
          >
            <AddIcon />
          </IconButton>
          {fullAccessToStudentData && (
            <FilterOldProgrammesToggle
              checked={filterProgrammes}
              onChange={() => setFilterProgrammes(!filterProgrammes)}
            />
          )}
        </Stack>
      </Box>
    )
  }

  const StudyProgrammeSelector = () => {
    if (Object.values(studyProgrammes).length === 0 && !programmesAreLoading) {
      return (
        <Alert severity="warning">
          You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi
        </Alert>
      )
    }

    const studyProgrammesAvailable = Object.values(studyProgrammes).length > 0 && !programmesAreLoading
    const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)

    const programmeOptions: PopulationSearchProgramme[] = studyProgrammesAvailable
      ? Object.values(studyProgrammes)
          .filter(programme => !filterProgrammes || isNewStudyProgramme(programme.code))
          .map(({ code, name }) => ({
            code,
            name: getTextIn(name),
            pinned: pinnedProgrammes.includes(code),
          }))
          .sort(pinnedFirstComparator)
      : []

    const handleBscAndMscToggle = () => {
      setShowBachelorAndMaster(show => !show)
    }

    return (
      <Box sx={{ m: 1 }}>
        <Typography fontWeight="bold" sx={{ mb: 1 }} variant="subtitle1">
          Degree programme
        </Typography>
        <Stack data-cy="population-programme-selector-parent" direction="row" spacing={2}>
          <Autocomplete
            autoComplete
            autoHighlight
            clearOnEscape
            disablePortal
            fullWidth
            getOptionLabel={opt => `${opt.name} - ${opt.code}`}
            onChange={handleProgrammeChange}
            options={programmeOptions}
            renderInput={params => (
              <TextField
                {...params}
                data-cy="population-programme-selector"
                placeholder="Select degree programme"
                sx={{ p: 0, border: 'none' }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props
              return (
                <Stack component="li" direction="row" key={key} spacing={2} sx={{ width: '100%' }} {...optionProps}>
                  <ToggleablePin programme={option} />
                  <Typography sx={{ flex: 1, p: 0.4 }}>{option.name}</Typography>
                  <Typography alignSelf="flex-end" fontWeight="300" sx={{ ml: 2 }} variant="body2">
                    {option.code}
                  </Typography>
                </Stack>
              )
            }}
            value={programme}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showBachelorAndMaster}
                disabled={!bachelorOrMasterProgrammeIsSelected}
                onChange={handleBscAndMscToggle}
              />
            }
            label={
              <Stack direction="row" spacing={1}>
                <Typography sx={{ whiteSpace: 'nowrap' }}>Show Bachelor & Master</Typography>
                <InfoBox content={bachelorAndMasterInfoTooltip} mini />
              </Stack>
            }
          />
        </Stack>
      </Box>
    )
  }

  const StudyTrackSelector = () => {
    const studyTracksAvailable = Object.values(studyTracks).length > 1 && !studyTracksAreLoading && !!programme
    const studyTrackOptions: PopulationSearchStudyTrack[] = studyTracksAvailable
      ? Object.entries(studyTracks)
          .filter(([code, _]) => code !== programme?.code)
          .map(([code, name]) => ({
            code,
            name: typeof name === 'string' ? name : getTextIn(name),
          }))
      : []

    return (
      <Box data-cy="population-studytrack-selector-parent" sx={{ m: 1 }}>
        <Typography
          color={studyTracksAvailable ? 'textPrimary' : 'textDisabled'}
          fontWeight="bold"
          sx={{ mb: 1 }}
          variant="subtitle1"
        >
          Study track (optional)
        </Typography>
        <Autocomplete
          autoComplete
          data-cy="population-studytrack-selector"
          disablePortal
          disabled={!studyTracksAvailable}
          getOptionLabel={opt => `${opt.name} - ${opt.code}`}
          onChange={handleStudyTrackChange}
          options={studyTrackOptions}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={studyTracksAvailable ? 'Select study track' : 'No study tracks available'}
            />
          )}
          value={studyTrack}
        />
      </Box>
    )
  }

  if (location.search !== '') {
    return null
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: '1200px', width: '100%' }}>
      <RenderEnrollmentDateSelector />
      <StudyProgrammeSelector />
      <StudyTrackSelector />
      <Button disabled={!programme} onClick={handleSubmit} size="large" sx={{ maxWidth: '12rem' }} variant="contained">
        See class
      </Button>
      <SearchHistory handleSearch={pushQueryToUrl} items={searchHistory} updateItem={updateItemInSearchHistory} />
    </Stack>
  )
}
