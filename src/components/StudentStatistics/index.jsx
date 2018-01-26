import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';
import { Search } from 'semantic-ui-react';

import { addError, findStudentsAction } from '../../actions';

import styles from './studentStatistics.css';
import SearchResultTable from '../SearchResultTable';

const { func } = PropTypes;

const DEFAULT_STATE = {
  students: [],
  isLoading: false,
  searchStr: ''
};

class StudentStatistics extends Component {
  constructor(props) {
    super(props);

    this.resetComponent = this.resetComponent.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.fetchStudentList = this.fetchStudentList.bind(this);

    this.state = DEFAULT_STATE;
  }

  resetComponent() {
    this.setState(DEFAULT_STATE);
  }

  handleResultSelect(e, value) {
    console.log(value);
  }


  handleSearchChange(e, { value }) {
    if (value.length > 0) {
      this.setState({ searchStr: value });
      this.fetchStudentList();
    } else {
      this.resetComponent();
    }
  }

  fetchStudentList() {
    const { searchStr } = this.state;
    this.setState({ isLoading: true });
    this.props.dispatchFindStudents(searchStr)
      .then(
        json => this.setState({ students: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  render() {
    const { isLoading, students, searchStr } = this.state;

    const t = this.props.translate;
    const headers = [
      t('studentStatistics.studentNumber'),
      t('studentStatistics.started'),
      t('studentStatistics.credits')
    ];
    const rows = students.map(({ studentNumber, started, credits }) =>
      ({ studentNumber, started, credits }));
    return (
      <div className={styles.container}>
        <Search
          className={styles.studentSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
        />
        <SearchResultTable
          headers={headers}
          rows={rows}
          rowClickFn={this.handleResultSelect}
        />
        <div>{`Students: ${t('common.example')}`}</div>
        {isLoading}
        {JSON.stringify(students)}
      </div>
    );
  }
}

StudentStatistics.propTypes = {
  dispatchFindStudents: func.isRequired,
  dispatchAddError: func.isRequired,
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

