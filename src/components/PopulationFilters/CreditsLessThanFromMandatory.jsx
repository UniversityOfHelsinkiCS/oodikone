import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Input, Button, Form, Popup } from 'semantic-ui-react'
import { shape, func, string, arrayOf } from 'prop-types'

import { creditsLessThanFromMandatory } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import infoTooltips from '../../common/infotooltips'

class CreditsLessThanFromMandatory extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    courses: arrayOf(string).isRequired
  }

  state = {
    limit: ''
  }

  handleChange = (e) => {
    this.setState({ limit: e.target.value })
  }

  handleLimit = () => {
    this.props.setPopulationFilter(creditsLessThanFromMandatory({
      amount: this.state.limit,
      courses: this.props.courses
    }))
    this.setState({ limit: '' })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, courses } = this.props
    if (courses.length === 0) return null

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.CreditsLessThanFromMandatory}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Show only students with credits less than </label>
              </Form.Field>
              <Form.Field>
                <Input
                  type="number"
                  onChange={this.handleChange}
                  value={this.state.limit}
                />
              </Form.Field>
              <Form.Field>
                <label>from mandatory courses</label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleLimit}
                  disabled={this.state.limit.length === 0}
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
        Credits less than {filter.params.amount} from mandatory courses
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}
const mapStateToProps = ({ populationMandatoryCourses }) => ({
  courses: populationMandatoryCourses.data
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(CreditsLessThanFromMandatory)
