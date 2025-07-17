import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/material/SearchHistory'

import { useSearchHistory } from '@/hooks/searchHistory'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetStudyTracksQuery } from '@/redux/studyProgramme'
import type {
  PopulationSearchProgramme,
  PopulationSearchStudyTrack,
  PopulationQuery,
  Semester,
  StudentStatus,
} from '@/types/populationSearch'
import { queryParamsToString } from '@/util/queryparams'
import { DegreeProgrammeSelector } from './DegreeProgrammeSelector'
import { EnrollmentDateSelector } from './EnrollmentDateSelector'

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
  const [filterProgrammes, setFilterProgrammes] = useState<boolean>(fullAccessToStudentData)

  const { data: studyTracks = {}, isLoading: studyTracksAreLoading } = useGetStudyTracksQuery(
    { id: programme?.code ?? '' },
    { skip: !programme }
  )

  const handleProgrammeChange = (newProgramme: PopulationSearchProgramme | null) => {
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
      <EnrollmentDateSelector
        filterProgrammes={filterProgrammes}
        fullAccessToStudentData={fullAccessToStudentData}
        setFilterProgrammes={setFilterProgrammes}
        setYear={setYear}
        year={year}
      />
      <DegreeProgrammeSelector
        filterProgrammes={filterProgrammes}
        handleChange={handleProgrammeChange}
        programme={programme}
        setShowBachelorAndMaster={setShowBachelorAndMaster}
        showBachelorAndMaster={showBachelorAndMaster}
      />

      <StudyTrackSelector />
      <Button disabled={!programme} onClick={handleSubmit} size="large" sx={{ maxWidth: '12rem' }} variant="contained">
        See class
      </Button>
      <SearchHistory handleSearch={pushQueryToUrl} items={searchHistory} updateItem={updateItemInSearchHistory} />
    </Stack>
  )
}
