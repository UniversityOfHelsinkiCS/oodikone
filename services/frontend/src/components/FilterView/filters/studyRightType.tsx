import { FilterRadio } from '@/components/FilterView/filters/common/FilterRadio'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { ExtentCode } from '@oodikone/shared/types'

type Options = any
type Args = any
type Precompute = any

const DEFAULT_STATE = '0' as const

const STUDYRIGHT_TYPES = [
  { text: 'All', value: DEFAULT_STATE },
  { text: 'Bachelor + master', value: '1' },
  { text: 'Master only', value: '2' },
]

const StudyRightTypeFilterCard = ({ onOptionsChange }: FilterTrayProps<Options, Args, Precompute>) => {
  const modeOptions = STUDYRIGHT_TYPES.map(({ text, value }) => ({
    key: text,
    text,
    value,
  }))

  return (
    <FilterRadio
      defaultValue={DEFAULT_STATE}
      filterKey={studyRightTypeFilter.key}
      onChange={({ target }) => onOptionsChange({ mode: target.value })}
      options={modeOptions}
    />
  )
}

export const studyRightTypeFilter = createFilter<Options, Args, Precompute>({
  key: 'studyRightTypeFilter',

  title: 'Study right type',

  defaultOptions: {
    mode: DEFAULT_STATE,
  },

  isActive: ({ mode }) => mode !== '0',

  filter(student, { args, options }) {
    const { mode } = options

    if (mode === '0') return true

    const studyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(el => el.code === args.programme)
    )

    if (!studyRight) return false

    switch (mode) {
      case '1':
        return studyRight.extentCode === ExtentCode.BACHELOR_AND_MASTER
      case '2':
        return studyRight.extentCode === ExtentCode.MASTER
    }

    return true
  },

  render: StudyRightTypeFilterCard,
})
