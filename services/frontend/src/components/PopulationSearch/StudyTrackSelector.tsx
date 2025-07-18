import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { PopulationSearchStudyTrack } from '@/types/populationSearch'
import { Name } from '@oodikone/shared/types'

type StudyTrackSelectorProps = {
  programmeCode: string | undefined // always defined if component is active
  studyTracks: Record<string, string | Name>
  studyTrack: PopulationSearchStudyTrack | null
  setStudyTrack: React.Dispatch<React.SetStateAction<PopulationSearchStudyTrack | null>>
  studyTracksAvailable: boolean
}

export const StudyTrackSelector = ({
  programmeCode,
  studyTracks,
  studyTrack,
  setStudyTrack,
  studyTracksAvailable,
}: StudyTrackSelectorProps) => {
  const { getTextIn } = useLanguage()

  const studyTrackOptions: PopulationSearchStudyTrack[] = studyTracksAvailable
    ? Object.entries(studyTracks)
        .filter(([code, _]) => code !== programmeCode)
        .map(([code, name]) => ({
          code,
          name: typeof name === 'string' ? name : getTextIn(name),
        }))
    : []

  return (
    <Autocomplete
      autoComplete
      data-cy="population-studytrack-selector"
      disablePortal
      disabled={!studyTracksAvailable}
      getOptionLabel={opt => `${opt.name} - ${opt.code}`}
      onChange={(_, value) => setStudyTrack(value)}
      options={studyTrackOptions}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={studyTracksAvailable ? 'Select study track' : 'No study tracks available'}
        />
      )}
      value={studyTrack}
    />
  )
}
