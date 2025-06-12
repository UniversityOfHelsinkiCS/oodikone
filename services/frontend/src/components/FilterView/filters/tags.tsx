import { Form, Dropdown, Message } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const TagsFilterCard = ({ options, onOptionsChange, students }) => {
  const name = 'tagsFilter'
  const { includedTags, excludedTags } = options

  const tagCounts = new Map<string, { count: number; name: string }>()
  for (const student of students) {
    for (const {
      tag_id: id,
      tag: { tagname },
    } of student.tags) {
      tagCounts[id] ??= { count: 0, name: tagname }
      tagCounts[id].count++
    }
  }

  const dropdownOptions = Array.from(tagCounts.entries()).map(([tagId, { count, name }]) => ({
    key: `tag-${tagId}`,
    text: `${name} (${count})`,
    value: tagId,
  }))

  const includeOptions = dropdownOptions.filter(({ value }) => !excludedTags.includes(value))
  const excludeOptions = dropdownOptions.filter(({ value }) => !includedTags.includes(value))

  if (!tagCounts.size)
    return (
      <Message color="orange" size="tiny">
        No tags have been defined for any of the selected students.
      </Message>
    )

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

  isActive: ({ includedTags, excludedTags }) => !!includedTags.length || !!excludedTags.length,

  filter(student, { options }) {
    const { includedTags, excludedTags } = options
    const tags = (student.tags ?? []).map(tag => tag.tag_id)
    if (includedTags.length && excludedTags.length)
      return includedTags.some(tag => tags.includes(tag)) && !excludedTags.some(tag => tags.includes(tag))
    else if (includedTags.length) return includedTags.some(tag => tags.includes(tag))
    else if (excludedTags.length) return !excludedTags.some(tag => tags.includes(tag))

    return true
  },

  render: TagsFilterCard,
})
