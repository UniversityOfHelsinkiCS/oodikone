import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Icon, Popup } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'

import { removePopulationFilter, alterPopulationCourseFilter } from '../../redux/populationFilters'
import { getTextIn } from '../../common'
import Track from './tracking'
import './populationFilters.css'

class CourseParticipation extends Component {
  static propTypes = {
    language: string.isRequired,
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    alterPopulationCourseFilter: func.isRequired
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
    Track.cleared(__filename)
  }

  selectField = field => () => {
    const selectedField = this.props.filter.params.field
    if (field !== selectedField) {
      this.props.alterPopulationCourseFilter(this.props.filter.id, field)
      Track.altered(__filename)
    }
  }

  renderFilterSegment = (type, text, active) => (
    <Segment
      inverted={active(type)}
      secondary={active(type)}
      onClick={this.selectField(type)}
      className="filter-option"
    >
      {text}
    </Segment>
  )

  render() {
    const { filter, language } = this.props
    if (filter.notSet) {
      return null
    }
    const { course, field } = filter.params
    const selectedField = field

    const active = field2 => selectedField === field2

    return (
      <div className="filter-segment">
        <Segment.Group horizontal size="small" className="filter-row">
          <Popup
            trigger={
              <Segment className="filter-title">
                <span className="filter-title-text">{getTextIn(course.course.name, language)}</span>
                <span className="filter-title-icon">
                  <Icon name="remove" onClick={this.clearFilter} />
                </span>
              </Segment>
            }
            content={getTextIn(course.course.name, language)}
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

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(
  mapStateToProps,
  {
    removePopulationFilter,
    alterPopulationCourseFilter
  }
)(CourseParticipation)
