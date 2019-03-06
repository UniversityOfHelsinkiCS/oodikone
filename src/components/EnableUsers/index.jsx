import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { Button, Icon, Header, Segment, Confirm, Loader, Label } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { getUsers, sendEmail } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard } from '../../common'
import sharedStyles from '../../styles/shared'
import UserPageNew from '../UserPage'
import SortableTable from '../SortableTable'

class EnableUsers extends Component {
  state = {
    confirm: false,
    email: ''
  }

  componentDidMount() {
    this.props.getUsers()
    this.props.getUnits()
  }

  sendMailPopup = user => () => {
    this.setState({ confirm: true, email: user.email })
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
      ? <Loader active />
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
      <div>
        {this.state.confirm ? <Confirm
          style={{
            marginTop: 'auto !important',
            display: 'inline-block !important',
            position: 'relative'
            // top: '20%',
            // left: '33%'
          }}
          open={this.state.confirm}
          cancelButton="no"
          confirmButton="send"
          content="Do you want to notify this person by email about receiving access to oodikone?"
          onCancel={() => { this.setState({ confirm: false }) }}
          onConfirm={() => {
            this.setState({ confirm: false })
            this.props.sendEmail(this.state.email)
          }}
          size="small"
        /> : null}
        <SortableTable
          getRowKey={user => user.id}
          tableProps={{ celled: true, structured: true }}
          columns={[
            {
              key: 'NAME',
              title: 'Name',
              getRowVal: (user) => {
                const nameparts = user.full_name.split(' ')
                return nameparts[nameparts.length - 1]
              },
              getRowContent: user => user.full_name
            }, {
              key: 'USERNAME',
              title: 'Username',
              getRowVal: user => user.username
            }, {
              key: 'ROLE',
              title: 'Role',
              getRowVal: user => (
                <Label.Group>
                  {user.accessgroup.map(ag => ag.group_code).sort().map(code => <Label key={code} content={code} />)}
                </Label.Group>
              )
            }, {
              key: 'STUDYTRACKS',
              title: 'Studytracks',
              getRowVal: (user) => {
                // TODO: language handling
                // const { currentLanguage } = this.props
                const language = 0
                const nameInLanguage = element =>
                  element.name[language]
                    || element.name.fi
                    || element.name.en
                    || element.name.sv

                if (!user.elementdetails || user.elementdetails.length === 0) return null
                if (user.elementdetails.length >= 2) {
                  return `${nameInLanguage(user.elementdetails[0])} +${user.elementdetails.length - 1} others`
                }
                return nameInLanguage(user.elementdetails[0])
              }
            }, {
              key: 'OODIACCESS',
              title: 'Has access',
              getRowVal: user => user.is_enabled,
              getRowContent: user => (
                <Icon
                  style={{ margin: 'auto' }}
                  color={user.is_enabled ? 'green' : 'red'}
                  name={user.is_enabled ? 'check' : 'remove'}
                />
              )
            }, {
              key: 'SENDMAIL',
              title: '',
              getRowVal: user => user.is_enabled,
              getRowContent: user => (
                <Button onClick={this.sendMailPopup(user)} basic fluid size="mini">Send mail</Button>
              ),
              headerProps: { onClick: null, sorted: null }
            }, {
              key: 'EDIT',
              title: '',
              getRowVal: user => (
                <Button.Group compact widths={2}>
                  <Button animated basic size="mini" onClick={this.openEditUserPage(user.id)}>
                    <Button.Content hidden>Edit</Button.Content>
                    <Button.Content visible>
                      <Icon name="wrench" />
                    </Button.Content>
                  </Button>
                </Button.Group>
              ),
              headerProps: { onClick: null, sorted: null }
            }
          ]}
          data={users}
        />
      </div>
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
  getUnits,
  sendEmail
})(EnableUsers))
