import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, number, string } from 'prop-types'
import { Message } from 'semantic-ui-react'

import { removeError } from '../../redux/errors'

class ErrorMessage extends Component {
  static propTypes = {
    code: number.isRequired,
    message: string,
    url: string,
    uuid: string.isRequired,
    translate: func.isRequired,
    removeError: func.isRequired
  }

  static defaultProps = {
    url: '',
    message: ''
  }

  handleDismiss = () => {
    const { uuid } = this.props
    this.props.removeError(uuid)
  }

  render() {
    const {
      code, message, url, translate
    } = this.props
    return (
      <Message error onDismiss={this.handleDismiss}>
        <Message.Header>{translate('error.connectionError')}</Message.Header>
        <p>{translate('error.errorInResponseTo')}: {url}</p>
        <code>{code} – {message}</code>
      </Message>)
  }
}

const mapStateToProps = () => ({})

const mapDispatchToProps = dispatch => ({
  removeError: uuid =>
    dispatch(removeError(uuid))
})

export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage)
