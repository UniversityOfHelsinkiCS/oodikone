import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape, arrayOf } from 'prop-types'
import _ from 'lodash'

import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { tagFilter } from '../../populationFilters'



const TagFilter = ({ setPopulationFilterAction, removePopulationFilterAction, filter, samples }) => {
  const [options, setOptions] = useState([])
  const [selectedTag, setSelectedTag] = useState()

  const createOptions = () => {
    const merge = samples.map(s => s.tags.map(t => ({ tagname: t.tag.tagname, tag_id: t.tag.tag_id }))).flat(1)
    const uniqueTags = _.uniqBy(merge, 'tag_id')
    const createdOptions = uniqueTags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    setOptions(createdOptions)
  }

  useEffect(() => {
    createOptions()
  }, [])

  const handleFilter = () => {
    setPopulationFilterAction(tagFilter({ tag: selectedTag }))
  }

  const handleChange = (e, { value }) => {
    // any better solutions?
    const selection = options.filter(tag => tag.value === value)
    setSelectedTag(selection[0])
  }
  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
  }

  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Popup
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
          <Form.Group inline>
            <Form.Field>
              <label>Select students that have tag </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select tag"
                options={options}
                onChange={handleChange}
                selectOnBlur={false}
              />
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter}>
                set filter
              </Button>
            </Form.Field>
          </Form.Group>
        </Form>
      </Segment>
    )
  }
  return (
    <Segment>
      Students that have a tag {filter.params.tagname}
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}

TagFilter.propTypes = {
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired,
  samples: arrayOf(shape({})).isRequired
}

export default connect(
  null,
  { setPopulationFilterAction: setPopulationFilter, removePopulationFilterAction: removePopulationFilter }
)(TagFilter)
