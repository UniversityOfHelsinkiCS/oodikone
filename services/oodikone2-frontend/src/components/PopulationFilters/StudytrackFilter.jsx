import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape, arrayOf, object } from 'prop-types'
import { uniqBy } from 'lodash'

import infoTooltips from '../../common/InfoToolTips'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { studytrackFilter } from '../../populationFilters'
import Track from './tracking'

const StudytrackFilter = ({ setPopulationFilterAction, removePopulationFilterAction, filter, samples }) => {
  const [options, setOptions] = useState([])
  const [selectedStudytrack, setSelectedStudytrack] = useState(null)

  const createOptions = () => {
    const studytracks = samples.reduce((acc, curr) => {
      const studentsStudyrightElements = curr.studyrights.flatMap(studyright => studyright.studyright_elements)
      const studentsStudytracks = studentsStudyrightElements.filter(
        studyrightElement => studyrightElement.element_detail.type === 30
      )
      if (studentsStudytracks.length > 0) acc.push(...studentsStudytracks)
      return acc
    }, [])
    const uniqueStudytracks = uniqBy(studytracks, 'code')
    const filterOptions = uniqueStudytracks.map(studytrack => ({
      key: studytrack.code,
      text: studytrack.element_detail.name.fi,
      value: studytrack.code
    }))
    setOptions(filterOptions)
  }

  useEffect(() => {
    createOptions()
  }, [])

  const handleFilter = () => {
    setPopulationFilterAction(studytrackFilter({ studytrack: selectedStudytrack }))
    Track.set(__filename)
  }

  const handleChange = (e, { value }) => {
    const selection = options.find(option => option.key === value)
    setSelectedStudytrack({ code: value, name: selection.text })
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
            content={infoTooltips.PopulationStatistics.Filters.StudytrackFilter}
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
          <Form.Group inline>
            <Form.Field>
              <label>Select students that are in </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select studytrack"
                options={options}
                onChange={handleChange}
                selectOnBlur={false}
                selectOnNavigation={false}
              />
            </Form.Field>
            <Form.Field>
              <label> studytrack </label>
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter} disabled={!selectedStudytrack}>
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
      Students that are in studytrack {filter.params.text}
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}

StudytrackFilter.propTypes = {
  samples: arrayOf(object).isRequired,
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired
}

export default connect(
  null,
  {
    setPopulationFilterAction: setPopulationFilter,
    removePopulationFilterAction: removePopulationFilter
  }
)(StudytrackFilter)
