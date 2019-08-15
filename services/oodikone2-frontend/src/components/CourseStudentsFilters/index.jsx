import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button, Form, Radio } from 'semantic-ui-react'
import { func, arrayOf, bool, shape, string } from 'prop-types'
import { union, uniq, difference } from 'lodash'

import CreditsLessThan from '../PopulationFilters/CreditsLessThan'
import CreditsAtLeast from '../PopulationFilters/CreditsAtLeast'
import GradeMeanFilter from '../PopulationFilters/GradeMeanFilter'
import CourseParticipation from '../PopulationFilters/CourseParticipation'
import SexFilter from '../PopulationFilters/SexFilter'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import GradeFilter from './GradeFilter'
import ProgrammeFilter from './ProgrammeFilter'
import CourseCreditFilter from './CourseCreditFilter'
import {
  clearPopulationFilters, setComplementFilter
} from '../../redux/populationFilters'

const componentFor = {
  GradeFilter,
  CourseCreditFilter,
  ProgrammeFilter,
  CreditsAtLeast,
  CreditsLessThan,
  GradeMeanFilter,
  SexFilter,
  CourseParticipation
}

const CourseStudentsFilters = ({ samples, filters, clearPopulationFiltersDispatch, complemented, setComplementFilterDispatch, allStudyrights, coursecodes }) => {
  const [visible, setVisible] = useState(false)

  const renderAddFilters = () => {
    const { Add } = infotooltips.PopulationStatistics.Filters
    const allFilters = union(Object.keys(componentFor))

    const setFilters = union(
      filters.map(f => f.type),
      filters.filter(f => f.type === 'Preset').map(f => f.id),
    )

    const unsetFilters = uniq(difference(allFilters, setFilters))
    if (unsetFilters.length === 0) {
      return null
    }
    if (!visible) {
      return (
        <Segment>
          <Header>Add filters <InfoBox content={Add} /></Header>
          <Button
            onClick={() => setVisible(true)}
          >
            add
          </Button>
        </Segment>
      )
    }
    return (
      <Segment>
        <Header>Add filters <InfoBox content={Add} /></Header>
        {unsetFilters.map(filterName => React.createElement(componentFor[filterName], { filter: { notSet: true }, key: filterName, samples, allStudyrights, coursecodes }))}
        <Button onClick={() => setVisible(false)}>cancel</Button>
      </Segment>
    )
  }

  const renderSetFilters = () => {
    const setFilters = filters.map(f => f.type)
    const { Filters } = infotooltips.PopulationStatistics.Filters
    if (setFilters.length === 0) {
      return null
    }

    return (
      <Segment>
        <Header>Filters <InfoBox content={Filters} /></Header>
        {filters.map(filter => React.createElement(componentFor[filter.type], { filter, key: filter.id, samples, allStudyrights, coursecodes }))}
        <Form>
          <Form.Group inline>
            <Form.Field>
              <label>Show excluded students only</label>
            </Form.Field>
            <Form.Field>
              <Radio
                toggle
                checked={complemented}
                onClick={setComplementFilterDispatch}
              />
            </Form.Field>
          </Form.Group>
        </Form>
        <Button onClick={clearPopulationFiltersDispatch}>clear all filters</Button>
      </Segment>
    )
  }
  return (
    <div>
      {renderAddFilters()}
      {renderSetFilters()}
    </div>
  )
}

CourseStudentsFilters.propTypes = {
  filters: arrayOf(shape([])).isRequired,
  complemented: bool.isRequired,
  samples: arrayOf(shape([])).isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  setComplementFilterDispatch: func.isRequired,
  coursecodes: arrayOf(string).isRequired,
  allStudyrights: shape({}).isRequired
}

const mapStateToProps = ({ populationFilters, coursePopulation }) => ({
  filters: populationFilters.filters,
  complemented: populationFilters.complemented,
  allStudyrights: coursePopulation.students.studyrights
})

export default connect(mapStateToProps, {
  clearPopulationFiltersDispatch: clearPopulationFilters,
  setComplementFilterDispatch: setComplementFilter
})(CourseStudentsFilters)
