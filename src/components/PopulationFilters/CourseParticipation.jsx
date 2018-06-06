import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import { removePopulationFilter, alterPopulationCourseFilter } from '../../redux/populationFilters'

class CourseParticipation extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    alterPopulationCourseFilter: func.isRequired
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  selectField = field => () => {
    const selectedField = this.props.filter.params[1]
    if (field !== selectedField) {
      this.props.alterPopulationCourseFilter(this.props.filter.id, field)
    }
  }

  render() {
    const { filter } = this.props

    if (filter.notSet) {
      return null
    }

    const course = filter.params[0]
    const selectedField = filter.params[1]

    const active = field =>
      (selectedField === field)

    return (
      <div>
        <Segment.Group horizontal>
          <Segment>
            <em>{course.course.name}</em>
            <span style={{ float: 'right' }}>
              <Icon name="remove" onClick={this.clearFilter} />
            </span>
          </Segment>
          <Segment
            inverted={active('all')}
            secondary={active('all')}
            onClick={this.selectField('all')}
          >
            all
          </Segment>
          <Segment
            inverted={active('passed')}
            secondary={active('passed')}
            onClick={this.selectField('passed')}
          >
            passed
          </Segment>
          <Segment
            inverted={active('retryPassed')}
            secondary={active('retryPassed')}
            onClick={this.selectField('retryPassed')}
          >
            passed after fail
          </Segment>
          <Segment
            inverted={active('failed')}
            secondary={active('failed')}
            onClick={this.selectField('failed')}
          >
            failed
          </Segment>
          <Segment
            inverted={active('failedMany')}
            secondary={active('failedMany')}
            onClick={this.selectField('failedMany')}
          >
            failed many
          </Segment>
        </Segment.Group>
      </div>
    )
  }
}

export default connect(null, {
  removePopulationFilter, alterPopulationCourseFilter
})(CourseParticipation)
