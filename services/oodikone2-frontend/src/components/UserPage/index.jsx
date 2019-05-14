import React, { Component } from 'react'
import { Button, Card, Divider, List, Icon, Popup } from 'semantic-ui-react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { withRouter } from 'react-router'
import { string, number, shape, bool, arrayOf, func, object } from 'prop-types'
import { getTextIn, getRolesWithoutRefreshToken } from '../../common'
import { removeUserUnits, getAccessGroups } from '../../redux/users'
import { getDegreesAndProgrammesUnfiltered } from '../../redux/populationDegreesAndProgrammesUnfiltered'
import { superLogin } from '../../apiConnection'
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
    await superLogin(uid)
    this.props.history.push('/')
    window.location.reload()
  }

  renderUnitList = (elementdetails, user) => {
    const { language } = this.props

    const nameInLanguage = element => getTextIn(element.name, language)

    const byCode = (a, b) => {
      const codeA = a.type === 30 && a.associations ? `${a.associations[0]}${nameInLanguage(a)}` : a.code
      const codeB = b.type === 30 && b.associations ? `${b.associations[0]}${nameInLanguage(b)}` : b.code
      return codeA < codeB ? -1 : 1
    }

    if (!elementdetails) return null

    return (
      <List divided>
        {elementdetails.sort(byCode).map(element => (
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
    const { user, associations } = this.props
    // ugly trick to add associations to study tracks, should be moved to backend
    if (associations.programmes) {
      const programmes = user.elementdetails.filter(e => e.type === 20).map(e => e.code)
      user.elementdetails = user.elementdetails.map((element) => {
        const e = Object.assign(element)
        if (associations && (element.type === 30)) {
          const studyright = associations.studyTracks[element.code]
          if (studyright && studyright.programmes) {
            e.associations = _.intersection(
              programmes,
              Object.keys(studyright.programmes)
            )
          } else {
            e.associations = programmes
          }
        } else {
          e.associations = []
        }
        return e
      })
    }
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
                    trigger={<Button floated="right" circular size="tiny" basic icon="spy" onClick={this.superLogin} />}
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
                  >everything!
                  </p> : null}
                {this.renderUnitList(user.elementdetails, user)}
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
    }))
  }).isRequired,
  removeUserUnits: func.isRequired,
  language: string.isRequired,
  goBack: func.isRequired,
  getDegreesAndProgrammesUnfiltered: func.isRequired,
  associations: shape({}).isRequired,
  pending: bool.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired,
  getAccessGroups: func.isRequired,
  accessGroups: arrayOf(object).isRequired,
  isAdmin: bool.isRequired
}
const mapStateToProps = state => ({
  language: state.settings.language,
  units: state.units.data,
  associations: state.populationDegreesAndProgrammesUnfiltered.data,
  pending: !!state.populationDegreesAndProgrammesUnfiltered.pending,
  accessGroups: state.users.accessGroupsData || [],
  isAdmin: getRolesWithoutRefreshToken().includes('admin')
})

export default connect(mapStateToProps, {
  removeUserUnits,
  getDegreesAndProgrammesUnfiltered,
  getAccessGroups
})(withRouter(UserPage))
