import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { SearchHistory } from '@/components/common/SearchHistory'
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
import { StudyTrackSelector } from './StudyTrackSelector'

const getDefaultYear = () => {
  const date = new Date()
  return date.getMonth() < 7 ? date.getFullYear() - 1 : date.getFullYear()
}

export const PopulationSearchForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { fullAccessToStudentData } = useGetAuthorizedUserQuery()

  const [year, setYear] = useState(getDefaultYear())
  const [programme, setProgramme] = useState<PopulationSearchProgramme | null>(null)
  const [studyTrack, setStudyTrack] = useState<PopulationSearchStudyTrack | null>(null)
  const [semesters, _setSemesters] = useState<Semester[]>(['FALL', 'SPRING'])
  const [studentStatuses, _setStudentStatuses] = useState<StudentStatus[]>([])
  const [showBachelorAndMaster, setShowBachelorAndMaster] = useState(false)
  const [filterProgrammes, setFilterProgrammes] = useState<boolean>(fullAccessToStudentData)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)

  const { data: studyTracks = {}, isLoading } = useGetStudyTracksQuery(
    { id: programme?.code ?? '' },
    { skip: !programme }
  )

  const studyTracksAvailable = Object.values(studyTracks).length > 1 && !isLoading && !!programme

  const handleProgrammeChange = (newProgramme: PopulationSearchProgramme | null) => {
    setProgramme(newProgramme ?? null)
    setStudyTrack(null)
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

  if (location.search !== '') {
    return null
  }

  const Subtitle = ({ text, disabled = false }) => (
    <Typography color={disabled ? 'textDisabled' : 'inherit'} fontWeight="bold" sx={{ mb: '1em' }} variant="subtitle1">
      {text}
    </Typography>
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Subtitle text="Class of" />
        <Stack direction="row" spacing={2}>
          <EnrollmentDateSelector setYear={setYear} year={year} />
          {fullAccessToStudentData ? (
            <FilterOldProgrammesToggle checked={filterProgrammes} onChange={() => setFilterProgrammes(prev => !prev)} />
          ) : null}
        </Stack>
      </Box>
      <Box>
        <Subtitle text="Degree programme" />
        <DegreeProgrammeSelector
          filterProgrammes={filterProgrammes}
          handleChange={handleProgrammeChange}
          programme={programme}
          setShowBachelorAndMaster={setShowBachelorAndMaster}
          showBachelorAndMaster={showBachelorAndMaster}
        />
      </Box>
      <Box data-cy="population-studytrack-selector-parent">
        <Subtitle disabled={!studyTracksAvailable} text="Study track (optional)" />
        <StudyTrackSelector
          programmeCode={programme?.code}
          setStudyTrack={setStudyTrack}
          studyTrack={studyTrack}
          studyTracks={studyTracks}
          studyTracksAvailable={studyTracksAvailable}
        />
      </Box>
      <Button disabled={!programme} onClick={handleSubmit} size="large" sx={{ maxWidth: '14em' }} variant="contained">
        See class
      </Button>
      <SearchHistory handleSearch={pushQueryToUrl} items={searchHistory} updateItem={updateItemInSearchHistory} />
    </Stack>
  )
}
