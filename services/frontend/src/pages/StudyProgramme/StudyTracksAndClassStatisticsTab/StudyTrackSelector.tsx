import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Name } from '@oodikone/shared/types'

export const StudyTrackSelector = ({
  setStudyTrack,
  studyTrack,
  studyTracks,
}: {
  setStudyTrack: (studyTrack: string) => void
  studyTrack: string
  studyTracks: Record<string, string | Name> | undefined
}) => {
  const { getTextIn } = useLanguage()

  const options: { code: string; name: string; value: string }[] = []
  if (studyTracks) {
    options.push(
      ...Object.entries(studyTracks)
        .map(([code, studyTrack]) => ({
          code,
          name: typeof studyTrack === 'string' ? studyTrack : getTextIn(studyTrack)!,
          value: code,
        }))
        .sort((a, b) => {
          if (a.name.startsWith('All students of the programme')) return -1
          if (b.name.startsWith('All students of the programme')) return 1
          return a.name.localeCompare(b.name, 'fi', { sensitivity: 'accent' })
        })
    )
  }

  return (
    <FormControl fullWidth>
      <InputLabel>Select study track</InputLabel>
      <Select
        data-cy="study-track-select"
        disabled={options.length < 2}
        label="Select study track"
        onChange={event => setStudyTrack(event.target.value)}
        value={options.length ? studyTrack : ''}
      >
        {options.map(option => (
          <MenuItem key={option.code} value={option.value}>
            <Box display="flex" justifyContent="space-between" width="100%">
              <Typography color="text.primary">{option.name}</Typography>
              <Typography color="text.secondary">{option.code}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
