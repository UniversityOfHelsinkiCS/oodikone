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
import ExtentGraduated from './ExtentGraduated'
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
    populationFilters: object.isRequired, //eslint-disable-line
    populationCourses: object.isRequired //eslint-disable-line
  }

  state = {
    visible: false,
    presetName: '',
    presetFilters: [],
    firstRenderKludge: true
  }
  componentDidUpdate(prevProps) {
    if (this.state.firstRenderKludge || (this.props.populationCourses.pending === false
      && prevProps.populationCourses.pending === true)
      || (this.props.populationFilters.filtersFromBackend.length
        !== prevProps.populationFilters.filtersFromBackend.length)) {
      this.updateFilterList(this.props.populationFilters.filtersFromBackend)
      this.setState({ firstRenderKludge: !this.state.firstRenderKludge }) // eslint-disable-line react/no-did-update-set-state,max-len
      /* You may call setState() immediately in componentDidUpdate()
         but note that it must be wrapped in a condition */
    }
  }
  updateFilterList(filtersToCreate) {
    // sorry for the uglyness but it kinda works (I think)
    const regenerateFilterFunctions = filters =>    /* eslint-disable */
      filters.map(f => f.type === 'Preset' ?
        getFilterFunction(f.type, { ...f, filters: regenerateFilterFunctions(f.filters) },
          this.props.populationCourses.data)
        :
        getFilterFunction(f.type, f.params, this.props.populationCourses.data))

    if (filtersToCreate) {
      const newFilters = filtersToCreate.map(newFilter =>
        ({
          ...newFilter,
          filters: regenerateFilterFunctions(newFilter.filters)
        }))
      this.setState({ presetFilters: this.state.presetFilters.concat(newFilters) })
    }
  }
  destroyFromAllFilters = id => this.setState({ presetFilters: this.state.presetFilters.filter(filter => filter.id !== id) })


  renderAddFilters() {
    const { extents } = this.props
    _.forOwn(extents, e => e.type = 'ExtentGraduated')
    const filteredExtents = extents.filter(e => e.extentcode < 9)
    const allFilters = _.union(Object.keys(componentFor).map(f =>
      String(f)), this.state.presetFilters.map(f => f.id), filteredExtents.map(f => f.name.fi))
    const setFilters = _.union(
      this.props.filters.map(f => f.type),
      this.props.filters.filter(f => f.type === 'Preset').map(f => f.id),
      this.props.filters.filter(f => f.type === 'ExtentGraduated').map(f => f.name.fi)
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
        {unsetFilters.map(filterName => {//eslint-disable-line
          if (componentFor[filterName]) { // THIS IS KINDA HACKED SOLUTION PLS FIX
            return React.createElement(componentFor[filterName], {
              filter: { notSet: true }, key: filterName
            })
          } else if (filteredExtents.find(e => e.name.fi === filterName)) {
            return React.createElement(ExtentGraduated, {
              filter: { notSet: true, ...filteredExtents.find(e => e.name.fi === filterName) }, key: filterName
            })
          } else {
            return React.createElement(Preset, {
              filter: {
                ...this.state.presetFilters.find(f => f.id === filterName),
                notSet: true
              },
              key: filterName,
              destroy: this.destroyFromAllFilters
            })
          }
        })
        }
        <Button onClick={() => this.setState({ visible: false })}>cancel</Button>
      </Segment>
    )
  }


  renderSetFilters() {
    const formatFilter = (filter) => {
      let filterToSave = {}
      if (filter.type === 'Preset') {
        filterToSave = {
          ...filter,
          filters: filter.filters.map(f => formatFilter(f))
        }
      } else {
        filterToSave = {
          id: filter.id,
          type: filter.type,
          name: filter.name,
          params: filter.type === 'CourseParticipation' ?
            {
              field: filter.params.field,
              course: {
                course: {
                  name: filter.params.course.course.name,
                  code: filter.params.course.course.code
                }
              }
            }
            :
            filter.params
        }
      }
      return filterToSave
    }
    const handleSavePopulationFilters = () => {
      const preset = {
        id: uuidv4(),
        name: this.state.presetName,
        population: this.props.studyRights,
        filters: this.props.filters
      }
      this.setState({ presetName: '' })
      const presetToSave = {
        ...preset,
        filters: preset.filters.map(filter => formatFilter(filter))
      }

      this.props.savePopulationFilters(presetToSave)
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
        {this.props.filters.map(filter => {
          if (filter.type === 'ExtentGraduated') {
            return React.createElement(ExtentGraduated, {
              filter, key: filter.id
            })
          }
          else if (filter.type !== 'Preset') {
            return React.createElement(componentFor[filter.type], { filter, key: filter.id })
          }
          return React.createElement(Preset, {
            filter, key: filter.id, destroy: this.destroyFromAllFilters
          })
        })}

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

const mapStateToProps = ({
  populationFilters,
  locale,
  graphSpinner,
  populations,
  populationCourses
}) => ({

  populationCourses: populationCourses[0],
  populationFilters,
  filters: populationFilters.filters,
  complemented: populationFilters.complemented,
  translate: getTranslate(locale),
  loading: graphSpinner,
  studyRights: populations.query.studyRights,
  extents: populations.data.extents
})

export default connect(mapStateToProps, {
  clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter
})(PopulationFilters)
