import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape, arrayOf, object } from 'prop-types'
import { uniqBy } from 'lodash'

import infoTooltips from '../../common/InfoToolTips'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { studytrackFilter } from '../../populationFilters'
import { flattenStudyrights } from '../../common'
import Track from './tracking'

const StudytrackFilter = ({
  setPopulationFilterAction,
  removePopulationFilterAction,
  filter,
  samples,
  studyRights
}) => {
  const [options, setOptions] = useState([])
  const [selectedStudytracks, setSelectedStudytracks] = useState(null)
  const createOptions = () => {
    const studytracks = samples.reduce((acc, curr) => {
      const newestStudytracks = flattenStudyrights(curr.studyrights, studyRights.programme)
      const studentsStudyrightElements = curr.studyrights.flatMap(studyright => studyright.studyright_elements)
      const studentsStudytracks = studentsStudyrightElements.filter(
        studyrightElement =>
          studyrightElement.element_detail.type === 30 && newestStudytracks.includes(studyrightElement.code)
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
    setPopulationFilterAction(studytrackFilter({ studytracks: selectedStudytracks, programme: studyRights.programme }))
    Track.set(__filename)
  }

  const handleChange = (e, { value }) => {
    const selections = options.filter(option => value.includes(option.key))
    setSelectedStudytracks({ codes: value, names: selections.map(selection => selection.text) })
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
            <Form.Field style={{ width: '500px' }}>
              <Dropdown
                placeholder="select studytrack"
                options={options}
                onChange={handleChange}
                selectOnBlur={false}
                selectOnNavigation={false}
                multiple
                fluid
                selection
                search
              />
            </Form.Field>
            <Form.Field>
              <label> studytrack(s) </label>
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter} disabled={!selectedStudytracks}>
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
      Students that are in studytrack(s) {filter.params.text.join(', ')}
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
  filter: shape({}).isRequired,
  studyRights: shape({}).isRequired
}

export default connect(
  null,
  {
    setPopulationFilterAction: setPopulationFilter,
    removePopulationFilterAction: removePopulationFilter
  }
)(StudytrackFilter)
