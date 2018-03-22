import React, { Component } from 'react';
import { func, string, arrayOf, object } from 'prop-types';
import { connect } from 'react-redux';
import { Search, Segment } from 'semantic-ui-react';

import { findStudents, getStudent, selectStudent } from '../../redux/students';
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
    translate: func.isRequired,
    findStudents: func.isRequired,
    getStudent: func.isRequired,
    selectStudent: func.isRequired,
    studentNumber: string,
    students: arrayOf(object).isRequired
  };
  static defaultProps = {
    studentNumber: undefined
  };

  state = DEFAULT_STATE;

  componentDidMount() {
    const { studentNumber } = this.props;
    if (studentNumber && containsOnlyNumbers(studentNumber)) {
      this.setState({ isLoading: true });
      this.props.getStudent(studentNumber).then(() => this.resetComponent());
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
    const studentObject = this.props.students.find(person =>
      person.studentNumber === studentNumber);
    const fetched = studentObject ? studentObject.fetched : false;
    if (!fetched) {
      this.setState({ isLoading: true });
      this.props.getStudent(studentNumber).then(() => this.resetComponent());
    } else {
      this.props.selectStudent(studentNumber);
      this.resetComponent();
    }
  };

  fetchStudentList = (searchStr) => {
    this.setState({ searchStr, isLoading: true });
    this.props.findStudents(searchStr).then(() => {
      this.setState({ isLoading: false, showResults: true });
    });
  };

  renderSearchResults = () => {
    const { translate, students } = this.props;
    const { showResults } = this.state;

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
          {this.renderSearchResults()}
        </Segment>
      </div>
    );
  }
}

const mapStateToProps = ({ newReducers }) => ({
  students: newReducers.students.data
});

const mapDispatchToProps = dispatch => ({
  findStudents: searchStr =>
    dispatch(findStudents(searchStr)),
  getStudent: studentNumber =>
    dispatch(getStudent(studentNumber)),
  selectStudent: studentNumber =>
    dispatch(selectStudent(studentNumber))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentSearch);
