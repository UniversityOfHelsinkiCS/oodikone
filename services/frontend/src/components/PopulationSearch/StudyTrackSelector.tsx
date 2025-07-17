import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetStudyTracksQuery } from '@/redux/studyProgramme'
import type { PopulationSearchProgramme, PopulationSearchStudyTrack } from '@/types/populationSearch'

type StudyTrackSelectorProps = {
  programme: PopulationSearchProgramme | null
  studyTrack: PopulationSearchStudyTrack | null
  setStudyTrack: React.Dispatch<React.SetStateAction<PopulationSearchStudyTrack | null>>
}

export const StudyTrackSelector = ({ programme, studyTrack, setStudyTrack }: StudyTrackSelectorProps) => {
  const { getTextIn } = useLanguage()

  const { data: studyTracks = {}, isLoading } = useGetStudyTracksQuery(
    { id: programme?.code ?? '' },
    { skip: !programme }
  )

  const studyTracksAvailable = Object.values(studyTracks).length > 1 && !isLoading && !!programme
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
    </Box>
  )
}
