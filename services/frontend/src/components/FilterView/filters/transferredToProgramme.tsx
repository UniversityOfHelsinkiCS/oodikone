import { useMemo } from 'react'

import { filterToolTips } from '@/common/InfoToolTips'
import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { createFilter } from './createFilter'

const TransferredToProgrammeFilterCard = ({ options, onOptionsChange }: FilterTrayProps) => {
  const { transferred } = options

  const toggle = buttonValue =>
    onOptionsChange({
      transferred: String(transferred) === buttonValue ? null : buttonValue,
    })

  const modeObject = {
    All: '',
    Transferred: 'true',
    'Not transferred': 'false',
  }

  const defaultOption = useMemo(() => transferred ?? modeOptions.at(0)?.value ?? '', [])
  const modeOptions = Object.entries(modeObject).map(([key, value]) => ({ key, text: key, value }))

  return (
    <FilterRadio
      controlledValue={transferred}
      defaultValue={defaultOption}
      filterKey={transferredToProgrammeFilter.key}
      onChange={({ target }) => toggle(target.value)}
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

    return String(student.transferredStudyright) === transferred
  },

  actions: {
    set: (options, value) => Object.assign(options, { transferred: String(value) }),
    // Toggle between 'null' -> 'All' and 'false' -> 'Not transferred'
    toggle: options => Object.assign(options, { transferred: options.transferred !== 'false' ? 'false' : '' }),
  },

  selectors: {
    getState: ({ transferred }, _value) => transferred,
  },

  render: TransferredToProgrammeFilterCard,
})
