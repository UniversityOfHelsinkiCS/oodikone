import React, { Component } from 'react'
import { Button, Card, Divider, Image, Form, List, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { withRouter } from 'react-router'
import { string, number, shape, bool, arrayOf, func } from 'prop-types'
import { textAndDescriptionSearch } from '../../common'
import LanguageChooser from '../LanguageChooser'
import { toggleCzar, addUserUnits, removeUserUnit } from '../../redux/users'
import { setAsUser } from '../../redux/settings'
import { getStudyrightElements } from '../../redux/studyrightElements'
import { superLogin } from '../../apiConnection'

const formatToDropdown = elements => Object.values(elements).map(e => ({
  associations: {
    20: e.associations[20] ? Object.keys(e.associations[20]) : []
  },
  key: e.code,
  value: e.code,
  description: e.code,
  text: e.name.fi || e.name.en || e.name.sv
}))

class UserPage extends Component {
  state = {
    degree: undefined,
    programme: undefined,
    specializations: []
  }

  componentDidMount() {
    const { studyrightElements } = this.props
    if (Object.keys(studyrightElements).length === 0) {
      this.props.getStudyrightElements()
    }
  }

  getDisabledUnits = (units, enabled) => {
    const enabledIds = new Set(enabled.map(element => element.code))
    return units.filter(u => !enabledIds.has(u.id))
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  selectAll = () => this.setState({ specializations: this.allSpecializationIds() })

  enableAccessRightToUser = userid => async () => {
    const { degree, programme, specializations } = this.state
    const codes = [degree, programme, ...specializations].filter(e => !!e)
    await this.props.addUserUnits(userid, codes)
    this.setState({
      degree: undefined,
      programme: undefined,
      specializations: []
    })
  }

  handleCoronation = user => async () => {
    await this.props.toggleCzar(user.id)
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnit(uid, unit)

  degreeOptions = () => {
    const { 10: deg } = this.props.studyrightElements
    const degrees = !deg ? [] : formatToDropdown(deg)
    return degrees
  }

  programmeOptions = () => {
    const { 10: deg, 20: prog } = this.props.studyrightElements
    const { degree } = this.state
    const all = !prog ? [] : formatToDropdown(prog)
    if (deg && degree) {
      const data = deg[degree]
      const assocs = data.associations[20] || {}
      const filtered = all.filter(({ key }) => !!assocs[key])
      return filtered
    }
    return all
  }

  specializationOptions = () => {
    const { 20: prog, 30: specs } = this.props.studyrightElements
    const { programme } = this.state
    const all = !specs ? [] : formatToDropdown(specs)
    if (prog && programme) {
      const data = prog[programme]
      const assocs = data.associations[30] || {}
      const filtered = all.filter(({ key }) => !!assocs[key])
      return filtered
    }
    return all
  }

  allSpecializationIds = () => this.specializationOptions().map(sp => sp.key)

  studyelementOptions = () => ({
    degrees: this.degreeOptions(),
    programmes: this.programmeOptions(),
    specializations: this.specializationOptions()
  })

  showAs = async (uid) => {
    await superLogin(uid)
    this.props.setAsUser(uid)
    this.props.history.push('/')
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
              <Button basic negative floated="right" onClick={this.removeAccess(user.id, element.code)} content="Remove" size="tiny" />
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
    const { user, pending, studyrightElements } = this.props
    // ugly trick to add associations to study tracks, should be moved to backend
    if (studyrightElements[30]) {
      const programmes = user.elementdetails.filter(e => e.type === 20).map(e => e.code)
      user.elementdetails = user.elementdetails.map((element) => {
        const e = Object.assign(element)
        if (studyrightElements && (element.type === 30)) {
          const studyright = studyrightElements[30][element.code]
          if (studyright && studyright.associations && studyright.associations[20]) {
            e.associations = _.intersection(
              programmes,
              Object.keys(studyright.associations[20])
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
    return (
      <div>
        <Button icon="arrow circle left" content="Back" onClick={this.props.goBack} />
        <LanguageChooser />
        <Divider />
        <Card.Group>
          <Card fluid>
            <Card.Content>
              <Card.Header>
                <Image onClick={this.handleCoronation(user)} src={user.czar ? 'https://i.pinimg.com/originals/06/7a/20/067a20e4ae1edcee790601ce9b9927df.jpg' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6uJPJLxePjb5u1omdG2kOLfE0BwNjvvJ9accK922xSVwKlR8_'} avatar />
                {user.full_name}
              </Card.Header>
              <Card.Meta content={user.czar ? `tsaari ${user.username}` : `${user.username}`} />
              <Card.Meta content={user.email} />
              <Card.Description>
                {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`} <br />
              </Card.Description>
              <Divider />
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Enable access" />
              <Card.Description>
                <Form loading={pending}>
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
                  />
                  <Divider />
                  <Form.Group widths="equal">
                    <Form.Dropdown
                      name="programme"
                      label="Study programme"
                      placeholder="Select unit"
                      options={options.programmes}
                      value={this.state.programmes}
                      onChange={this.handleChange}
                      fluid
                      search={textAndDescriptionSearch}
                      selection
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
                    />
                    <Button size="small" style={{ marginTop: '18px' }} onClick={() => this.selectAll()}>Select all specializations</Button>
                  </Form.Group>
                  <Button
                    basic
                    fluid
                    positive
                    content="Enable"
                    onClick={this.enableAccessRightToUser(user.id)}
                  />
                  <Button
                    basic
                    fluid
                    positive
                    content="Show Oodikone as this user"
                    onClick={() => this.showAs(user.username)}
                  />
                </Form>
              </Card.Description>
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Access rights" />
              <Card.Description>
                {user.czar ?
                  <p style={{
                    fontSize: '34px',
                    fontFamily: 'Comic Sans',
                    color: 'darkred',
                    border: '1px'
                  }}
                  >everything!
                  </p> : this.renderUnitList(user.elementdetails, user)}
              </Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>
      </div >
    )
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
  toggleCzar: func.isRequired,
  setAsUser: func.isRequired,
  addUserUnits: func.isRequired,
  removeUserUnit: func.isRequired,
  language: string.isRequired,
  goBack: func.isRequired,
  getStudyrightElements: func.isRequired,
  studyrightElements: shape({}).isRequired,
  pending: bool.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired
}

const mapStateToProps = state => ({
  language: state.settings.language,
  units: state.units.data,
  studyrightElements: state.studyrightElements.data,
  pending: state.studyrightElements.pending
})

export default connect(mapStateToProps, {
  toggleCzar,
  addUserUnits,
  removeUserUnit,
  getStudyrightElements,
  setAsUser
})(withRouter(UserPage))
