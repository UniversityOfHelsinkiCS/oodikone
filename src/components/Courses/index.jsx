import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';
import { Search,
  Dropdown,
  Header,
  List,
  Button } from 'semantic-ui-react';
import CourseStatistics from './statistics';

import { addError,
  findCoursesAction,
  findInstancesAction,
  getInstanceStatisticsAction } from '../../actions';

import styles from './courses.css';

const { func, string } = PropTypes;

const CourseListRenderer = ({ name, code }) => <span>{`${name} ( ${code} )`}</span>;

CourseListRenderer.propTypes = {
  name: string.isRequired,
  code: string.isRequired
};

class Courses extends Component {
  constructor(props) {
    super(props);

    this.resetComponent = this.resetComponent.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.fetchCoursesList = this.fetchCoursesList.bind(this);
    this.fetchCourseInstances = this.fetchCourseInstances.bind(this);
    this.fetchInstanceStatistics = this.fetchInstanceStatistics.bind(this);
    this.removeInstance = this.removeInstance.bind(this);

    this.state = { selectedCourse: { name: 'No course', code: 'No code' }, selectedInstances: [] };
  }

  componentDidMount() {
    this.resetComponent();
  }

  resetComponent() {
    this.setState({
      courseList: [],
      isLoading: false,
      searchStr: '',
      selectedInstances: [],
      selectedCourse: { name: 'No course', code: 'No code' }
    });
  }

  handleResultSelect(e, { result }) {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseInstances();
    });
  }


  handleSearchChange(e, { value }) {
    this.setState({ searchStr: value });
    this.fetchCoursesList();
  }

  fetchCoursesList() {
    const { searchStr } = this.state;
    this.setState({ isLoading: true });
    this.props.dispatchFindCoursesList(searchStr)
      .then(
        json => this.setState({ courseList: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  fetchCourseInstances() {
    const courseCode = this.state.selectedCourse.code;
    this.props.dispatchFindCourseInstances(courseCode)
      .then(
        json => this.setState({ courseInstances: json.value }),
        err => this.props.dispatchAddError(err)
      );
  }

  // get selected instance id when selected from dropdown
  fetchInstanceStatistics(e, { value }) {
    this.state.selectedInstances.push(value);
    value.course = this.state.selectedCourse;
    this.props.dispatchGetInstanceStatistics(value.date, value.code, 12)
      .then(
        json => this.setState({ instanceStats: json.value }),
        err => this.props.dispatchAddError(err)
      );
  }

  removeInstance(e, { value }) {
    this.setState({ selectedInstances: this.state.selectedInstances.filter(i => i !== value) });
    console.log(value);
  }

  render() {
    const {
      isLoading,
      courseList,
      searchStr,
      courseInstances,
      selectedCourse,
      instanceStats,
      selectedInstances
    } = this.state;
    const instanceList = [];
    if (courseInstances !== undefined) {
      courseInstances.forEach(i => instanceList.push({
        key: i.id,
        text: `${i.date} (${i.students} students)`,
        value: {
          id: i.id, date: i.date, code: selectedCourse.code
        }
      }));
    }
    const myList = selectedInstances.map(i => (
      <List.Item>
        <List.Header>
          {i.course.name}
          <List.Content floated="right">
            <Button size="tiny" value={i} onClick={this.removeInstance}>remove</Button>
          </List.Content>
        </List.Header>
        some stuff
      </List.Item>));
    const t = this.props.translate;
    return (
      <div>
        <Search
          className={styles.courseSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onResultSelect={this.handleResultSelect}
          onSearchChange={this.handleSearchChange}
          results={courseList}
          resultRenderer={CourseListRenderer}
          value={searchStr}
        />

        <Header as="h2">
          {selectedCourse.name}
        </Header>

        <Dropdown
          className={styles.courseSearch}
          onChange={this.fetchInstanceStatistics}
          placeholder="Select course instance"
          fluid selection options={instanceList}
        />
        <List divided relaxed>
          {myList}
        </List>
        {selectedInstances.map(i => (<CourseStatistics
          selectedCourse={i.course}
          stats={instanceStats}
        />))}

      </div>
    );
  }
}

Courses.propTypes = {
  dispatchFindCoursesList: func.isRequired,
  dispatchFindCourseInstances: func.isRequired,
  dispatchGetInstanceStatistics: func.isRequired,
  dispatchAddError: func.isRequired,
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  dispatchFindCoursesList: queryStr =>
    dispatch(findCoursesAction(queryStr)),

  dispatchFindCourseInstances: queryStr =>
    dispatch(findInstancesAction(queryStr)),

  dispatchGetInstanceStatistics: (date, code, months) =>
    dispatch(getInstanceStatisticsAction(date, code, months)),

  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(Courses);
