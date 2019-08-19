import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Form, Button, Divider, Message } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import { getAccessGroups } from '../../redux/accessGroups'
import { modifyAccessGroups } from '../../redux/users'
import { getIdWithoutRefreshToken, setToken } from '../../common'

class AccessGroups extends Component {
  state = {
    selected: this.props.userGroups
  }

  componentDidMount() {
    if (this.props.groups.length === 0) this.props.getAccessGroups()
  }

  componentDidUpdate(prevState) {
    const { savePending, userGroups } = this.props
    const finishedRequest = (!savePending && prevState.savePending)
    if (finishedRequest) {
      this.setState({ selected: userGroups })  // eslint-disable-line
    }
  }

  doRefreshIfNeeded = () => {
    const { id: userid } = this.props.user
    if (userid === getIdWithoutRefreshToken()) {
      setTimeout(() => {
        setToken(null)
        window.location.reload()
      }, 5000)
    }
  }

  submit = () => {
    const { user, groups } = this.props
    const { selected } = this.state
    const rights = groups.reduce(((acc, { value }) => ({ ...acc, [value]: false })), {})
    selected.forEach((value) => {
      rights[value] = true
    })
    this.props.modifyAccessGroups(user.id, rights)
    this.doRefreshIfNeeded()
  }

  render() {
    const { pending, groups, savePending, saveError } = this.props
    return (
      <Form loading={savePending} error={!!saveError}>
        <Message error content="Modifying access rights failed." />
        <Form.Dropdown
          loading={pending}
          name="groups"
          label="Access Groups"
          placeholder="Select access groups"
          fluid
          multiple
          options={groups}
          value={this.state.selected}
          onChange={(_, { value }) => this.setState({ selected: value })}
          clearable
        />
        <Divider />
        <Button
          basic
          fluid
          positive
          content="Save"
          onClick={this.submit}
        />
      </Form>
    )
  }
}

AccessGroups.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string
  }).isRequired,
  getAccessGroups: PropTypes.func.isRequired,
  modifyAccessGroups: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  userGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
  saveError: PropTypes.bool.isRequired,
  savePending: PropTypes.bool.isRequired,
  pending: PropTypes.bool.isRequired
}

const mapStateToProps = ({ accessGroups, users }, { user }) => {
  const { data, pending } = accessGroups
  const { accessgroupError: saveError, accessgroupPending: savePending } = users
  const groups = data.map(group => ({
    key: group.id,
    text: group.group_code,
    value: group.group_code,
    description: group.group_info
  }))
  const userGroups = user.accessgroup.map(({ group_code: code }) => code)
  return {
    groups,
    userGroups,
    pending: !!pending,
    saveError: !!saveError,
    savePending: !!savePending
  }
}

export default connect(mapStateToProps, {
  getAccessGroups,
  modifyAccessGroups
})(AccessGroups)
