import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, number, string } from 'prop-types';
import { Message } from 'semantic-ui-react';

import { removeError } from '../../actions';

class ErrorMessage extends Component {
 static propTypes = {
   code: number.isRequired,
   message: string,
   url: string,
   uuid: string.isRequired,
   translate: func.isRequired,
   dispatchRemoveError: func.isRequired
 };

 static defaultProps = {
   url: '',
   message: ''
 };

  handleDismiss = () => {
    const { uuid, dispatchRemoveError } = this.props;
    dispatchRemoveError(uuid);
  };

  render() {
    const {
      code, message, url, translate
    } = this.props;
    return (
      <Message error onDismiss={this.handleDismiss}>
        <Message.Header>{translate('error.connectionError')}</Message.Header>
        <p>{translate('error.errorInResponseTo')}: {url}</p>
        <code>{code} – {message}</code>
      </Message>);
  }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchRemoveError: uuid =>
    dispatch(removeError(uuid))
});

export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage);
