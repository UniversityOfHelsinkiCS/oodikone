import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';

import StudentSearch from '../StudentSearch';
import StudentDetails from '../StudentDetails';

import styles from './studentStatistics.css';


class StudentStatistics extends Component {
  constructor(props) {
    super(props);

    this.handleSearchSelect = this.handleSearchSelect.bind(this);
    this.partialRender = this.partialRender.bind(this);
    this.state = {
      student: null
    };
  }

  handleSearchSelect(e, student) {
    this.setState({ student });
  }

  partialRender() {
    const { student } = this.state;
    const t = this.props.translate;
    if (student) {
      return (
        <StudentDetails studentNumber={student.studentNumber} translate={t} />
      );
    }

    return (
      <StudentSearch
        handleResultFn={this.handleSearchSelect}
        translate={t}
      />);
  }

  render() {
    return (
      <div className={styles.container}>
        {this.partialRender()}
      </div>
    );
  }
}

const { func } = PropTypes;

StudentStatistics.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

export default connect(mapStateToProps)(StudentStatistics);

