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
import { presetFilter, getFilterFunction } from '../../populationFilters'


const componentFor = {
  CreditsAtLeast,
  CreditsLessThan,
  StartingThisSemester,
  SexFilter,
  CourseParticipation
}

class PopulationFilters extends Component {
  static propTypes = {
    filters: arrayOf(object).isRequired,
    complemented: bool.isRequired,
    clearPopulationFilters: func.isRequired,
    setComplementFilter: func.isRequired,
    savePopulationFilters: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyRights: arrayOf(string).isRequired,
    populationFilters: object.isRequired //eslint-disable-line
  }

  state = {
    visible: false,
    presetName: '',
    presetFilters: []
  }
  async componentDidMount() {
    this.updateFilterList(this.props.populationFilters.filtersFromBackend)
  }
  updateFilterList(filtersToCreate) {
    const regenerateFilterFunctions = filters =>
      filters.map(f => f.type === 'Preset' ? ({ ...f, filters: regenerateFilterFunctions(f.filters) }) : getFilterFunction(f.type, f.params)) //eslint-disable-line

    if (filtersToCreate) {
      const newFilters = filtersToCreate.map(f =>
        ({
          ...f,
          filters: regenerateFilterFunctions(f.filters)
        }))

      this.setState({ presetFilters: this.state.presetFilters.concat(newFilters) })
    }
  }


  renderAddFilters() {
    const allFilters = _.union(Object.keys(componentFor).map(f =>
      String(f)), this.state.presetFilters.map(f => f.id))
    const setFilters = _.union(
      this.props.filters.map(f => f.type),
      this.props.filters.filter(f => f.name).map(f => f.id)
    )
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
        {unsetFilters.map(filterName => //eslint-disable-line
          componentFor[filterName] ? // THIS IS KINDA HACKED SOLUTION PLS FIX
            React.createElement(componentFor[filterName], {
              filter: { notSet: true }, key: filterName
            })
            :
            React.createElement(Preset, {
              filter: {
                ...this.state.presetFilters.find(f => f.id === filterName),
                notSet: true
              },
              key: filterName
            }))}
        <Button onClick={() => this.setState({ visible: false })}>cancel</Button>
      </Segment>
    )
  }

  renderSetFilters() {
    const handleSavePopulationFilters = () => {
      const preset = {
        id: uuidv4(),
        name: this.state.presetName,
        population: this.props.studyRights,
        filters: this.props.filters
      }
      this.setState({ presetName: '' })
      this.props.savePopulationFilters(preset)
      this.updateFilterList([preset])
      this.props.clearPopulationFilters()
      this.props.setPopulationFilter(presetFilter(preset))
    }

    const setFilters = this.props.filters.map(f => f.type)
    if (setFilters.length === 0) {
      return null
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
        {this.props.filters.map(filter => //eslint-disable-line
          filter.type !== 'Preset' ?
            React.createElement(componentFor[filter.type], { filter, key: filter.id })
            :
            React.createElement(Preset, { filter, key: filter.filter.id }))}

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
  populationFilters,
  filters: populationFilters.filters,
  complemented: populationFilters.complemented,
  translate: getTranslate(locale),
  loading: graphSpinner,
  studyRights: populations.query.studyRights
})

export default connect(mapStateToProps, {
  clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter
})(PopulationFilters)
