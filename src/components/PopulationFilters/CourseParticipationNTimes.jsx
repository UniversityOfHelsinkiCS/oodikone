import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Form, Input, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import { courseParticipationNTimes } from '../../populationFilters'
import { removePopulationFilter, alterPopulationCourseFilter, setPopulationFilter } from '../../redux/populationFilters'

class CourseParticipationNTimes extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    populationCourses: shape({}).isRequired
  }

  state = {
    participationAmount: 0,
    code: '375063'
  }

  handleChange = (e) => {
    this.setState({ participationAmount: e.target.value })
  }

  handleLimit = () => {
    this.props.setPopulationFilter(courseParticipationNTimes({
      amount: this.state.participationAmount, course: this.state.code
    }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  courseInPopulation = () => {
    const { populationCourses } = this.props
    if (populationCourses[0]) {
      return populationCourses[0].query.studyRights.includes('MH30_001')
    }
    return false
  }

  render() {
    const { filter } = this.props
    const { participationAmount } = this.state
    if (!this.courseInPopulation()) {
      return null
    }
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>
                  Show only students that have participated in International Progress Test less than
                </label>
              </Form.Field>
              <Form.Field>
                <Input
                  type="number"
                  onChange={this.handleChange}
                  value={participationAmount}
                />
              </Form.Field>
              <Form.Field>
                <label>times</label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleLimit}
                  disabled={participationAmount === 0}
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
        Participated in
        <i> International Progress Test </i>
        less than <b>{filter.params.amount}</b> times
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ populationCourses }) => ({
  populationCourses
})

export default connect(mapStateToProps, {
  removePopulationFilter, alterPopulationCourseFilter, setPopulationFilter
})(CourseParticipationNTimes)
