import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button, Form, Radio } from 'semantic-ui-react'
import { object, func, arrayOf, bool, string } from 'prop-types'
import _ from 'lodash'
import uuidv4 from 'uuid/v4'


import { getTranslate } from 'react-localize-redux'
import CreditsLessThan from './CreditsLessThan'
import CreditsAtLeast from './CreditsAtLeast'
import StartingThisSemester from './StartingThisSemester'
import SexFilter from './SexFilter'
import CourseParticipation from './CourseParticipation'
import Preset from './Preset'
import { clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter } from '../../redux/populationFilters'
import { presetFilter } from '../../populationFilters'


const componentFor = {
  CreditsAtLeast,
  CreditsLessThan,
  StartingThisSemester,
  SexFilter,
  CourseParticipation,
  Preset
}

class PopulationFilters extends Component {
  static propTypes = {
    filters: arrayOf(object).isRequired,
    complemented: bool.isRequired,
    clearPopulationFilters: func.isRequired,
    setComplementFilter: func.isRequired,
    savePopulationFilters: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyRights: arrayOf(string).isRequired
  }

  state = {
    visible: false,
    presetName: ''
  }

  renderAddFilters() {
    const allFilters = Object.keys(componentFor).map(f => String(f))
    const setFilters = this.props.filters.map(f => f.type)
    const unsetFilters = _.difference(allFilters, setFilters)


    if (unsetFilters.length === 0) {
      return null
    }

    if (!this.state.visible) {
      return (
        <Segment>
          <Header>Add filters</Header>
          <Button onClick={() => this.setState({ visible: true })}>add</Button>
        </Segment>
      )
    }

    return (
      <Segment>
        <Header>Add filters</Header>
        <div>
          <em>
            Note that filters does not work yet when population is limited by students
            that have participated a specific course
          </em>
        </div>
        {unsetFilters.map(filterName =>
          React.createElement(componentFor[filterName], {
            filter: { notSet: true }, key: filterName
          }))}
        <Button onClick={() => this.setState({ visible: false })}>cancel</Button>
      </Segment>
    )
  }

  renderSetFilters() {
    const setFilters = this.props.filters.map(f => f.type)
    if (setFilters.length === 0) {
      return null
    }

    const handleSavePopulationFilters = () => {
      const preset = {
        id: uuidv4(),
        name: this.state.presetName,
        population: this.props.studyRights,
        filters: this.props.filters
      }
      this.setState({ presetName: '' })
      this.props.savePopulationFilters(preset)
      this.props.clearPopulationFilters()
      this.props.setPopulationFilter(presetFilter(preset))
    }

    return (
      <Segment>
        <Header>Filters</Header>
        <Form>
          <Form.Group inline>
            <Form.Field>
              <label>Showing students that</label>
            </Form.Field>
            <Form.Field>
              <Radio
                toggle
                checked={this.props.complemented}
                onClick={this.props.setComplementFilter}
              />
            </Form.Field>
            <Form.Field>
              <label>{!this.props.complemented ? ' are included in the filters.' : ' are in excluded by the filters.'}</label>
            </Form.Field>
          </Form.Group>
        </Form>
        {this.props.filters.map(filter =>
          React.createElement(componentFor[filter.type], { filter, key: filter.id }))}
        <Button onClick={this.props.clearPopulationFilters}>clear all filters</Button>
        <div className="ui action input">
          <input type="text" placeholder="Name..." onChange={e => this.setState({ presetName: e.target.value })} />
          <button className="ui button" onClick={handleSavePopulationFilters}>save filters as preset</button>
        </div>

      </Segment>
    )
  }

  render() {
    return (
      <div>
        {this.renderAddFilters()}
        {this.renderSetFilters()}
      </div>
    )
  }
}

const mapStateToProps = ({ populationFilters, locale, graphSpinner, populations }) => ({
  filters: populationFilters.filters,
  complemented: populationFilters.complemented,
  translate: getTranslate(locale),
  loading: graphSpinner,
  studyRights: populations.query.studyRights
})

export default connect(mapStateToProps, {
  clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter
})(PopulationFilters)
