import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Segment, Header, Divider } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { addError, addNewPopulationSampleQueryAction, clearPopulationsAction, getPopulationStatisticsAction } from '../../actions';

import PopulationSearchForm from '../PopulationSearchForm';
import PopulationSearchHistory from '../PopulationSearchHistory';

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

class PopulationSearch extends Component {
 state = {
   query: INITIAL_QUERY,
   isQueryInvalid: false
 };


  isQueryEqualToAlreadyFetched = (query) => {
    const { queries } = this.props;
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
    const newQuery = {
      ...query,
      studyRights
    };

    if (!this.isQueryEqualToAlreadyFetched(newQuery)) {
      this.setState({ query: newQuery, isQueryInvalid: false });
    } else {
      this.setState({ isQueryInvalid: true });
    }
  };

  clearPopulations = () => {
    const { dispatchClearPopulations } = this.props;
    dispatchClearPopulations();
  };

  fetchPopulation = () => {
    const { query } = this.state;
    const {
      isLoadingFn,
      dispatchGetPopulationStatistics,
      dispatchAddNewPopulationSampleQuery,
      dispatchAddError
    } = this.props;

    if (!this.isQueryEqualToAlreadyFetched()) {
      isLoadingFn({ isLoading: true });
      dispatchGetPopulationStatistics(query)
        .then(
          () => {
            dispatchAddNewPopulationSampleQuery(query);
            isLoadingFn({ isLoading: false });
          },
          err => dispatchAddError(err)
        );
    }
  };

  render() {
    const { translate } = this.props;
    const { isQueryInvalid } = this.state;
    return (
      <Segment>
        <Header size="medium">Search for populations</Header>
        <PopulationSearchForm
          handleFormChangeFn={this.handleFormChange}
          addPopulationFn={this.fetchPopulation}
          clearPopulationsFn={this.clearPopulations}
          isQueryInvalid={isQueryInvalid}
          translate={translate}
        />
        <Divider />
        <PopulationSearchHistory translate={translate} />
      </Segment>
    );
  }
}

const { func, arrayOf, object } = PropTypes;

PopulationSearch.propTypes = {
  translate: func.isRequired,
  queries: arrayOf(object).isRequired,
  dispatchGetPopulationStatistics: func.isRequired,
  dispatchAddNewPopulationSampleQuery: func.isRequired,
  dispatchClearPopulations: func.isRequired,
  dispatchAddError: func.isRequired,
  isLoadingFn: func.isRequired
};

const mapStateToProps = ({ populations }) => ({
  queries: populations.queries
});

const mapDispatchToProps = dispatch => ({
  dispatchGetPopulationStatistics: request =>
    dispatch(getPopulationStatisticsAction(request)),
  dispatchAddNewPopulationSampleQuery: request =>
    dispatch(addNewPopulationSampleQueryAction(request)),
  dispatchClearPopulations: () =>
    dispatch(clearPopulationsAction()),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearch);
