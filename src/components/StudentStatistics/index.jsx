import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';

import StudentSearch from '../StudentSearch';

import styles from './studentStatistics.css';

class StudentStatistics extends Component {
  constructor(props) {
    super(props);

    this.handleSearchSelect = this.handleSearchSelect.bind(this);

    this.state = {
      student: {}
    };
  }

  handleSearchSelect(e, student) {
    this.setState({ student });
    console.log(this.state.student);
  }

  render() {
    return (
      <div className={styles.container}>
        <StudentSearch
          handleResultFn={this.handleSearchSelect}
          translate={this.props.translate}
        />
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

