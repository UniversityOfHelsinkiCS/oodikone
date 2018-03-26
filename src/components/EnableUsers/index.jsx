import React, { Component } from 'react'
import { Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, object, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'

import { getUsers, enableUser } from '../../redux/users'

class EnableUsers extends Component {
  static propTypes = {
    getUsers: func.isRequired,
    enableUser: func.isRequired,
    users: arrayOf(object).isRequired,
    error: bool.isRequired
  }

  componentDidMount() {
    this.props.getUsers()
  }

  enableUser = (id) => {
    this.props.enableUser(id)
  }

  render() {
    return this.props.error ? <h1>Error: {this.props.error} </h1> : (
      <div>
        <h1>Enable or disable access to OodiKone</h1>
        {this.props.users ? this.props.users.map(u => (
          <div key={u.id}>
            <h3>{u.full_name}, {u.username} - Access: {u.is_enabled ? 'En' : 'Dis' }abled</h3>
            <Button onClick={() => this.enableUser(u.id)}>Enable/Disable</Button>
          </div>
        )) : <h2>No users could be fetched</h2>
        }
      </div>
    )
  }
}

const mapStateToProps = ({ locale, users }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  users: users.data,
  pending: users.pending,
  error: users.error
})

const mapDispatchToProps = dispatch => ({
  getUsers() {
    dispatch(getUsers())
  },
  enableUser(id) {
    dispatch(enableUser(id))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(EnableUsers)
