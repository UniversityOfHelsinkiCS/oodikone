import React, { Component } from 'react';
import { func, string } from 'prop-types';
import { connect } from 'react-redux';
import { Search, Segment } from 'semantic-ui-react';

import { findStudentsAction, getStudentAction } from '../../actions';
import { findStudents, getStudent } from '../../redux/students';
import SearchResultTable from '../SearchResultTable';
import SegmentDimmer from '../SegmentDimmer';

import sharedStyles from '../../styles/shared';
import styles from './studentSearch.css';
import { containsOnlyNumbers } from '../../common';

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
    translate: func.isRequired,
    findStudents: func.isRequired,
    getStudent: func.isRequired,
    studentNumber: string
  };
  static defaultProps = {
    studentNumber: undefined
  };

 state = DEFAULT_STATE;

 componentDidMount() {
   const { studentNumber, dispatchGetStudent } = this.props;
   if (studentNumber && containsOnlyNumbers(studentNumber)) {
     this.setState({ isLoading: true });
     this.props.getStudent(studentNumber);
     dispatchGetStudent(studentNumber)
       .then(
         () => this.resetComponent(),
         () => this.resetComponent()
       );
   }
 }

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
    const { dispatchGetStudent } = this.props;
    this.setState({ isLoading: true });
    this.props.getStudent(studentNumber);
    dispatchGetStudent(studentNumber)
      .then(
        () => this.resetComponent(),
        () => this.resetComponent()
      );
  };

  fetchStudentList = (searchStr) => {
    this.setState({ searchStr, isLoading: true });
    this.props.findStudents(searchStr);
    this.props.dispatchFindStudents(searchStr)
      .then(
        json => this.setState({
          students: json.value,
          isLoading: false,
          showResults: true
        }),
        () => this.setState({ isLoading: false })
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
  findStudents: searchStr =>
    dispatch(findStudents(searchStr)),
  getStudent: studentNumber =>
    dispatch(getStudent(studentNumber)),
  dispatchFindStudents: searchStr =>
    dispatch(findStudentsAction(searchStr)),
  dispatchGetStudent: studentNumber =>
    dispatch(getStudentAction(studentNumber))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentSearch);
