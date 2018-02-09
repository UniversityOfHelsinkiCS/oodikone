import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, arrayOf, object } from 'prop-types';
import { Checkbox, Form, Button, Message, Label, Icon } from 'semantic-ui-react';
import { getTranslate } from 'react-localize-redux';
import uuidv4 from 'uuid/v4';
import Datetime from 'react-datetime';
import { isEqual } from 'lodash';

import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT } from '../../constants';
import { dateFromApiToDisplay, reformatDate } from '../../common';
import { addError, getPopulationStatisticsAction, clearPopulationsAction } from '../../actions';

import styles from './populationSearchForm.css';

const HARDCODE_STUDY_RIGHTS = [
  'Bachelor of Science, Mathematics',
  'Bachelor of Science, Computer Science',
  'Master of Science (science), Computer Science'
];

const HARDCODE_DATE = '2010.01.01';

const INITIAL_QUERY = {
  enrollmentDates: [HARDCODE_DATE],
  studyRights: [],
  courses: [],
  tags: [],
  studentNumbers: [],
  excludedTags: [],
  excludedStudentNumbers: [],
  excludeStudentsThatHaveNotStartedStudies: false,
  excludeStudentsWithPreviousStudies: false,
  excludeStudentsWithZeroCredits: false,
  monthsToStudy: '',
  sex: '',
  matriculationExamination: ''
};


class PopulationSearchForm extends Component {
  static propTypes = {
    translate: func.isRequired,
    dispatchGetPopulationStatistics: func.isRequired,
    dispatchClearPopulations: func.isRequired,
    dispatchAddError: func.isRequired,
    queries: arrayOf(object).isRequired
  };

  state = {
    query: INITIAL_QUERY,
    isLoading: false,
    isCalendarOpen: true
  };

  validateDates = () => {
    const { enrollmentDates } = this.state.query;
    return enrollmentDates.length > 0;
  };

  validateQuery = () => {
    const { queries } = this.props;
    const { query } = this.state;
    return queries.some(q => isEqual(q, query));
  };

  handleStudyRightChange = (e, data) => {
    const { checked, value } = data;
    const { query } = this.state;
    let { studyRights } = query;

    if (checked) {
      studyRights = studyRights.concat(value);
    } else if (!checked) {
      studyRights = studyRights.filter(right => right !== value);
    }
    studyRights.sort();
    this.setState({
      query: {
        ...query,
        studyRights
      }
    });
  };

  clearPopulations = () => {
    const { dispatchClearPopulations } = this.props;
    dispatchClearPopulations();
  };

  fetchPopulation = () => {
    const { query } = this.state;
    const {
      dispatchGetPopulationStatistics,
      dispatchAddError
    } = this.props;

    query.uuid = uuidv4();

    this.setState({ isLoading: true });
    dispatchGetPopulationStatistics(query)
      .then(
        () => this.setState({ isLoading: false }),
        err => dispatchAddError(err)
      );
  };

  removeDate = (date) => {
    const { query } = this.state;
    let { enrollmentDates } = query;
    enrollmentDates = enrollmentDates.filter(d => d !== date);
    enrollmentDates.sort();
    this.setState({
      query: {
        ...query,
        enrollmentDates
      }
    });
  };

  addDate = (date) => {
    const { query } = this.state;
    let { enrollmentDates } = query;
    const formattedDate = reformatDate(date, API_DATE_FORMAT);
    enrollmentDates = enrollmentDates.concat(formattedDate);

    enrollmentDates.sort();
    this.setState({
      query: {
        ...query,
        enrollmentDates
      }
    });
  };

  isValidDate = (date) => {
    const { enrollmentDates } = this.state.query;
    return !enrollmentDates.includes(reformatDate(date, API_DATE_FORMAT));
  };

  renderEnrollmentDateSelector = () => {
    const { translate } = this.props;
    const { query, isCalendarOpen } = this.state;
    const { enrollmentDates } = query;

    return (
      <Form.Field>
        <label>{translate('populationStatistics.enrollmentDates')}</label>
        <div>
          {
            enrollmentDates.map(date => (
              <Label className={styles.listedDate} key={date}>{dateFromApiToDisplay(date)}
                <Icon name="delete" onClick={() => this.removeDate(date)} />
              </Label>
              ))
          }
        </div>
        <Datetime
          dateFormat={DISPLAY_DATE_FORMAT}
          timeFormat={false}
          input={false}
          closeOnSelect
          isValidDate={this.isValidDate}
          onChange={this.addDate}
          open={isCalendarOpen}
        />

      </Form.Field>);
  };

  render() {
    const { translate } = this.props;
    const { isLoading } = this.state;

    let errorText = translate('populationStatistics.alreadyFetched');
    let isQueryInvalid = this.validateQuery();
    const isDateSelected = this.validateDates();
    if (!isDateSelected) {
      isQueryInvalid = true;
      errorText = translate('populationStatistics.selectDate');
    }

    return (
      <Form error={isQueryInvalid} loading={isLoading}>
        {this.renderEnrollmentDateSelector()}

        <Form.Group id="rightGroup" grouped required>
          <label htmlFor="rightGroup">{translate('populationStatistics.studyRights')}</label>
          {
            HARDCODE_STUDY_RIGHTS.map(right =>
              (<Form.Field
                key={`box-${right}`}
                label={right}
                control={Checkbox}
                value={right}
                name="studyRight"
                onChange={this.handleStudyRightChange}
              />))
          }
        </Form.Group>
        <Message
          error
          header={errorText}
        />
        <Button onClick={this.fetchPopulation} disabled={isQueryInvalid}>{translate('populationStatistics.addPopulation')}</Button>
        <Button onClick={this.clearPopulations}>{translate('populationStatistics.clearPopulations')}</Button>
      </Form>
    );
  }
}

const mapStateToProps = ({ populationReducer, locale }) => ({
  queries: populationReducer.queries,
  translate: getTranslate(locale)
});

const mapDispatchToProps = dispatch => ({
  dispatchGetPopulationStatistics: request =>
    dispatch(getPopulationStatisticsAction(request)),
  dispatchClearPopulations: () =>
    dispatch(clearPopulationsAction()),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm);
