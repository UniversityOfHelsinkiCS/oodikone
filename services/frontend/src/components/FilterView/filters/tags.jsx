import { Form, Dropdown, Message } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const TagsFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const name = 'tagsFilter'

  const tagCounts = withoutSelf().reduce((acc, student) => {
    student.tags.forEach(tag => {
      const {
        tag_id: id,
        tag: { tagname },
      } = tag
      if (!acc[id]) {
        acc[id] = { count: 0, name: tagname }
      }
      acc[id].count += 1
    })
    return acc
  }, {})

  const dropdownOptions = Object.entries(tagCounts).map(([tagId, { count, name }]) => ({
    key: `tag-${tagId}`,
    text: `${name} (${count})`,
    value: tagId,
  }))

  if (Object.entries(tagCounts).length === 0) {
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
          placeholder="Choose tags to include"
          selection
          value={options.selected}
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
    const tags = (student.tags ?? []).map(tag => tag.tag_id)
    return selected.some(tag => tags.includes(tag))
  },

  component: TagsFilterCard,
})
