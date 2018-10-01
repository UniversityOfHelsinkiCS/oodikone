import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dropdown, Icon, Form, Segment, Button, Popup } from 'semantic-ui-react'
import { shape, func, arrayOf, string } from 'prop-types'
import infoTooltips from '../../common/infotooltips'
import { canceledStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class CanceledStudyright extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyrights: arrayOf(string).isRequired,
    language: string.isRequired
  }

  state = {
    cancel: 'true'
  }

  options = [{ value: 'false', text: 'haven\'t' }, { value: 'true', text: 'have' }]

  handleChange = (e, { value }) => {
    this.setState({ cancel: value })
  }

  handleCancel = () => {
    this.props.setPopulationFilter(canceledStudyright({
      studyrights: this.props.studyrights,
      cancel: this.state.cancel
    }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter, language } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup content={infoTooltips.PopulationStatistics.Filters.CanceledStudyright[language]} trigger={<Icon style={{ float: 'right' }} name="info" />} />

            <Form.Group inline>
              <Form.Field>
                <label>Filter students that </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  fluid
                  placeholder="have/haven't"
                  name="complemented"
                  onChange={this.handleChange}
                  options={this.options}
                />
              </Form.Field>
              <Form.Field>
                <label> canceled this studyright </label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleCancel}
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
        {filter.params.cancel === 'true' ? 'Showing students that have canceled this studyright' : <span><b>Excluded</b> students whose studyright is cancelled</span>}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}
const mapStateToProps = ({ populations, settings }) => ({
  studyrights: populations.query.studyRights,
  language: settings.language
})


export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(CanceledStudyright)
