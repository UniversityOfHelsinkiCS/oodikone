import { filterToolTips } from '@/common/InfoToolTips'
import { FilterRadio } from '@/components/FilterView/filters/common/FilterRadio'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'

type Options = any
type Args = any
type Precompute = any

const DEFAULT_STATE = 0

const HetuFilterCard = ({ onOptionsChange }: FilterTrayProps<Options, Args, Precompute>) => {
  const modeOptions = [
    { key: 'All', text: 'All', value: 0 },
    { key: 'Has hetu', text: 'Has hetu', value: 1 },
    { key: 'Does not have hetu', text: 'Does not have hetu', value: 2 },
  ]

  return (
    <FilterRadio
      defaultValue={DEFAULT_STATE}
      filterKey={hetuFilter.key}
      onChange={({ target }) => onOptionsChange({ mode: target.value })}
      options={modeOptions}
    />
  )
}

/**
 * @options
 * 0 - All
 * 1 - Has hetu
 * 2 - No hetu
 */
export const hetuFilter = createFilter<Options, Args, Precompute>({
  key: 'hetuFilter',
  title: 'Personal identity code',

  info: filterToolTips.hetu,

  defaultOptions: {
    mode: 0,
  },

  isActive: ({ mode }) => mode !== 0,

  filter(student, { options: { mode } }) {
    const hetu = student.hasPersonalIdentityCode

    switch (Number(mode)) {
      case 0:
        return true
      case 1:
        return hetu
      case 2:
        return !hetu
      default:
        // never reached
        return true
    }
  },

  render: HetuFilterCard,
})
