import React, { Component } from 'react'
import { Button, Card, Divider, Image, Form, List, Icon, Transition } from 'semantic-ui-react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { withRouter } from 'react-router'
import { string, number, shape, bool, arrayOf, func, object } from 'prop-types'
import { textAndDescriptionSearch, getRolesWithoutRefreshToken, getIdWithoutRefreshToken } from '../../common'
import LanguageChooser from '../LanguageChooser'
import { addUserUnits, removeUserUnits, getAccessGroups, modifyAccessGroups } from '../../redux/users'

import { getDegreesAndProgrammesUnfiltered } from '../../redux/populationDegreesAndProgrammesUnfiltered'
import { superLogin } from '../../apiConnection'

const formatToDropdown = (elements) => {
  const options = Object.values(elements).map(e => ({
    key: e.code,
    value: e.code,
    description: e.code,
    text: e.name.fi || e.name.en || e.name.sv
  }))
  return _.sortBy(options, 'text')
}

class UserPage extends Component {
  state = {
    degree: undefined,
    programme: undefined,
    specializations: [],
    groups: this.props.user.accessgroup ? this.props.user.accessgroup.map(ag => ag.id) : [],
    visible: false
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

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  selectAll = () => this.setState({ specializations: this.allSpecializationIds() })

  enableAccessRightToUser = userid => async () => {
    const { degree, programme, specializations, groups } = this.state
    const codes = [degree, programme, ...specializations].filter(e => !!e)
    await this.props.addUserUnits(userid, codes)

    const accessGroups = this.props.accessGroups.reduce((acc, ag) => {
      if (groups.includes(ag.id)) {
        return { ...acc, [ag.group_code]: true }
      }
      return { ...acc, [ag.group_code]: false }
    }, {})

    await this.props.modifyAccessGroups(userid, accessGroups)
    this.setState({
      degree: undefined,
      programme: undefined,
      specializations: [],
      visible: true
    })
    setTimeout(() => {
      if (userid === getIdWithoutRefreshToken()) {
        window.location.reload()
      } else {
        this.setState({ visible: false })
      }
    }, 5000)
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnits(uid, [unit])

  degreeOptions = () => {
    const { degrees } = this.props.associations
    const degreeOptions = !degrees ? [] : formatToDropdown(degrees)
    return degreeOptions
  }

  programmeOptions = () => {
    const { degrees, programmes } = this.props.associations
    const { degree: degreeCode } = this.state
    if (!programmes) return []
    if (degrees && degreeCode) {
      const degree = degrees[degreeCode]
      return formatToDropdown(degree.programmes)
    }
    return formatToDropdown(programmes)
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
      return formatToDropdown(filteredStudyTracks)
    }
    return formatToDropdown(studyTracks)
  }

  allSpecializationIds = () => this.specializationOptions().map(sp => sp.key)

  studyelementOptions = () => ({
    degrees: this.degreeOptions(),
    programmes: this.programmeOptions(),
    specializations: this.specializationOptions()
  })

  accessGroupOptions = accessGroups => (accessGroups ?
    accessGroups.map(ag => ({
      key: ag.id,
      text: ag.group_code,
      value: ag.id,
      description: ag.group_info
    })) : [])

  showAs = async (uid) => {
    await superLogin(uid)
    this.props.history.push('/')
    window.location.reload()
  }

  renderUnitList = (elementdetails, user) => {
    const { language } = this.props

    const nameInLanguage = element =>
      element.name[language]
      || element.name.fi
      || element.name.en
      || element.name.sv

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
    const { user, pending, associations } = this.props
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

    const options = this.studyelementOptions()
    const accessGroupOptions = this.accessGroupOptions(this.props.accessGroups)
    const enabledAccessGroups = this.state.groups
    return this.props.accessGroups ?
      <div>
        <Button icon="arrow circle left" content="Back" onClick={this.props.goBack} />
        <LanguageChooser />
        <Divider />
        <Card.Group>
          <Card fluid>
            <Card.Content>
              <Card.Header>
                {user.full_name}
              </Card.Header>
              <Card.Meta content={user.username} />
              <Card.Meta content={user.email} />
              <Card.Description>
                {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`} <br />
              </Card.Description>
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Enable access" />
              <Card.Description>
                <Form loading={pending}>
                  <Divider />
                  <Form.Dropdown
                    name="groups"
                    label="Access Groups"
                    placeholder="Select access groups"
                    fluid
                    multiple
                    options={accessGroupOptions}
                    defaultValue={enabledAccessGroups}
                    onChange={this.handleChange}
                    clearable
                  />
                  <Form.Dropdown
                    name="degree"
                    label="Degree (optional)"
                    placeholder="Select specialization"
                    options={options.degrees}
                    value={this.state.degree}
                    onChange={this.handleChange}
                    fluid
                    search={textAndDescriptionSearch}
                    selection
                    clearable
                  />
                  <Divider />
                  <Form.Group widths="equal">
                    <Form.Dropdown
                      name="programme"
                      label="Study programme"
                      placeholder="Select unit"
                      options={options.programmes}
                      value={this.state.programme}
                      onChange={this.handleChange}
                      fluid
                      search={textAndDescriptionSearch}
                      selection
                      clearable
                    />
                    <Form.Dropdown
                      label="Specialization"
                      name="specializations"
                      placeholder="Select specialization"
                      options={options.specializations}
                      value={this.state.specializations}
                      onChange={this.handleChange}
                      fluid
                      search={textAndDescriptionSearch}
                      multiple
                      selection
                      clearable
                    />
                    <Button
                      size="small"
                      style={{ marginTop: '18px' }}
                      onClick={() => this.selectAll()}
                    >
                      Select all specializations
                    </Button>
                  </Form.Group>
                  <Button
                    basic
                    fluid
                    positive
                    content="Enable"
                    onClick={this.enableAccessRightToUser(user.id)}
                  />
                  <Transition.Group animation="drop" duration="1000">
                    {this.state.visible && <Image centered size="small" src="https://images.alko.fi/images/cs_srgb,f_auto,t_large/cdn/003002/minttu-peppermint-40.jpg" />}
                  </Transition.Group>
                  {this.props.isAdmin ? <Button
                    basic
                    fluid
                    positive
                    content="Show Oodikone as this user"
                    onClick={() => this.showAs(user.username)}
                  /> : null}
                </Form>
              </Card.Description>
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
                { this.renderUnitList(user.elementdetails, user) }
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
  addUserUnits: func.isRequired,
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
  modifyAccessGroups: func.isRequired,
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
  addUserUnits,
  removeUserUnits,
  getDegreesAndProgrammesUnfiltered,
  getAccessGroups,
  modifyAccessGroups
})(withRouter(UserPage))
