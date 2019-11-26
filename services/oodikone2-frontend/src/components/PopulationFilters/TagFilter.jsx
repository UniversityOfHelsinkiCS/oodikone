import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape, arrayOf } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { tagFilter } from '../../populationFilters'
import Track from './tracking'

const TagFilter = ({ setPopulationFilterAction, removePopulationFilterAction, filter, tags }) => {
  const [options, setOptions] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [selectedComp, setSelectedComp] = useState(null)

  const createOptions = () => {
    const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    setOptions(createdOptions)
  }

  useEffect(() => {
    createOptions()
  }, [])

  const handleFilter = () => {
    setPopulationFilterAction(tagFilter({ tag: selectedTag, comp: selectedComp }))
    Track.set(__filename)
  }

  const handleCompChange = (e, { value }) => {
    setSelectedComp(value)
  }

  const handleChange = (e, { value }) => {
    const selection = options.find(tag => tag.value === value)
    setSelectedTag(selection)
  }
  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
    Track.cleared(__filename)
  }

  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Popup
            content={infoTooltips.PopulationStatistics.Filters.TagFilter}
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
          <Form.Group inline>
            <Form.Field>
              <label>Select students that </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select"
                options={[{ key: 1, text: 'have', value: 1 }, { key: 2, text: "don't have", value: 0 }]}
                onChange={handleCompChange}
                selectOnBlur={false}
                selectOnNavigation={false}
              />
            </Form.Field>
            <Form.Field>
              <label>a tag </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select tag"
                options={options}
                onChange={handleChange}
                selectOnBlur={false}
                selectOnNavigation={false}
              />
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter} disabled={!selectedTag || selectedComp === null}>
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
      Students that {filter.params.comp ? 'have' : "don't have"} a tag {filter.params.text}
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
  tags: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ tags }) => ({
  tags: tags.data
})

export default connect(
  mapStateToProps,
  {
    setPopulationFilterAction: setPopulationFilter,
    removePopulationFilterAction: removePopulationFilter
  }
)(TagFilter)
