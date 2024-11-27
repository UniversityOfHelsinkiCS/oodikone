import { Dropdown, DropdownProps } from 'semantic-ui-react'

import '../studyprogramme.css'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Name } from '@/shared/types'

interface StudyTrackSelectorProps {
  track: string
  setTrack: (track: string) => void
  studyTracks: Record<string, string | Name>
}

export const StudyTrackSelector = ({ track, setTrack, studyTracks }: StudyTrackSelectorProps) => {
  const { getTextIn } = useLanguage()
  if (!studyTracks) {
    return null
  }

  const handleStudyTrackChange = (event: React.SyntheticEvent, data: DropdownProps) => {
    const { value } = data
    event.preventDefault()
    setTrack(value as string)
  }

  const getOptionName = (studyTrack: string | Name) => {
    return typeof studyTrack === 'string' ? studyTrack : getTextIn(studyTrack)
  }

  const studyTrackOptions = Object.entries(studyTracks)
    .map(([code, studyTrack]) => ({
      key: code,
      value: code,
      text: `${getOptionName(studyTrack)}, ${code}`,
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
        onChange={handleStudyTrackChange}
        options={studyTrackOptions}
        selection
        value={track}
      />
    </div>
  )
}
