import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';

import { addError, findStudentsAction } from '../../actions';

import styles from './studentStatistics.css';

class StudentStatistics extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  componentDidMount() {
    /* TODO: test purpose onlys  */
    const defaultSearch = 'ee';
    this.props.dispatchFindStudents(defaultSearch)
      .then(
        json => this.setState({ students: json }),
        err => this.props.dispatchFindStudents(err)
      );
  }

  render() {
    const t = this.props.translate;
    return (
      <div className={styles.example}>
        <div>{`Students: ${t('common.example')}`}</div>
        {JSON.stringify(this.state.students)}
      </div>
    );
  }
}

const { func } = PropTypes;

StudentStatistics.propTypes = {
  dispatchFindStudents: func.isRequired,
  translate: func.isRequired
};


const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  dispatchFindStudents: searchStr =>
    dispatch(findStudentsAction(searchStr)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentStatistics);

