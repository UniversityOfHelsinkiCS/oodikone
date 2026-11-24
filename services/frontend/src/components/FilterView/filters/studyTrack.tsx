import Alert from '@mui/material/Alert'
import { FilterSelect } from '@/components/FilterView/filters/common/FilterSelect'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import type { StudyTrack } from '@oodikone/shared/types'

type Options = { selected: string[] }
type Args = { code: string }
type Precompute = StudyTrack[]

const StudyTrackFilterCard = ({
  onOptionsChange,
  options,
  precomputed: studyTracks,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { selected } = options
  const { getTextIn } = useLanguage()

  if (!studyTracks.length)
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
      onChange={({ target }) => onOptionsChange({ ...options, selected: target.value as string[] })}
      options={dropdownOptions}
      value={selected}
    />
  )
}

export const studyTrackFilter = createFilter<Options, Args, Precompute>({
  key: 'studyTrackFilter',
  title: 'Study track',
  defaultOptions: {
    selected: [],
  },

  precompute: ({ args, students }) =>
    students
      .flatMap(student => student.studyRights)
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args?.code && element.studyTrack !== null)
      .map(element => element.studyTrack!),

  isActive: ({ selected }) => (selected !== undefined ? selected.length > 0 : false),
  filter: (student, { args, options }) => {
    const { selected } = options

    return student.studyRights
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args.code && element.studyTrack !== null)
      .some(element => selected.includes(element.studyTrack?.code ?? ''))
  },

  selectors: {
    selectedStudyTracks: ({ selected }, _, studyTracks) =>
      selected.map(selectedCode => studyTracks?.find(({ code }) => selectedCode === code)).filter(Boolean),
  },

  render: StudyTrackFilterCard,
})
