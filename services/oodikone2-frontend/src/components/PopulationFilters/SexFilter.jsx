import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Radio, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import { getTextIn } from '../../common'

import { sexFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class SexFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }
  
  state = {
    sex: ''
  }

  handleChange = (e, { value }) => {
    this.setState({ sex: value })
  }

  handleSex = () => {
    this.props.setPopulationFilter(sexFilter({ gender: this.state.sex }))
    this.setState({ sex: '' })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, language } = this.props
    const gender_m = { fi: 'Mies', en: 'Male', sv: 'Man' }
    const gender_f = { fi: 'Nainen', en: 'Female', sv: 'Kvinna' }

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Filter by gender</label>
              </Form.Field>
              <Form.Field>
                <Radio name="sex" onChange={this.handleChange} value={1} label={getTextIn(gender_m, language)} checked={this.state.sex === 1} />
                <Radio name="sex" onChange={this.handleChange} value={2} label={getTextIn(gender_f, language)} checked={this.state.sex === 2} />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleSex}
                  disabled={this.state.sex === ''}
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
        {`Showing only students classified as: "${filter.params.gender === 1 ? getTextIn(gender_m, language) : getTextIn(gender_f, language)}"`}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ settings }) => ({
  language: settings.language
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(SexFilter)
