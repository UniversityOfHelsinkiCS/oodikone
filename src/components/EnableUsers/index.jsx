import React, { Component } from 'react'
import { withRouter, Redirect } from 'react-router-dom'
import { Button, Icon, List, Card, Header, Segment, Dropdown, Form, Divider, Image } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import LanguageChooser from '../LanguageChooser'
import { getUsers, enableUser, addUserUnit, removeUserUnit, toggleCzar } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard } from '../../common'
import sharedStyles from '../../styles/shared'

class EnableUsers extends Component {
  state = {
    selected: null
  }

  componentDidMount() {
    this.props.getUsers()
    this.props.getUnits()
  }

  getDisabledUnits = (units, enabled) => {
    const enabledIds = new Set(enabled.map(element => element.code))
    return units.filter(u => !enabledIds.has(u.id))
  }

  enableUser = id => () => this.props.enableUser(id)

  handleCoronation = user => async () => {
    await this.props.toggleCzar(user.id)
  }

  handleChange = user => (e, { value }) => {
    if (!user.elementdetails.find(element => element.code === value)) {
      this.setState({
        selected: value
      })
    }
  }

  enableAccessRightToUser = userid => async () => {
    const unit = this.state.selected
    await this.props.addUserUnit(userid, unit)
    this.setState({
      selected: null
    })
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnit(uid, unit)

  openEditUserPage = userid => () => {
    const { history } = this.props
    history.push(`users/${userid}`)
  }

  openUsersPage = () => {
    const { history } = this.props
    history.push('/users')
  }

  copyEmailsToClippoard = () => {
    const clipboardString = this.props.users
      .filter(u => u.is_enabled && u.email)
      .map(u => u.email).join('; ')
    copyToClipboard(clipboardString)
  }

  renderUnitList = (elementdetails, user) => {
    const { language } = this.props
    if (!elementdetails) return null
    return (
      <List divided>
        {elementdetails.map(element => (
          <List.Item key={element.code}>
            <List.Content floated="right">
              <Button basic negative floated="right" onClick={this.removeAccess(user.id, element.code)} content="Remove" size="tiny" />
            </List.Content>
            <List.Content>{element.name[language]}</List.Content>
          </List.Item>
        ))}
      </List>
    )
  }

  renderUserPage = (userid) => {
    const { units, users, language, pending } = this.props
    if (pending) {
      return null
    }
    const user = users.find(u => u.id === userid)
    if (!user) {
      return (
        <Redirect to="/users" />
      )
    }
    const disabled = this.getDisabledUnits(units, user.elementdetails)
    const unitOptions = disabled.map(unit =>
      ({ key: unit.id, value: unit.id, text: unit.name[language] }))
    return (
      <div>
        <Button icon="arrow circle left" content="Back" onClick={this.openUsersPage} />
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
                <Form>
                  <Form.Field>
                    <Dropdown
                      placeholder="Select unit"
                      options={unitOptions}
                      onChange={this.handleChange(user)}
                      fluid
                      search
                      selection
                      value={this.state.selected}
                    />
                  </Form.Field>
                  <Button
                    basic
                    fluid
                    positive
                    content="Enable"
                    onClick={this.enableAccessRightToUser(user.id)}
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

  renderUserSearchList = () => {
    const { users, error } = this.props
    return error ? null : (
      <Card.Group itemsPerRow={4}>
        {users.map(user => (
          <Card raised key={user.id} color={user.is_enabled ? 'green' : 'red'}>
            <Card.Content>
              <Card.Header content={user.full_name} />
              <Card.Meta content={user.username} />
              <Card.Meta content={user.email} />
              <Card.Description>
                {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`}
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <Button.Group compact widths={8}>
                <Button animated basic size="mini" disabled={!user.is_enabled} onClick={this.openEditUserPage(user.id)}>
                  <Button.Content hidden>Edit</Button.Content>
                  <Button.Content visible>
                    <Icon name="wrench" />
                  </Button.Content>
                </Button>
                <Button animated basic onClick={this.enableUser(user.id)} size="mini">
                  <Button.Content hidden>{user.is_enabled ? 'Disable' : 'Enable'}</Button.Content>
                  <Button.Content visible>
                    <Icon color={user.is_enabled ? 'green' : 'red'} name={user.is_enabled ? 'check' : 'remove'} />
                  </Button.Content>
                </Button>
              </Button.Group>
            </Card.Content>
          </Card>
        ))}
      </Card.Group>
    )
  }

  render() {
    const { match } = this.props
    const { userid } = match.params
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Enable or disable access to Oodikone
        </Header>
        <Segment className={sharedStyles.contentSegment}>
          {!userid ? this.renderUserSearchList() : this.renderUserPage(userid)}
        </Segment>
        <Icon
          link
          name="envelope"
          onClick={this.copyEmailsToClippoard}
          style={{ float: 'right' }}
        />
      </div>
    )
  }
}

EnableUsers.propTypes = {
  match: shape({
    params: shape({
      studentNumber: string
    })
  }).isRequired,
  language: string.isRequired,
  getUsers: func.isRequired,
  enableUser: func.isRequired,
  addUserUnit: func.isRequired,
  removeUserUnit: func.isRequired,
  getUnits: func.isRequired,
  toggleCzar: func.isRequired,
  units: arrayOf(shape({
    id: string,
    name: shape({}).isRequired
  })).isRequired,
  users: arrayOf(shape({
    id: string,
    full_name: string,
    is_enabled: bool,
    username: string,
    units: arrayOf(shape({
      id: string,
      name: shape({}).isRequired
    }))
  })).isRequired,
  error: bool.isRequired,
  history: shape({}).isRequired,
  pending: bool.isRequired
}

const sortUsers = makeSortUsers()

const mapStateToProps = ({ locale, users, units, settings }) => ({
  language: settings.language,
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  units: units.data,
  users: sortUsers(users),
  pending: (typeof (users.pending) === 'boolean') ? users.pending : true,
  error: users.error || false
})

export default withRouter(connect(mapStateToProps, {
  getUsers, enableUser, addUserUnit, removeUserUnit, getUnits, toggleCzar
})(EnableUsers))
