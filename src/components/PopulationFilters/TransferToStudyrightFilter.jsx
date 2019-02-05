import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Popup, Radio } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { transferTo } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class TransferToStudyrightFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    studyrightName: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    language: string.isRequired
  }

  state = {
    negated: false
  }

  handleRadio = () => {
    this.props.setPopulationFilter(transferTo({ negated: this.state.negated }))
    this.setState({ starting: true })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, studyrightName, language } = this.props
    const toggleLabel = this.state.negated
      ? `have transferred to ${studyrightName[language]}`
      : `have not transfer to ${studyrightName[language]}`

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
                <Radio
                  toggle
                  label={toggleLabel}
                  checked={this.state.starting}
                  onChange={() => this.setState({ negated: !this.state.negated })}
                />
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
          ? `Have transferred to ${studyrightName[language]}`
          : `Have not transferred to ${studyrightName[language]}`}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = (state) => {
  const code = state.populations.query.studyRights[0]
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
