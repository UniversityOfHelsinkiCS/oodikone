import React, { useState, useEffect } from 'react'
import { Form, Dropdown } from 'semantic-ui-react'

import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

export default () => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()

  const [value, setValue] = useState([])
  const name = 'tagsFilter'
  const isActive = () => value.length > 0

  useEffect(() => {
    if (!isActive()) {
      removeFilter(name)
      analytics.clearFilter(name)
    } else {
      addFilter(name, student =>
        value.some(tag => {
          const studentTags = student.tags ? student.tags.map(studentTag => studentTag.tag.tagname) : []
          return studentTags.includes(tag)
        })
      )
      analytics.setFilter(name, value.join(', '))
    }
  }, [value])

  const countsByTag = {}
  withoutFilter(name).forEach(student => {
    student.tags.forEach(tag => {
      const name = tag.tag.tagname
      countsByTag[name] = countsByTag[name] ? countsByTag[name] + 1 : 1
    })
  })

  const options = Object.keys(countsByTag).map(tag => ({
    key: `tag-${tag}`,
    text: `${tag} (${countsByTag[tag]})`,
    value: tag,
  }))

  if (Object.entries(countsByTag).length === 0) return null

  return (
    <FilterCard
      title="Tags"
      contextKey="tagsFilter"
      footer={<ClearFilterButton disabled={!isActive()} onClick={() => setValue([])} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form>
          <Dropdown
            multiple
            selection
            fluid
            options={options}
            button
            className="mini"
            placeholder="Choose Tags to include"
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            value={value}
            data-cy={`${name}-dropdown`}
          />
        </Form>
      </div>
    </FilterCard>
  )
}
