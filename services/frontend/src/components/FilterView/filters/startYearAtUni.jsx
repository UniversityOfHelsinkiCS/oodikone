import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import fp from 'lodash/fp'
import { filterToolTips } from 'common/InfoToolTips'
import { createFilter } from './createFilter'

const StartYearAtUniFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const name = 'startYearAtUni'

  const { selected } = options

  const countsByYear = fp.flow(
    fp.groupBy(student => new Date(student.started).getFullYear()),
    fp.mapValues(students => students.length)
  )(withoutSelf())

  const dropdownOptions = Object.keys(countsByYear).map(year => ({
    key: `year-${year}`,
    text: `${year} (${countsByYear[year]})`,
    value: Number(year),
  }))

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          multiple
          selection
          fluid
          options={dropdownOptions}
          button
          className="mini"
          placeholder="Choose Years to Include"
          onChange={(_, { value }) =>
            onOptionsChange({
              selected: value,
            })
          }
          value={selected}
          data-cy={`${name}-dropdown`}
        />
      </Form>
    </div>
  )
}

export const startYearAtUniFilter = createFilter({
  key: 'StartYearAtUni',

  title: 'Starting Year',

  defaultOptions: {
    selected: [],
  },

  info: filterToolTips.startingYear,

  isActive: ({ selected }) => selected.length > 0,

  filter: (student, { selected }) => selected.includes(new Date(student.started).getFullYear()),

  component: StartYearAtUniFilterCard,
})
