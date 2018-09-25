import React, { Component } from 'react'
import { withRouter, Redirect } from 'react-router-dom'
import { Button, Icon, Card, Header, Segment, Confirm } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { getUsers, enableUser, addUserUnit, removeUserUnit, sendEmail } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard } from '../../common'
import sharedStyles from '../../styles/shared'
import UserPageNew from '../UserPage'

class EnableUsers extends Component {
  state = {
    confirm: false,
    email: ''
  }

  componentDidMount() {
    this.props.getUsers()
    this.props.getUnits()
  }

  enableUser = user => () => {
    if (!user.is_enabled) {
      this.setState({ confirm: true, email: user.email })
    }
    this.props.enableUser(user.id)
  }

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

  renderUserPage = (userid) => {
    const { users } = this.props
    const user = users.find(u => u.id === userid)
    return !user
      ? <Redirect to="/users" />
      : (
        <UserPageNew
          userid={userid}
          user={user}
          goBack={this.openUsersPage}
        />
      )
  }

  renderUserSearchList = () => {
    const { users, error } = this.props
    return error ? null : (
      <Card.Group itemsPerRow={4}>
        {this.state.confirm ? <Confirm
          style={{
            marginTop: 'auto !important',
            display: 'inline-block !important',
            position: 'relative',
            top: '20%',
            left: '33%'
          }}
          open={this.state.confirm}
          cancelButton="no"
          confirmButton="send"
          content="Do you want to notify this person by email?"
          onCancel={() => { this.setState({ confirm: false }) }}
          onConfirm={() => {
            this.setState({ confirm: false })
            this.props.sendEmail(this.state.email)
          }}
          size="small"
        /> : null}
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
                <Button animated basic onClick={this.enableUser(user)} size="mini">
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
  getUsers: func.isRequired,
  enableUser: func.isRequired,
  getUnits: func.isRequired,
  sendEmail: func.isRequired,
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
  history: shape({}).isRequired
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
  getUsers,
  enableUser,
  addUserUnit,
  removeUserUnit,
  getUnits,
  sendEmail
})(EnableUsers))
