import React from 'react'
import { Form, Dropdown, Message } from 'semantic-ui-react'
import fp from 'lodash/fp'
import { createFilter } from './createFilter'

const TagsFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const name = 'tagsFilter'

  const countsByTag = fp.flow(fp.map('tags'), fp.flatten, fp.countBy('tag.tagname'))(withoutSelf())

  const dropdownOptions = Object.keys(countsByTag).map(tag => ({
    key: `tag-${tag}`,
    text: `${tag} (${countsByTag[tag]})`,
    value: tag,
  }))

  if (Object.entries(countsByTag).length === 0) {
    return (
      <Message color="orange" size="tiny">
        No tags have been defined for any of the selected students.
      </Message>
    )
  }

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
          placeholder="Choose Tags to include"
          onChange={(_, { value }) =>
            onOptionsChange({
              selected: value,
            })
          }
          value={options.selected}
          data-cy={`${name}-dropdown`}
        />
      </Form>
    </div>
  )
}

export const tagsFilter = createFilter({
  key: 'Tags',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  filter(student, { selected }) {
    const tags = (student.tags ?? []).map(tag => tag.tag.tagname)
    return selected.some(tag => tags.includes(tag))
  },

  component: TagsFilterCard,
})
