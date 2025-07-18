import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'

import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const TagsFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const { includedTags, excludedTags } = options

  const tagCounts: Record<string, { count: number; name: string }> = {}
  for (const student of students) {
    for (const {
      tag_id: id,
      tag: { tagname },
    } of student.tags) {
      tagCounts[id] ??= { count: 0, name: tagname }
      tagCounts[id].count++
    }
  }

  if (!Object.keys(tagCounts).length)
    return <Alert severity="warning">No tags have been defined for any of the selected students.</Alert>

  const dropdownOptions = Object.entries(tagCounts).map(([tagId, { count, name }]) => ({
    key: `tag-${tagId}`,
    text: `${name} (${count})`,
    value: tagId,
  }))

  const includeOptions = dropdownOptions.filter(({ value }) => !excludedTags.includes(value))
  const excludeOptions = dropdownOptions.filter(({ value }) => !includedTags.includes(value))

  return (
    <Stack gap={1}>
      <FilterSelect
        filterKey="tagsFilter-include"
        label="Include students with tags"
        multiple
        onChange={({ target }) => onOptionsChange({ ...options, includedTags: target.value })}
        options={includeOptions}
        value={includedTags}
      />
      <FilterSelect
        filterKey="tagsFilter-exclude"
        label="Exclude students with tags"
        multiple
        onChange={({ target }) => onOptionsChange({ ...options, excludedTags: target.value })}
        options={excludeOptions}
        value={excludedTags}
      />
    </Stack>
  )
}

export const tagsFilter = createFilter({
  key: 'Tags',

  title: 'Tags',

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
