import { Dropdown } from 'semantic-ui-react'

import '../studyprogramme.css'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const StudytrackSelector = ({ track, setTrack, studytracks }) => {
  const { getTextIn } = useLanguage()
  if (!studytracks) return null

  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }
  const getOptionName = track => {
    if (track !== 'All students of the programme') return getTextIn(track)
    return track
  }

  return (
    <div className="studytrack-selector">
      <h4>Choose studytrack</h4>
      <Dropdown
        fluid
        name="studytrack"
        onChange={handleStudytrackChange}
        options={Object.entries(studytracks).map(([code, track]) => ({
          key: code,
          value: code,
          text: code === 'studyprogramme' ? getOptionName(track) : `${getOptionName(track)}, ${code}`,
        }))}
        placeholder="All students of the studyprogramme"
        selection
        value={track}
      />
    </div>
  )
}
