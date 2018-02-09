import React, { Component } from 'react';
import { func } from 'prop-types';
import { connect } from 'react-redux';
import { Search, Segment } from 'semantic-ui-react';

import { addError, findStudentsAction, getStudentAction } from '../../actions';
import SearchResultTable from '../SearchResultTable';
import SegmentDimmer from '../SegmentDimmer';

import sharedStyles from '../../styles/shared';
import styles from './studentSearch.css';

const DEFAULT_STATE = {
  students: [],
  isLoading: false,
  showResults: false,
  searchStr: ''
};

class StudentSearch extends Component {
  static propTypes = {
    dispatchFindStudents: func.isRequired,
    dispatchGetStudent: func.isRequired,
    dispatchAddError: func.isRequired,
    translate: func.isRequired
  }

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

  handleSearchSelect = (e, student) => {
    const { studentNumber } = student;
    const { dispatchGetStudent, dispatchAddError } = this.props;
    this.setState({ isLoading: true });
    dispatchGetStudent(studentNumber)
      .then(
        () => this.resetComponent(),
        err => dispatchAddError(err)
      );
  };

  fetchStudentList = (searchStr) => {
    this.setState({ searchStr, isLoading: true });
    this.props.dispatchFindStudents(searchStr)
      .then(
        json => this.setState({
          students: json.value,
          isLoading: false,
          showResults: true
        }),
        err => this.props.dispatchAddError(err)
      );
  };

  renderSearchResults = () => {
    const { translate } = this.props;
    const { showResults, students } = this.state;

    if (!showResults) {
      return null;
    }

    const headers = [
      translate('common.studentNumber'),
      translate('common.started'),
      translate('common.credits')
    ];
    const rows = students.map(({ studentNumber, started, credits }) =>
      ({ studentNumber, started, credits }));

    return (<SearchResultTable
      headers={headers}
      rows={rows}
      rowClickFn={this.handleSearchSelect}
      noResultText={translate('common.noResults')}
      selectable
    />);
  };

  render() {
    const { isLoading, searchStr } = this.state;
    const { translate } = this.props;

    return (
      <div className={styles.searchContainer}>
        <Search
          className={styles.studentSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={translate('studentStatistics.searchPlaceholder')}
        />
        <Segment className={sharedStyles.contentSegment}>
          <SegmentDimmer translate={translate} isLoading={isLoading} />
          { this.renderSearchResults() }
        </Segment>
      </div>
    );
  }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchFindStudents: searchStr =>
    dispatch(findStudentsAction(searchStr)),
  dispatchGetStudent: studentNumber =>
    dispatch(getStudentAction(studentNumber)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentSearch);
