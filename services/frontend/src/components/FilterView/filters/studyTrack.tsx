import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { StudyTrack } from '@oodikone/shared/types'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const StudyTrackFilterCard = ({ args, onOptionsChange, options, students }: FilterTrayProps) => {
  const { code } = args
  const { selected } = options
  const { getTextIn } = useLanguage()

  const validStudyTracks = students
    .flatMap(student => student.studyRights)
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(element => element.code === code && element.studyTrack !== null)
    .map(element => element.studyTrack) as StudyTrack[]

  const dropdownOptions = [...new Map(validStudyTracks.map(({ code, name }) => [code, name]))].map(([code, name]) => ({
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
      filterKey="studyTrackFilter"
      label="Choose study track"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const studyTrackFilter = createFilter({
  key: 'StudyTrack',
  title: 'Study track',
  defaultOptions: {
    selected: [],
  },
  isActive: ({ selected }) => (selected !== undefined ? selected.length > 0 : false),
  filter: (student, { args, options }) => {
    const { selected } = options

    return student.studyRights
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args.code && element.studyTrack !== null)
      .some(element => selected.includes(element.studyTrack?.code))
  },

  render: StudyTrackFilterCard,
})
