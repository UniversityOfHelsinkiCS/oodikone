import React, { Component } from 'react'
import { Button, Card, Divider, List, Icon, Popup, Dropdown, Header } from 'semantic-ui-react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { withRouter } from 'react-router-dom'
import { string, number, shape, bool, arrayOf, func, object } from 'prop-types'
import { getTextIn, getRolesWithoutRefreshToken } from '../../common'
import { removeUserUnits, getAccessGroups, setFaculties } from '../../redux/users'
import { getFaculties } from '../../redux/faculties'
import { getDegreesAndProgrammesUnfiltered } from '../../redux/populationDegreesAndProgrammesUnfiltered'
import { login } from '../../redux/auth'
import AccessRights from './AccessRights'
import AccessGroups from './AccessGroups'

const formatToDropdown = (elements, language) => {
  const options = Object.values(elements).map(e => ({
    key: e.code,
    value: e.code,
    description: e.code,
    text: getTextIn(e.name, language)
  }))
  return _.sortBy(options, 'text')
}

class UserPage extends Component {
  state = {
    degree: undefined,
    programme: undefined
  }

  async componentDidMount() {
    const { associations, pending } = this.props
    if (Object.keys(associations).length === 0 && !pending) {
      this.props.getDegreesAndProgrammesUnfiltered()
      await this.props.getAccessGroups()
    }
    await this.props.getFaculties()
  }

  getDisabledUnits = (units, enabled) => {
    const enabledIds = new Set(enabled.map(element => element.code))
    return units.filter(u => !enabledIds.has(u.id))
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnits(uid, [unit])

  degreeOptions = () => {
    const { degrees } = this.props.associations
    const degreeOptions = !degrees ? [] : formatToDropdown(degrees, this.props.language)
    return degreeOptions
  }

  programmeOptions = () => {
    const { degrees, programmes } = this.props.associations
    const { degree: degreeCode } = this.state
    if (!programmes) return []
    if (degrees && degreeCode) {
      const degree = degrees[degreeCode]
      return formatToDropdown(degree.programmes, this.props.language)
    }
    return formatToDropdown(programmes, this.props.language)
  }

  specializationOptions = () => {
    const { studyTracks } = this.props.associations
    const { programme: programmeCode } = this.state
    if (!studyTracks) return []
    if (programmeCode) {
      const filteredStudyTracks = Object.values(studyTracks)
        .filter(s => s.programmes[programmeCode])
        .reduce((acc, e) => {
          acc[e.code] = e
          return acc
        }, {})
      return formatToDropdown(filteredStudyTracks, this.props.language)
    }
    return formatToDropdown(studyTracks, this.props.language)
  }

  allSpecializationIds = () => this.specializationOptions().map(sp => sp.key)

  showAs = async (uid) => {
    this.props.login(false, null, uid)
    this.props.history.push('/')
  }

  renderUnitList = (elementdetails, user) => {
    const { language } = this.props
    const nameInLanguage = element => getTextIn(element.name, language)
    if (!elementdetails) return null
    return (
      <List divided>
        {_.sortBy(elementdetails, 'code').map(element => (
          <List.Item key={element.code}>
            <List.Content floated="right">
              <Button
                basic
                negative
                floated="right"
                onClick={this.removeAccess(user.id, element.code)}
                content="Remove"
                size="tiny"
              />
            </List.Content>
            <List.Content>
              {element.type === 30 ? <Icon name="minus" /> : null} {`${nameInLanguage(element)} (${element.code})`}
            </List.Content>
          </List.Item>
        ))}
      </List>
    )
  }

  render() {
    const { user, language } = this.props
    return this.props.accessGroups ?
      <div>
        <Button icon="arrow circle left" content="Back" onClick={this.props.goBack} />
        <Divider />
        <Card.Group>
          <Card fluid>
            <Card.Content>
              <Card.Header>
                { this.props.isAdmin && user.is_enabled && (
                  <Popup
                    content="Show Oodikone as this user"
                    trigger={<Button floated="right" circular size="tiny" basic icon="spy" onClick={() => this.showAs(user.username)} />}
                  />
                )}
                {user.full_name}
              </Card.Header>
              <Divider />
              <Card.Meta content={user.username} />
              <Card.Meta content={user.email} />
              <Card.Description>
                {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`} <br />
              </Card.Description>
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Add study programme access rights" />
              <Divider />
              <AccessRights uid={user.id} rights={user.elementdetails} />
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Add access group rights" />
              <Divider />
              <AccessGroups user={user} />
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Access rights" />
              <Card.Description>
                {user.accessgroup.map(ag => ag.group_code).includes('admin') ?
                  <p style={{
                    fontSize: '34px',
                    fontFamily: 'Comic Sans',
                    color: 'darkred',
                    border: '1px'
                  }}
                  >Admin access!
                  </p> : null}
                {this.renderUnitList(user.programme, user)}
                <Header content="Faculties" />
                <Dropdown
                  placeholder="Select faculties"
                  fluid
                  multiple
                  search
                  value={this.props.user.faculty.map(f => f.faculty_code)}
                  options={_.sortBy(this.props.faculties.map(f => ({ key: f.code, text: getTextIn(f.name, language), description: f.code, value: f.code })), ['text'])}
                  onChange={(__, { value: facultycodes }) => this.props.setFaculties(user.id, facultycodes)}
                />
              </Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>
      </div >
      :
      null
  }
}

UserPage.propTypes = {
  user: shape({
    id: string,
    full_name: string,
    is_enabled: bool,
    elementdetails: arrayOf(shape({
      code: string,
      name: shape({}),
      type: number
    })),
    programme: arrayOf(shape({
      code: string,
      name: shape({}),
      type: number
    })),
    faculty: arrayOf(shape({
      faculty_code: string,
      programme: arrayOf(shape({
        code: string,
        name: shape({}),
        type: number
      }))
    }))
  }).isRequired,
  removeUserUnits: func.isRequired,
  setFaculties: func.isRequired,
  language: string.isRequired,
  goBack: func.isRequired,
  getDegreesAndProgrammesUnfiltered: func.isRequired,
  associations: shape({}).isRequired,
  pending: bool.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired,
  getAccessGroups: func.isRequired,
  getFaculties: func.isRequired,
  faculties: arrayOf(shape({ code: string, name: shape({}) })).isRequired,
  accessGroups: arrayOf(object).isRequired,
  isAdmin: bool.isRequired,
  login: func.isRequired
}
const mapStateToProps = state => ({
  language: state.settings.language,
  units: state.units.data,
  faculties: state.faculties.data,
  associations: state.populationDegreesAndProgrammesUnfiltered.data,
  pending: !!state.populationDegreesAndProgrammesUnfiltered.pending,
  accessGroups: state.users.accessGroupsData || [],
  isAdmin: getRolesWithoutRefreshToken().includes('admin')
})

export default connect(mapStateToProps, {
  removeUserUnits,
  setFaculties,
  getDegreesAndProgrammesUnfiltered,
  getAccessGroups,
  getFaculties,
  login
})(withRouter(UserPage))
