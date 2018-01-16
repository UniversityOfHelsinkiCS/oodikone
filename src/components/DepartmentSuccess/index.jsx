import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { addError, getDepartmentSuccessAction } from '../../actions';

class DepartmentSuccess extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    /* TODO: create selector for date and change the YYYY.MM.D notation to something sensible */
    const defaultDateString = '2005.08.1';
    this.props.dispatchGetDepartmentSuccess(defaultDateString)
      .then(
        json => this.setState({ departmentSuccess: json }),
        err => this.props.dispatchAddError(err)
      );
  }

  render() {
    return (
      <div>{this.state.departmentSuccess || '---'}</div>
    );
  }
}

const { func } = PropTypes;
DepartmentSuccess.propTypes = {
  dispatchGetDepartmentSuccess: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchGetDepartmentSuccess: date =>
    dispatch(getDepartmentSuccessAction(date)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentSuccess);
