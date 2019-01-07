import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { shape, func, arrayOf, object, string } from 'prop-types'
import _ from 'lodash'
import infoTooltips from '../../common/infotooltips'
import { extentGraduated } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class ExtentGraduated extends Component {
  static propTypes = {
    language: string.isRequired,
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    extents: arrayOf(object).isRequired
  }

  state = {
    extentcode: undefined,
    graduated: undefined,
    complemented: 'false'
  }

  graduationOptions = [
    { value: 'grad', text: 'graduated' },
    { value: 'either', text: 'studying' }
  ] // illegal to pass boolean values as Dropdown options value :(

  complementedOptions = [{ value: 'false', text: 'are' }, { value: 'true', text: 'are not' }]

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }

  handleLimit = () => {
    const { extentcode, graduated, complemented } = this.state
    this.props.setPopulationFilter(extentGraduated({ extentcode, graduated, complemented }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  renderSetText = (extents, filter) => {
    const { language } = this.props
    const { extentcode, graduated, complemented } = filter.params
    let returnText = ''
    if (graduated === 'grad') {
      returnText = ('students that graduated from')
    } else if (graduated === 'either') {
      returnText = ('students that are studying ')
    }
    const extentText = (` ${extents.find(extent => extent.extentcode === extentcode).name[language]} `)

    return complemented === 'true' ?
      <span><b>Excluded</b> {returnText}<b>{extentText}</b></span>
      :
      <span><b>Included</b> {returnText}<b>{extentText}</b></span>
  }

  render() {
    const { filter, extents, language } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.ExtentGraduated}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                Students that
              </Form.Field>
              <Form.Field>
                <Dropdown
                  fluid
                  placeholder="are/not"
                  name="complemented"
                  onChange={this.handleChange}
                  options={this.complementedOptions}
                />
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
                      ({ value: extentcode, text: name[language] })),
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

const mapStateToProps = ({ settings }) => ({ language: settings.language })

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(ExtentGraduated)
