import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { Radio, Icon, Header, Segment, Loader, Popup } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf, number } from 'prop-types'
import { getUsers } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { getElementDetails } from '../../redux/elementdetails'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard } from '../../common'
import UserPageNew from '../UserPage'
import UserSearchList from './UserSearchList'

class EnableUsers extends Component {
  state = {
    enabledOnly: true
  }

  componentDidMount() {
    if (this.props.elementdetails.length === 0) this.props.getElementDetails()
    if (this.props.units.length === 0) this.props.getUnits()
    if (this.props.users.length === 0) this.props.getUsers()
    document.title = 'Users - Oodikone'
  }

  componentWillUnmount = () => {
    clearTimeout(this.popupTimeout)
  }

  toggleEnabledOnly() {
    if (this.props.enabledOnly) this.props.getUsers()
    const { enabledOnly } = this.state
    this.setState({ enabledOnly: !enabledOnly })
  }

  openUsersPage = () => {
    const { history } = this.props
    history.push('/users')
  }

  copyEmailsToClippoard = () => {
    const clipboardString = this.props.users
      .filter(u => u.is_enabled && u.email)
      .map(u => u.email)
      .join('; ')
    copyToClipboard(clipboardString)
  }

  renderUserPage = userid => {
    const { users } = this.props
    const user = users.find(u => u.id === userid)
    return !user ? <Loader active /> : <UserPageNew userid={userid} user={user} goBack={this.openUsersPage} />
  }

  handlePopupOpen = () => {
    this.setState({ popupOpen: true })
    this.popupTimeout = setTimeout(() => {
      this.setState({ popupOpen: false })
    }, 1500)
  }

  handlePopupClose = () => {
    this.popupTimeout = null
  }

  render() {
    const { match, pending, users, error, elementdetails } = this.props
    const { enabledOnly } = this.state
    const { userid } = match.params
    return (
      <div style={{ marginBottom: '10px' }} className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Oodikone users
        </Header>
        <Radio
          label={`Showing ${enabledOnly ? 'only enabled' : 'all'} users`}
          toggle
          onClick={() => this.toggleEnabledOnly()}
        />
        <Segment loading={pending} className="contentSegment">
          {!userid ? (
            <UserSearchList enabledOnly={enabledOnly} users={users} error={error} elementdetails={elementdetails} />
          ) : (
            this.renderUserPage(userid)
          )}
        </Segment>
        <Popup
          trigger={<Icon link name="envelope" onClick={this.copyEmailsToClippoard} style={{ float: 'right' }} />}
          content="Copied email(s)!"
          on="click"
          onOpen={this.handlePopupOpen}
          onClose={this.handlePopupClose}
          open={this.state.popupOpen}
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
  pending: bool.isRequired,
  getUnits: func.isRequired,
  enabledOnly: bool.isRequired,
  users: arrayOf(
    shape({
      id: string,
      full_name: string,
      is_enabled: bool,
      username: string,
      units: arrayOf(
        shape({
          id: string,
          name: shape({}).isRequired
        })
      )
    })
  ).isRequired,
  error: bool.isRequired,
  units: arrayOf(shape({})).isRequired,
  elementdetails: arrayOf(shape({ code: string, type: number, name: shape({}) })).isRequired,
  getElementDetails: func.isRequired,
  history: shape({}).isRequired
}

const sortUsers = makeSortUsers()

const mapStateToProps = ({ users, units, elementdetails }) => ({
  units: units.data,
  elementdetails: elementdetails.data,
  enabledOnly: users.enabledOnly,
  users: sortUsers(users),
  pending: typeof users.pending === 'boolean' ? users.pending : true,
  error: users.error || false
})

export default withRouter(
  connect(mapStateToProps, {
    getUsers,
    getUnits,
    getElementDetails
  })(EnableUsers)
)
