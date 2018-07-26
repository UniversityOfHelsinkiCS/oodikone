import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown } from 'semantic-ui-react'
import { shape, func, arrayOf, object } from 'prop-types'
import _ from 'lodash'
import { extentGraduated } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class ExtentGraduated extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    extents: arrayOf(object).isRequired
  }
  state = {
    extentcode: undefined,
    graduated: undefined
  }
  graduationOptions = [{ value: 'notgrad', text: 'not graduated' }, { value: 'grad', text: 'graduated' }, { value: 'either', text: 'studying' }] // illegal to pass boolean values as Dropdown options value :(

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }
  handleLimit = () => {
    const { extentcode, graduated } = this.state
    this.props.setPopulationFilter(extentGraduated({ extentcode, graduated }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }
  renderSetText = (extents, filter) => {
    const { extentcode, graduated } = filter.params

    let returnText = `Studying ${extents.find(extent => extent.extentcode === extentcode).name.fi} `
    if (graduated === 'grad') {
      returnText = returnText.concat(' and graduated')
    } else {
      returnText = returnText.concat(' but not graduated ')
    }
    return returnText
  }

  render() {
    const { filter, extents } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                Students that are
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="graduated"
                  placeholder="select graduation"
                  onChange={this.handleChange}
                  options={this.graduationOptions}
                />
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="extentcode"
                  placeholder="select extent"
                  onChange={this.handleChange}
                  options={_.sortBy(
                    Object.values(extents).map(({
                      extentcode, name
                    }) =>
                      ({ value: extentcode, text: name.fi })),
                    entry => entry.text
                  )}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleLimit}
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
        <label>
          {this.renderSetText(extents, filter)}
        </label>
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { setPopulationFilter, removePopulationFilter }
)(ExtentGraduated)
