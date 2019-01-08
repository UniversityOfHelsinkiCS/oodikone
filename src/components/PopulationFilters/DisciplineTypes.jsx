import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Dropdown, Button, Form, Input, Popup } from 'semantic-ui-react'
import { shape, func, arrayOf, object } from 'prop-types'
import _ from 'lodash'

import infoTooltips from '../../common/InfoToolTips'
import { courseParticipation } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class DisciplineTypes extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    courseTypes: shape({}).isRequired,
    disciplines: shape({}).isRequired,
    courses: arrayOf(object).isRequired

  }

  state = {
    discipline: '',
    courseType: '',
    atleast: 0
  }

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }

  handleFilter = () => {
    const courses = this.props.courses.filter(({ course, stats }) =>
      course.disciplines[this.state.discipline] &&
      course.coursetypes[this.state.courseType] &&
      stats.students >= this.state.atleast)
    courses.forEach(course => this.props.setPopulationFilter(courseParticipation({ field: 'all', course })))
    this.setState({ discipline: '', courseType: '' })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, courseTypes, disciplines } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.DisciplineTypes}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Filter by </label>
              </Form.Field>
              <Form.Field
                style={{ width: 135 }}
              >
                <Dropdown
                  search
                  fluid
                  icon={null}
                  name="courseType"
                  placeholder="course type"
                  onChange={this.handleChange}
                  value={this.state.courseType}
                  options={_.sortBy(Object.entries(courseTypes).map(([value, text]) => ({
                    text: text.fi,
                    value
                  })), entry => entry.text)}
                />
              </Form.Field>
              <Form.Field>
                <label> of </label>
              </Form.Field>
              <Form.Field
                style={{ width: 200 }}
              >
                <Dropdown
                  search
                  icon={null}
                  fluid
                  name="discipline"
                  placeholder="discipline"
                  onChange={this.handleChange}
                  value={this.state.discipline}
                  options={_.sortBy(Object.entries(disciplines).map(([value, text]) => ({
                    text: text.fi,
                    value
                  })), entry => entry.text)}
                />
              </Form.Field>
              <Form.Field>
                <label> and at least </label>
              </Form.Field>
              <Form.Field>
                <Input
                  transparent
                  maxLength="3"
                  style={{ width: 30 }}
                  name="atleast"
                  onChange={this.handleChange}
                  value={this.state.atleast}
                />
              </Form.Field>
              <Form.Field>
                <label> participants</label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleFilter}
                  disabled={this.state.discipline.length === 0 ||
                    this.state.courseType.length === 0 ||
                    !String(this.state.atleast).match(/^[0-9]+$/)}
                >
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
        Participants of {filter.params.discipline} {filter.params.courseType}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ populationCourses }) => ({
  courseTypes: populationCourses[0].data.coursetypes,
  disciplines: populationCourses[0].data.disciplines,
  courses: populationCourses[0].data.coursestatistics
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(DisciplineTypes)
