import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Popup, Dropdown } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { transferTo } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { getTextIn } from '../../common'

class TransferToStudyrightFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    studyrightName: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    language: string.isRequired
  }

  state = {
    negated: 'false'
  }

  options = [{ value: 'false', text: 'have not' }, { value: 'true', text: 'have' }]

  handleRadio = () => {
    this.props.setPopulationFilter(transferTo({ negated: this.state.negated === 'true' }))
  }

  handleChange = (e, { value }) => {
    this.setState({ negated: value })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, studyrightName, language } = this.props
    const toggleLabel = `transferred to ${getTextIn(studyrightName, language)}`

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.StartingThisSemester}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Show only students that</label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  fluid
                  placeholder="have/have not"
                  name="complemented"
                  onChange={this.handleChange}
                  options={this.options}
                  selectOnBlur={false}
                />
              </Form.Field>
              <Form.Field>
                <label>{toggleLabel}</label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleRadio}
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
        {filter.params.negated
          ? `Have transferred to ${getTextIn(studyrightName, language)}`
          : `Have not transferred to ${getTextIn(studyrightName, language)}`}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = (state) => {
  const code = state.populations.query.studyRights.programme
  const studyrightName = state.populationDegreesAndProgrammes.data.programmes[code].name
  return ({
    language: state.settings.language,
    studyrightName
  })
}

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(TransferToStudyrightFilter)
