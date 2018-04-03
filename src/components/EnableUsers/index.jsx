import React, { Component } from 'react'
import { Button, Dropdown, Grid, List } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, number, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'

import styles from './enableUsers.css'
import { getUsers, enableUser, addUserUnit, removeUserUnit } from '../../redux/users'
import { getUnits } from '../../redux/units'

class EnableUsers extends Component {
  componentDidMount() {
    this.props.getUsers()
    this.props.getUnits()
  }

  enableUser = id => () => this.props.enableUser(id)

  handleChange = user => (e, { value }) => {
    if (!user.units.find(unit => unit.id === value)) {
      this.props.addUserUnit(user.id, value)
    }
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnit(uid, unit)

  renderUnitList = (units, user) => {
    if (!units) return null
    return (
      <List divided verticalAlign="middle">
        {units.map(unit => (
          <List.Item key={unit.id}>
            <List.Content floated="right">
              <Button onClick={this.removeAccess(user, unit.id)}>Remove</Button>
            </List.Content>
            <List.Content>
              {unit.name}
            </List.Content>
          </List.Item>
        ))}

      </List>
    )
  }

  render() {
    const { users, error, units } = this.props
    const unitOptions = units.map(unit => ({ key: unit.id, value: unit.id, text: unit.name }))
    return error ? null : (
      <div styles={styles.container}>
        <h1>Enable or disable access to OodiKone</h1>
        {users.map(u => (
          <Grid key={u.id} divided="vertically">
            <Grid.Row columns={2}>
              <Grid.Column>
                <h3>{u.full_name}, {u.username} - Access to oodikone: {u.is_enabled ? 'En' : 'Dis'}abled</h3>
                <Dropdown
                  placeholder="Select unit"
                  options={unitOptions}
                  onChange={this.handleChange(u)}
                  fluid
                  search
                  selection
                />
              </Grid.Column>
              <Grid.Column>
                <Button onClick={this.enableUser(u.id)}>Enable/Disable</Button>
                {this.renderUnitList(u.units, u.id)}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        ))}
      </div>
    )
  }
}

EnableUsers.propTypes = {
  getUsers: func.isRequired,
  enableUser: func.isRequired,
  addUserUnit: func.isRequired,
  removeUserUnit: func.isRequired,
  getUnits: func.isRequired,
  units: arrayOf(shape({
    id: number,
    name: string
  })).isRequired,
  users: arrayOf(shape({
    id: number,
    full_name: string,
    is_enabled: bool,
    username: string,
    units: arrayOf(shape({
      id: number,
      name: string
    }))
  })).isRequired,
  error: bool.isRequired
}

const mapStateToProps = ({ locale, users, units }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  units: units.data,
  users: users.data,
  pending: users.pending,
  error: users.error || false
})

const mapDispatchToProps = dispatch => ({
  getUsers: () => {
    dispatch(getUsers())
  },
  enableUser: (id) => {
    dispatch(enableUser(id))
  },
  addUserUnit: (uid, unit) => {
    dispatch(addUserUnit(uid, unit))
  },
  removeUserUnit: (uid, unit) => {
    dispatch(removeUserUnit(uid, unit))
  },
  getUnits: () => {
    dispatch(getUnits())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(EnableUsers)
