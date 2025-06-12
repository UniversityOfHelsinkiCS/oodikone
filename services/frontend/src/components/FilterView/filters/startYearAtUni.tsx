import { Form, Dropdown } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

const StartYearAtUniFilterCard = ({ options, onOptionsChange, students }) => {
  const name = 'startYearAtUni'
  const { selected } = options

  const countsByYear = {}
  for (const { started } of students) {
    const year = new Date(started).getFullYear()

    countsByYear[year] ??= 0
    countsByYear[year]++
  }

  const dropdownOptions = Object.entries(countsByYear).map(([year, count]) => ({
    key: `year-${year}`,
    text: `${year} (${count})`,
    value: Number(year),
  }))

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          data-cy={`${name}-dropdown`}
          fluid
          multiple
          onChange={(_, { value }) =>
            onOptionsChange({
              selected: value,
            })
          }
          options={dropdownOptions}
          placeholder="Choose years to include"
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const startYearAtUniFilter = createFilter({
  key: 'StartYearAtUni',

  title: 'Starting year',

  defaultOptions: {
    selected: [],
  },

  info: filterToolTips.startingYear,

  isActive: ({ selected }) => selected.length > 0,

  filter: (student, { options }) => {
    const { selected } = options

    return selected.includes(new Date(student.started).getFullYear())
  },

  render: StartYearAtUniFilterCard,
})
