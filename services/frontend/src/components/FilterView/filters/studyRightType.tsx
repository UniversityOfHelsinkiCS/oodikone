import { ExtentCode } from '@oodikone/shared/types'
import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { createFilter } from './createFilter'

const DEFAULT_STATE = '0' as const

const STUDYRIGHT_TYPES = [
  { text: 'Bachelor + master', value: '1' },
  { text: 'Master only', value: '2' },
]

const StudyRightTypeFilterCard = ({ onOptionsChange }: FilterTrayProps) => {
  const modeOptions = STUDYRIGHT_TYPES.map(({ text, value }) => ({
    key: text,
    text,
    value,
  }))

  return (
    <FilterRadio
      defaultOption={{ key: undefined, text: 'All', value: DEFAULT_STATE }}
      filterKey="studyRightTypeFilter"
      onChange={({ target }) => onOptionsChange({ mode: target.value })}
      options={modeOptions}
    />
  )
}

export const studyRightTypeFilter = createFilter({
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

    return mode === '1'
      ? studyRight.extentCode === ExtentCode.BACHELOR_AND_MASTER
      : studyRight.extentCode === ExtentCode.MASTER
  },

  render: StudyRightTypeFilterCard,
})
