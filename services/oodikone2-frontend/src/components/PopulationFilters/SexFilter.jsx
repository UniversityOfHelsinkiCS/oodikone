import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Radio, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'
import { getTextIn } from '../../common'

import { sexFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class SexFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    language: string.isRequired
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
    const genderMale = { fi: 'Mies', en: 'Male', sv: 'Man' }
    const genderFemale = { fi: 'Nainen', en: 'Female', sv: 'Kvinna' }

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Filter by gender</label>
              </Form.Field>
              <Form.Field>
                <Radio name="sex" onChange={this.handleChange} value={1} label={getTextIn(genderMale, language)} checked={this.state.sex === 1} />
                <Radio name="sex" onChange={this.handleChange} value={2} label={getTextIn(genderFemale, language)} checked={this.state.sex === 2} />
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
        {`Showing only students classified as: "${filter.params.gender === 1 ? getTextIn(genderMale, language) : getTextIn(genderFemale, language)}"`}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(SexFilter)
