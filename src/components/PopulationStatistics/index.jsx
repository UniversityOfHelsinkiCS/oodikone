import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';
import { Header, Segment, Dimmer } from 'semantic-ui-react';

import PopulationSearch from '../PopulationSearch';
import PopulationDetails from '../PopulationDetails';
import { addError, addNewPopulationSampleQueryAction, getPopulationStatisticsAction } from '../../actions';
import SegmentDimmer from '../SegmentDimmer';

import sharedStyles from '../../styles/shared';


class PopulationStatistics extends Component {
 state = {
   isLoading: false
 };


  setSearchLoader = (isLoading) => {
    this.setState(isLoading);
  };

  renderPopulationSearch = () => {
    const { translate } = this.props;
    return (<PopulationSearch translate={translate} isLoadingFn={this.setSearchLoader} />);
  };

  renderPopulationDetails=() => {
    const { translate } = this.props;
    return (<PopulationDetails translate={translate} />);
  };

  render() {
    const { translate } = this.props;
    const { isLoading } = this.state;
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('populationStatistics.header')}</Header>
        <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={sharedStyles.contentSegment}>
          <SegmentDimmer translate={translate} isLoading={isLoading} />
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
