import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { SearchHistory } from '@/components/material/SearchHistory'
import { useSearchHistory } from '@/hooks/searchHistory'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
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

export const PopulationSearchForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { fullAccessToStudentData } = useGetAuthorizedUserQuery()

  const [year, setYear] = useState(2017)
  const [programme, setProgramme] = useState<PopulationSearchProgramme | null>(null)
  const [studyTrack, setStudyTrack] = useState<PopulationSearchStudyTrack | null>(null)
  const [semesters, _setSemesters] = useState<Semester[]>(['FALL', 'SPRING'])
  const [studentStatuses, _setStudentStatuses] = useState<StudentStatus[]>([])
  const [showBachelorAndMaster, setShowBachelorAndMaster] = useState(false)
  const [filterProgrammes, setFilterProgrammes] = useState<boolean>(fullAccessToStudentData)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)

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
      <StudyTrackSelector programme={programme} setStudyTrack={setStudyTrack} studyTrack={studyTrack} />
      <Button disabled={!programme} onClick={handleSubmit} size="large" sx={{ maxWidth: '12rem' }} variant="contained">
        See class
      </Button>
      <SearchHistory handleSearch={pushQueryToUrl} items={searchHistory} updateItem={updateItemInSearchHistory} />
    </Stack>
  )
}
