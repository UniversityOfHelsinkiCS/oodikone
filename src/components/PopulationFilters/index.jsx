import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button, Form, Radio, Modal, Icon, TextArea, Input } from 'semantic-ui-react'
import { object, func, arrayOf, bool, string } from 'prop-types'
import _ from 'lodash'
import uuidv4 from 'uuid/v4'

import { getTranslate } from 'react-localize-redux'
import CreditsLessThan from './CreditsLessThan'
import CreditsAtLeast from './CreditsAtLeast'
import StartingThisSemester from './StartingThisSemester'
import CourseParticipation from './CourseParticipation'
import CourseParticipationNTimes from './CourseParticipationNTimes'
import ExtentGraduated from './ExtentGraduated'
import Preset from './Preset'
import DisciplineTypes from './DisciplineTypes'
import EnrollmentStatus from './EnrollmentStatus'
import TransferFilter from './TransferFilter'
import { clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter } from '../../redux/populationFilters'
import { presetFilter, getFilterFunction } from '../../populationFilters'


const componentFor = {
  CreditsAtLeast,
  CreditsLessThan,
  StartingThisSemester,
  CourseParticipationNTimes,
  DisciplineTypes,
  EnrollmentStatus,
  CourseParticipation,
  ExtentGraduated,
  TransferFilter
}
const advancedFilters = { // Filters that are too hard to use for common folk
  DisciplineTypes,
  TransferFilter,
  ExtentGraduated

}
const persistantFilters = { // Filters that can be duplicated with different values
  ExtentGraduated,
  TransferFilter
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
    presetDescription: '',
    presetFilters: [],
    firstRenderKludge: true,
    advancedUser: false,
    modalOpen: false
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
  formatFilter = (filter) => {
    let filterToSave = {}
    if (filter.type === 'Preset') {
      filterToSave = {
        ...filter,
        filters: filter.filters.map(f => this.formatFilter(f))
      }
    } else {
      filterToSave = {
        ...filter,
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
  handleSavePopulationFilters = () => {
    const preset = {
      id: uuidv4(),
      name: this.state.presetName,
      description: this.state.presetDescription,
      population: this.props.studyRights,
      filters: this.props.filters
    }
    this.setState({ presetName: '', presetDescription: '' })
    const presetToSave = {
      ...preset,
      filters: preset.filters.map(filter => this.formatFilter(filter))
    }
    this.props.savePopulationFilters(presetToSave)
    this.updateFilterList([preset])
    this.props.clearPopulationFilters()
    this.props.setPopulationFilter(presetFilter(preset))
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
    const { extents, transfers } = this.props

    const allFilters = _.union(Object.keys(componentFor).filter(f =>
      !(Object.keys(advancedFilters).includes(f) && !this.state.advancedUser)).map(f =>
        String(f)), this.state.presetFilters.map(f => f.id).filter(f => this.state.advancedUser))

    const setFilters = _.union(
      this.props.filters.map(f => f.type),
      this.props.filters.filter(f => f.type === 'Preset').map(f => f.id),

    )
    const unsetFilters = _.uniq(_.difference(allFilters, setFilters.filter(setFilter => !Object.keys(persistantFilters).includes(setFilter))))
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
          <Radio
            toggle
            label="Advanced filters"
            checked={this.state.advancedUser}
            onChange={() => this.setState({ advancedUser: !this.state.advancedUser })}
          />
        </div>
        {unsetFilters.map(filterName => {//eslint-disable-line
          if (componentFor[filterName]) { // THIS IS KINDA HACKED SOLUTION PLS FIX
            return React.createElement(componentFor[filterName], {
              filter: { notSet: true }, key: filterName, samples: this.props.samples, transfers, extents
            })
          }
          else {
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


  renderSetFilters(handleSave) {
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

          if (filter.type !== 'Preset') {
            return React.createElement(componentFor[filter.type], { filter, key: filter.id, samples: this.props.samples, transfers: this.props.transfers, extents: this.props.extents })
          }
          return React.createElement(Preset, {
            filter, key: filter.id, destroy: this.destroyFromAllFilters
          })
        })}

        <Button onClick={this.props.clearPopulationFilters}>clear all filters</Button>
        {this.state.advancedUser ?
          <Modal
            style={{
              marginTop: 'auto !important',
              display: 'inline-block !important',
              position: 'relative',
              top: '20%',
              left: '33%'
            }}
            trigger={<Button onClick={() => this.setState({ modalOpen: true })}>Save filters as preset</Button>}
            open={this.state.modalOpen}
            onClose={() => this.setState({ modalOpen: false })}
            size='small'
          >
            <Header />
            <Modal.Content>
              <Form>
                <Form.Field>
                  <h2> Save current filters as preset </h2>
                  <em> This filter is saved in this population for future use </em>
                  <Input placeholder="Name..." maxLength={40} onChange={e => this.setState({ presetName: e.target.value })} />
                </Form.Field>
                <Form.Field>
                  <em> explain what your filter is doing here </em>
                  <TextArea placeholder="Description..." maxLength={160} onChange={e => this.setState({ presetDescription: e.target.value })} />
                </Form.Field>
              </Form>
            </Modal.Content>
            <Modal.Actions>
              <Button
                negative
                onClick={() => this.setState({ modalOpen: false })}
              >Cancel
                </Button>
              <Button
                disabled={this.state.presetName === ''}
                color='green'
                onClick={() => {
                  handleSave()
                  this.setState({ modalOpen: false })
                }}
                inverted>
                <Icon name='checkmark' /> Save
            </Button>
            </Modal.Actions>
          </Modal>
          : null
        }
      </Segment>
    )
  }

  render() {
    return (
      <div>
        {this.renderAddFilters()}
        {this.renderSetFilters(this.handleSavePopulationFilters)}
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
  extents: populations.data.extents,
  transfers: populations.data.transfers
})

export default connect(mapStateToProps, {
  clearPopulationFilters, setComplementFilter, savePopulationFilters, setPopulationFilter
})(PopulationFilters)
