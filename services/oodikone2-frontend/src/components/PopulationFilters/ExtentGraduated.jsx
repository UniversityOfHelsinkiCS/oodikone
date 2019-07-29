import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { shape, func, arrayOf, object, string } from 'prop-types'
import _ from 'lodash'
import infoTooltips from '../../common/InfoToolTips'
import { extentGraduated } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { getTextIn } from '../../common'

class ExtentGraduated extends Component {
  static propTypes = {
    language: string.isRequired,
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    extents: arrayOf(object).isRequired,
    allStudyRights: arrayOf(object).isRequired
  }

  state = {
    code: undefined,
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
    const { code, graduated, complemented } = this.state
    this.props.setPopulationFilter(extentGraduated({ code, graduated, complemented, isExtent: (typeof code === 'number') }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  renderSetText = (extents, filter, allStudyRights) => {
    const { language } = this.props
    const { code, graduated, complemented, isExtent } = filter.params
    let returnText = ''
    if (graduated === 'grad') {
      returnText = ('students that graduated from')
    } else if (graduated === 'either') {
      returnText = ('students that are studying ')
    }
    const postText = isExtent ? (` ${getTextIn(extents.find(extent => extent.extentcode === code).name, language)} `) : (` ${allStudyRights.find(sr => sr.value === code).text}`)

    return complemented === 'true' ?
      <span><b>Excluded</b> {returnText}<b>{postText}</b></span>
      :
      <span><b>Included</b> {returnText}<b>{postText}</b></span>
  }

  render() {
    const { code, graduated, complemented } = this.state
    const { filter, extents, language, allStudyRights } = this.props

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
                  selectOnBlur={false}
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
                  selectOnBlur={false}
                />
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="code"
                  placeholder="select extent"
                  onChange={this.handleChange}
                  options={_.sortBy(Object.values(extents).map(({
                    extentcode: ecode, name
                  }) => ({
                    value: ecode, text: getTextIn(name, language)
                  })).concat(allStudyRights), entry => entry.text)}
                  selectOnBlur={false}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  disabled={!code || !graduated || !(complemented === 'true' || complemented === 'false')}
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
          {this.renderSetText(extents, filter, allStudyRights)}
        </label>
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ localize }) => ({ language: getActiveLanguage(localize).code })

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(ExtentGraduated)
