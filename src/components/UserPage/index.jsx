import React, { Component } from 'react'
import { Button, Card, Divider, Image, Form, Dropdown, List } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { string, number, shape, bool, arrayOf, func } from 'prop-types'
import LanguageChooser from '../LanguageChooser'
import { toggleCzar, addUserUnit, removeUserUnit } from '../../redux/users'

class UserPage extends Component {
    state={
      selected: null
    }

    getDisabledUnits = (units, enabled) => {
      const enabledIds = new Set(enabled.map(element => element.code))
      return units.filter(u => !enabledIds.has(u.id))
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

    handleCoronation = user => async () => {
      await this.props.toggleCzar(user.id)
    }
    removeAccess = (uid, unit) => () => this.props.removeUserUnit(uid, unit)

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

    render() {
      const { user, language, units } = this.props
      const disabled = this.getDisabledUnits(units, user.elementdetails)
      const unitOptions = disabled.map(unit =>
        ({ key: unit.id, value: unit.id, text: unit.name[language] }))
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
  addUserUnit: func.isRequired,
  removeUserUnit: func.isRequired,
  language: string.isRequired,
  units: arrayOf(shape({})).isRequired,
  goBack: func.isRequired
}

const mapStateToProps = state => ({
  language: state.settings.language,
  units: state.units.data
})

export default connect(mapStateToProps, {
  toggleCzar,
  addUserUnit,
  removeUserUnit
})(UserPage)
