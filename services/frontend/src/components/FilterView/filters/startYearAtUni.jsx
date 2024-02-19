import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import * as _ from 'lodash-es'
import { filterToolTips } from 'common/InfoToolTips'
import { createFilter } from './createFilter'

const StartYearAtUniFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const name = 'startYearAtUni'

  const { selected } = options

  const studentsGroupedByYear = _.groupBy(withoutSelf(), student => new Date(student.started).getFullYear())
  const countsByYear = _.mapValues(studentsGroupedByYear, students => students.length)

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
