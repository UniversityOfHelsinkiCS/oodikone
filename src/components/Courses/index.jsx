import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';
import {
  Search,
  Dropdown,
  Header,
  List,
  Button
} from 'semantic-ui-react';
import CourseStatistics from './statistics';

import {
  findCoursesAction,
  findInstancesAction,
  getInstanceStatisticsAction
} from '../../actions';

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
      .then(json => this.setState({ courseList: json.value, isLoading: false }));
  }

  fetchCourseInstances() {
    const courseCode = this.state.selectedCourse.code;
    this.props.dispatchFindCourseInstances(courseCode)
      .then(json => this.setState({ courseInstances: json.value }));
  }

  fetchInstanceStatistics(courseInstance) {
    const { selectedInstances, selectedCourse } = this.state;
    courseInstance.course = selectedCourse;
    this.props.dispatchGetInstanceStatistics(courseInstance.date, courseInstance.code, 12)
      .then((json) => {
        courseInstance.stats = json.value;
        this.setState({
          selectedInstances: [...selectedInstances, courseInstance]
        });
      });
  }

  removeInstance(courseInstance) {
    const { selectedInstances } = this.state;
    this.setState({ selectedInstances: selectedInstances.filter(i => i !== courseInstance) });
  }

  render() {
    const {
      isLoading,
      courseList,
      searchStr,
      courseInstances,
      selectedCourse,
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

    const listInstance = selectedInstances.map(instance => (
      <List.Item>
        <List.Header>
          {instance.course.name} ({instance.code})
          <List.Content floated="right">
            <Button size="mini" value={instance} onClick={() => this.removeInstance(instance)}>remove</Button>
          </List.Content>
        </List.Header>
        {instance.date}
      </List.Item>));

    // const t = this.props.translate;

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
          onChange={(e, data) => this.fetchInstanceStatistics(data.value)}
          placeholder="Select course instance"
          fluid
          selection
          options={instanceList}
        />

        <List divided relaxed>
          {listInstance}
        </List>

        {selectedInstances.map(i => (<CourseStatistics
          courseName={i.course.name}
          instanceDate={i.date}
          stats={i.stats}
        />))}

      </div>
    );
  }
}

Courses.propTypes = {
  dispatchFindCoursesList: func.isRequired,
  dispatchFindCourseInstances: func.isRequired,
  dispatchGetInstanceStatistics: func.isRequired
  // translate: func.isRequired
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
    dispatch(getInstanceStatisticsAction(date, code, months))
});

export default connect(mapStateToProps, mapDispatchToProps)(Courses);
