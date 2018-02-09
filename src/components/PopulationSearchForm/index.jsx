import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, arrayOf, object } from 'prop-types';
import { Checkbox, Form, Input, Button, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { getTranslate } from 'react-localize-redux';
import uuidv4 from 'uuid/v4';

import { DISPLAY_DATE_FORMAT } from '../../constants';
import { reformatDate } from '../../common';
import { addError, getPopulationStatisticsAction, clearPopulationsAction } from '../../actions';


const HARDCODE_STUDY_RIGHTS = [
  'Bachelor of Science, Mathematics',
  'Bachelor of Science, Computer Science',
  'Master of Science (science), Computer Science'
];

const HARDCODE_DATE = '2010-01-01';

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
    isLoading: false
  };

  validateQuery = () => {
    const { queries } = this.props;
    const { query } = this.state;
    return queries.some(q => _.isEqual(q, query));
  };

  handleFormChange = (e, data) => {
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

  render() {
    const { translate } = this.props;
    const { isLoading } = this.state;
    const isQueryInvalid = this.validateQuery();
    return (
      <Form error={isQueryInvalid} loading={isLoading}>
        <Form.Field>
          <label htmlFor="enrollmentInput">{translate('populationStatistics.enrollmentDates')}
            <Input id="enrollmentInput">{reformatDate(HARDCODE_DATE, DISPLAY_DATE_FORMAT)}</Input>
          </label>
        </Form.Field>
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
                onChange={this.handleFormChange}
              />))
          }
        </Form.Group>
        <Message
          error
          header={translate('populationStatistics.alreadyFetched')}
        />
        <Button onClick={this.fetchPopulation} disabled={isQueryInvalid}>{translate('populationStatistics.addPopulation')}</Button>
        <Button onClick={this.clearPopulations}>{translate('populationStatistics.clearPopulations')}</Button>
      </Form>
    );
  }
}

const mapStateToProps = ({ populations, locale }) => ({
  queries: populations.queries,
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
