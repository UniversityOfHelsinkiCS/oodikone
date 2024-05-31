import { Form, Dropdown, Message } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const TagsFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const name = 'tagsFilter'
  const { includedTags, excludedTags } = options

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

  const includeOptions = dropdownOptions.filter(({ value }) => !excludedTags.includes(value))
  const excludeOptions = dropdownOptions.filter(({ value }) => !includedTags.includes(value))

  if (Object.entries(tagCounts).length === 0) {
    return (
      <Message color="orange" size="tiny">
        No tags have been defined for any of the selected students.
      </Message>
    )
  }

  return (
    <Form>
      <Form.Field>
        <label>Include students with tags</label>
        <Dropdown
          data-cy={`${name}-dropdown-include`}
          fluid
          multiple
          onChange={(_, { value }) => onOptionsChange({ includedTags: value, excludedTags })}
          options={includeOptions}
          placeholder="Choose tags to include"
          selection
          value={includedTags}
        />
      </Form.Field>
      <Form.Field>
        <label>Exclude students with tags</label>
        <Dropdown
          data-cy={`${name}-dropdown-exclude`}
          fluid
          multiple
          onChange={(_, { value }) => onOptionsChange({ includedTags, excludedTags: value })}
          options={excludeOptions}
          placeholder="Choose tags to exclude"
          selection
          value={excludedTags}
        />
      </Form.Field>
    </Form>
  )
}

export const tagsFilter = createFilter({
  key: 'Tags',

  defaultOptions: {
    includedTags: [],
    excludedTags: [],
  },

  isActive: ({ includedTags, excludedTags }) => includedTags.length > 0 || excludedTags.length > 0,

  filter(student, { includedTags, excludedTags }) {
    const tags = (student.tags ?? []).map(tag => tag.tag_id)
    if (includedTags.length > 0 && excludedTags.length > 0) {
      return includedTags.some(tag => tags.includes(tag)) && !excludedTags.some(tag => tags.includes(tag))
    }

    if (includedTags.length > 0) return includedTags.some(tag => tags.includes(tag))

    if (excludedTags.length > 0) return !excludedTags.some(tag => tags.includes(tag))

    return true
  },

  component: TagsFilterCard,
})
