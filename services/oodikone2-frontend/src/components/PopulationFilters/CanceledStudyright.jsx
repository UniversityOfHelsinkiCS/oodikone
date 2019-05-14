import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dropdown, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func, arrayOf, string } from 'prop-types'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'
import { canceledStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class CanceledStudyright extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyrights: arrayOf(string).isRequired
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
    const { filter } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <InfoBox content={infoTooltips.PopulationStatistics.Filters.CanceledStudyright} />
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
                  selectOnBlur={false}
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
        {filter.params.cancel === 'true' ?
          'Showing students that have canceled this studyright' :
          <span><b>Excluded</b> students whose studyright is cancelled</span>
        }
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ populations }) => ({
  studyrights: populations.query.studyRights
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(CanceledStudyright)
