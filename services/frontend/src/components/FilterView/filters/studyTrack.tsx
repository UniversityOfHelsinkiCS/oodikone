import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const StudyTrackFilterCard = ({ args, onOptionsChange, options, students }: FilterTrayProps) => {
  const { code } = args
  const { selected } = options
  const { getTextIn } = useLanguage()

  const dropdownOptions = students
    .flatMap(student => student.studyRights)
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(element => element.code === code && element.studyTrack !== null)
    .reduce((acc, element) => {
      const { studyTrack } = element
      if (acc.some(option => option.key === studyTrack.code)) {
        return acc
      }
      acc.push({
        key: studyTrack.code,
        value: studyTrack.code,
        text: `${getTextIn(studyTrack.name)} (${studyTrack.code})`,
        content: (
          <>
            {getTextIn(studyTrack.name)}{' '}
            <span style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '0.8rem' }}>({studyTrack.code})</span>
          </>
        ),
      })
      return acc
    }, [])

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
      .some(element => selected.includes(element.studyTrack.code))
  },

  render: StudyTrackFilterCard,
})
