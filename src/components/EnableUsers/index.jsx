import React, { Component } from 'react'
import { Button, Dropdown, List, Item, Header, Segment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { getUsers, enableUser, addUserUnit, removeUserUnit } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { makeSortUsers } from '../../selectors/users'
import sharedStyles from '../../styles/shared'

class EnableUsers extends Component {
  componentDidMount() {
    this.props.getUsers()
    this.props.getUnits()
  }

  enableUser = id => () => this.props.enableUser(id)

  handleChange = user => (e, { value }) => {
    if (!user.elementdetails.find(element => element.code === value)) {
      this.props.addUserUnit(user.id, value)
    }
  }

  removeAccess = (uid, unit) => () => this.props.removeUserUnit(uid, unit)

  renderUnitList = (elementdetails, user) => {
    if (!elementdetails) return null
    return (
      <List divided>
        {elementdetails.map(element => (
          <List.Item key={element.code}>
            <List.Content floated="right">
              <Button floated="right" onClick={this.removeAccess(user, element.code)} content="Remove" size="tiny" />
            </List.Content>
            <List.Content>{element.name.fi}</List.Content>
          </List.Item>
        ))}
      </List>
    )
  }

  render() {
    const { users, units, error } = this.props
    const unitOptions = units.map(unit => ({ key: unit.id, value: unit.id, text: unit.name }))
    return error ? null : (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Enable or disable access to Oodikone
        </Header>
        <Segment className={sharedStyles.contentSegment}>
          <Item.Group divided>
            {users.map(user => (
              <Item key={user.id}>
                <Item.Content verticalAlign="middle">
                  <Item.Header content={user.full_name} />
                  <Item.Meta content={user.username} />
                  <Item.Description>
                    <Dropdown
                      placeholder="Select unit"
                      options={unitOptions}
                      onChange={this.handleChange(user)}
                      fluid
                      search
                      selection
                    />
                    {this.renderUnitList(user.elementdetails, user.id)}
                  </Item.Description>
                  <Item.Extra>
                    {`Access to oodikone: ${user.is_enabled ? 'En' : 'Dis'}abled`}
                  </Item.Extra>
                  <Item.Extra>
                    <Button content={user.is_enabled ? 'Disable' : 'Enable'} size="tiny" onClick={this.enableUser(user.id)} />
                  </Item.Extra>
                </Item.Content>
              </Item>
            ))}
          </Item.Group>
        </Segment>
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
    id: string,
    name: string
  })).isRequired,
  users: arrayOf(shape({
    id: string,
    full_name: string,
    is_enabled: bool,
    username: string,
    units: arrayOf(shape({
      id: string,
      name: string
    }))
  })).isRequired,
  error: bool.isRequired
}

const sortUsers = makeSortUsers()

const mapStateToProps = ({ locale, users, units }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  units: units.data,
  users: sortUsers(users),
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
