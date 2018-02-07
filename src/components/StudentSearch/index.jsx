import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Search } from 'semantic-ui-react';

import { addError, findStudentsAction } from '../../actions';
import SearchResultTable from '../SearchResultTable';

import styles from './studentSearch.css';

const { func } = PropTypes;

const DEFAULT_STATE = {
  students: [],
  isLoading: false,
  searchStr: '',
  selectedStudent: {}
};

class StudentSearch extends Component {
 state = DEFAULT_STATE;

  resetComponent = () => {
    this.setState(DEFAULT_STATE);
  };

  handleSearchChange = (e, { value }) => {
    if (value.length > 0) {
      this.fetchStudentList(value);
    } else {
      this.resetComponent();
    }
  };

  fetchStudentList = (searchStr) => {
    this.setState({ searchStr, isLoading: true });
    this.props.dispatchFindStudents(searchStr)
      .then(
        json => this.setState({ students: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  };

  render() {
    const { isLoading, students, searchStr } = this.state;

    const t = this.props.translate;
    const headers = [
      t('common.studentNumber'),
      t('common.started'),
      t('common.credits')
    ];
    const rows = students.map(({ studentNumber, started, credits }) =>
      ({ studentNumber, started, credits }));
    return (
      <div className={styles.searchContainer}>
        <Search
          className={styles.studentSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={t('studentStatistics.searchPlaceholder')}
        />
        <SearchResultTable
          headers={headers}
          rows={rows}
          rowClickFn={this.props.handleResultFn}
          noResultText={t('common.noResults')}
          selectable
        />
      </div>
    );
  }
}

StudentSearch.propTypes = {
  dispatchFindStudents: func.isRequired,
  dispatchAddError: func.isRequired,
  handleResultFn: func.isRequired,
  translate: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchFindStudents: searchStr =>
    dispatch(findStudentsAction(searchStr)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentSearch);
