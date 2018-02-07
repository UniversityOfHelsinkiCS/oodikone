import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';
import { Header, Segment, Dimmer, Loader } from 'semantic-ui-react';

import PopulationSearch from '../PopulationSearch';
import PopulationDetails from '../PopulationDetails';
import { addError, addNewPopulationSampleQueryAction, getPopulationStatisticsAction } from '../../actions';

import sharedStyles from '../../styles/shared';

class PopulationStatistics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false
    };

    this.renderPopulationSearch = this.renderPopulationSearch.bind(this);
    this.renderPopulationDetails = this.renderPopulationDetails.bind(this);
  }

  componentDidMount() {
    const {
      dispatchGetPopulationStatistics,
      dispatchAddNewPopulationSampleQuery,
      dispatchAddError
    } = this.props;

    const selectedPopulations = {
      enrollmentDates: ['2010-01-01'],
      studyRights: ['Master of Science (science), Computer Science'],
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

    this.setState({ isLoading: true });
    dispatchGetPopulationStatistics(selectedPopulations)
      .then(
        () => {
          dispatchAddNewPopulationSampleQuery(selectedPopulations);
          this.setState({ isLoading: false });
        },
        err => dispatchAddError(err)
      );
  }

  renderPopulationSearch() {
    const { translate } = this.props;
    return (<PopulationSearch translate={translate} />);
  }

  renderPopulationDetails() {
    const { translate } = this.props;
    return (<PopulationDetails translate={translate} />);
  }

  render() {
    const { translate } = this.props;
    const { isLoading } = this.state;
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('populationStatistics.header')}</Header>
        <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={sharedStyles.contentSegment}>
          <Dimmer active={isLoading} inverted>
            <Loader>{translate('common.loading')}</Loader>
          </Dimmer>
          { this.renderPopulationSearch() }
          { this.renderPopulationDetails() }
        </Dimmer.Dimmable>
      </div>
    );
  }
}

const { func } = PropTypes;

PopulationStatistics.propTypes = {
  translate: func.isRequired,
  dispatchGetPopulationStatistics: func.isRequired,
  dispatchAddNewPopulationSampleQuery: func.isRequired,
  dispatchAddError: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  dispatchGetPopulationStatistics: request =>
    dispatch(getPopulationStatisticsAction(request)),
  dispatchAddNewPopulationSampleQuery: request =>
    dispatch(addNewPopulationSampleQueryAction(request)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationStatistics);
