import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Popup } from 'semantic-ui-react'
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
    const selectedField = this.props.filter.params.field
    if (field !== selectedField) {
      this.props.alterPopulationCourseFilter(this.props.filter.id, field)
    }
  }

  renderFilterSegment = (type, text, active) =>
    (
      <Segment
        inverted={active(type)}
        secondary={active(type)}
        onClick={this.selectField(type)}
        style={{
          width: 30,
          height: 60,
          fontSize: 13,
          textAlign: 'center',
          verticalAlign: 'middle',
          lineHeight: 1,
          paddingTop: 15
        }}
      >
        {text}
      </Segment>
    )

  render() {
    const { filter } = this.props
    if (filter.notSet) {
      return null
    }
    const { course, field } = filter.params
    const selectedField = field

    const active = field2 =>
      (selectedField === field2)

    return (
      <div>
        <Segment.Group horizontal size="small">
          <Popup
            trigger={
              <Segment
                style={{ width: '30%', height: 40 }}
              >
                <em style={{ float: 'left',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  width: '80%'
                }}
                >
                  {course.course.name}
                </em>
                <span style={{ float: 'right' }}>
                  <Icon name="remove" onClick={this.clearFilter} />
                </span>
              </Segment>}
            content={course.course.name}
          />
          {this.renderFilterSegment('all', 'all', active)}
          {this.renderFilterSegment('passed', 'passed', active)}
          {this.renderFilterSegment('retryPassed', 'passed after fail', active)}
          {this.renderFilterSegment('failed', 'failed', active)}
          {this.renderFilterSegment('failedMany', 'failed many', active)}
          {this.renderFilterSegment('notParticipated', 'not participated', active)}
          {this.renderFilterSegment('notParticipatedOrFailed', 'not participated or failed', active)}
        </Segment.Group>
      </div>
    )
  }
}

export default connect(null, {
  removePopulationFilter, alterPopulationCourseFilter
})(CourseParticipation)
