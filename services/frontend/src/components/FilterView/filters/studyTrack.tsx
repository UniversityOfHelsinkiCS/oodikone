import Alert from '@mui/material/Alert'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { StudyTrack } from '@oodikone/shared/types'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const StudyTrackFilterCard = ({ onOptionsChange, options }: FilterTrayProps) => {
  const { selected, studyTracks } = options as { selected: string[]; studyTracks: StudyTrack[] }
  const { getTextIn } = useLanguage()

  if (!Object.keys(studyTracks).length)
    return <Alert severity="warning">No study tracks have been defined for the selected students.</Alert>

  const dropdownOptions = [...new Map(studyTracks.map(({ code, name }) => [code, name]))].map(([code, name]) => ({
    key: code,
    value: code,
    text: `${getTextIn(name)} (${code})`,
    content: (
      <>
        {getTextIn(name)} <span style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '0.8rem' }}>({code})</span>
      </>
    ),
  }))

  return (
    <FilterSelect
      filterKey={studyTrackFilter.key}
      label="Choose study track"
      multiple
      onChange={({ target }) => onOptionsChange({ ...options, selected: target.value })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const studyTrackFilter = createFilter({
  key: 'studyTrackFilter',
  title: 'Study track',
  defaultOptions: {
    selected: [],
    studyTracks: [],
  },

  precompute: ({ args, students, options }) => {
    options.studyTracks = students
      .flatMap(student => student.studyRights)
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args?.code && element.studyTrack !== null)
      .map(element => element.studyTrack!)
  },

  isActive: ({ selected }) => (selected !== undefined ? selected.length > 0 : false),
  filter: (student, { args, options }) => {
    const { selected } = options

    return student.studyRights
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args.code && element.studyTrack !== null)
      .some(element => selected.includes(element.studyTrack?.code))
  },

  selectors: {
    selectedStudyTracks: ({ selected, studyTracks }) =>
      selected.map(selectedCode => studyTracks.find(({ code }) => selectedCode === code)).filter(Boolean),
  },

  render: StudyTrackFilterCard,
})
