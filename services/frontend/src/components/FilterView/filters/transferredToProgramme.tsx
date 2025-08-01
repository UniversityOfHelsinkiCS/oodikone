import { filterToolTips } from '@/common/InfoToolTips'
import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { createFilter } from './createFilter'

const TransferredToProgrammeFilterCard = ({ options, onOptionsChange }: FilterTrayProps) => {
  const { transferred } = options

  const toggle = buttonValue =>
    onOptionsChange({
      transferred: transferred === buttonValue ? null : buttonValue,
    })

  const modeObject = {
    All: () => toggle(''),
    Transferred: () => toggle(true),
    'Not transferred': () => toggle(false),
  }

  const modeOptions = Object.keys(modeObject).map(key => ({
    key,
    text: key,
    value: key,
  }))

  const defaultOption = modeOptions.shift()!

  return (
    <FilterRadio
      defaultOption={defaultOption}
      filterKey={transferredToProgrammeFilter.key}
      onChange={({ target }) => modeObject[target.value]()}
      options={modeOptions}
    />
  )
}

export const transferredToProgrammeFilter = createFilter({
  key: 'transferredToProgrammeFilter',

  title: 'Transferred to programme',

  info: filterToolTips.transferred,

  defaultOptions: {
    transferred: '',
  },

  isActive: ({ transferred }) => transferred !== '',

  filter: (student, { options }) => {
    const { transferred } = options

    return student.transferredStudyright === transferred
  },

  actions: {
    set: (options, value) => {
      options.transferred = value

      return options
    },
    // Toggle between 'null' -> 'All' and 'false' -> 'Not transferred'
    toggle: options => {
      if (options.transferred !== false) {
        options.transferred = false
      } else {
        options.transferred = ''
      }

      return options
    },
  },

  selectors: {
    getState: ({ transferred }, _value) => transferred,
  },

  render: TransferredToProgrammeFilterCard,
})
