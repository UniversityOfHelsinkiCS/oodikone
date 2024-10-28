import { Dropdown } from 'semantic-ui-react'

import '../studyprogramme.css'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const StudyTrackSelector = ({ track, setTrack, studyTracks }) => {
  const { getTextIn } = useLanguage()
  if (!studyTracks) {
    return null
  }

  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  const getOptionName = track => {
    if (track !== 'All students of the programme') {
      return getTextIn(track)
    }
    return track
  }

  const studyTrackOptions = Object.entries(studyTracks)
    .map(([code, track]) => ({
      key: code,
      value: code,
      text: `${getOptionName(track)}, ${code}`,
    }))
    .sort((a, b) => {
      if (a.text.startsWith('All students of the programme')) return -1
      if (b.text.startsWith('All students of the programme')) return 1
      return a.text.localeCompare(b.text, 'fi', { sensitivity: 'accent' })
    })

  return (
    <div className="studytrack-selector">
      <h4>Choose study track</h4>
      <Dropdown
        fluid
        name="studyTrack"
        onChange={handleStudytrackChange}
        options={studyTrackOptions}
        selection
        value={track}
      />
    </div>
  )
}
