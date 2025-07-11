import { Form, Dropdown, type DropdownItemProps } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const CurriculumPeriodFilterCard = ({ options, onOptionsChange, students }) => {
  const { selected } = options

  const dropdownOptions: DropdownItemProps[] = Array.from(
    students
      .map(({ curriculumVersion }) => curriculumVersion)
      .filter(Boolean)
      .sort()
      .reverse()
      .reduce((versions: Map<string, DropdownItemProps>, curriculumVersion: string) => {
        versions.set(curriculumVersion, {
          key: curriculumVersion,
          text: curriculumVersion,
          value: curriculumVersion,
        })

        return versions
      }, new Map())
      .values()
  )

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy="curriculumPeriodFilter-dropdown"
          fluid
          onChange={(_, { value: inputValue }) => onOptionsChange({ selected: inputValue })}
          options={dropdownOptions}
          placeholder="Choose curriculum period"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const curriculumPeriodFilter = createFilter({
  key: 'CurriculumPeriod',

  title: 'Curriculum period',

  defaultOptions: { selected: null },

  isActive: ({ selected }) => !!selected,

  filter({ curriculumVersion }, { options }) {
    const { selected } = options

    return selected === curriculumVersion
  },

  render: CurriculumPeriodFilterCard,
})
