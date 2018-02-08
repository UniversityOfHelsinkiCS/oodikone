import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';
import { Header, Segment, Divider } from 'semantic-ui-react';

import PopulationSearchForm from '../PopulationSearchForm';
import PopulationSearchHistory from '../PopulationSearchHistory';
import PopulationDetails from '../PopulationDetails';

import sharedStyles from '../../styles/shared';


class PopulationStatistics extends Component {
  renderPopulationSearch = () => {
    const { translate } = this.props;
    return (
      <Segment>
        <Header size="medium">{translate('populationStatistics.searchTitle')}</Header>
        <PopulationSearchForm />
        <Divider />
        <PopulationSearchHistory />
      </Segment>
    );
  };

  render() {
    const { translate } = this.props;
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('populationStatistics.header')}</Header>
        <Segment className={sharedStyles.contentSegment}>
          { this.renderPopulationSearch() }
          <PopulationDetails />
        </Segment>
      </div>
    );
  }
}

const { func } = PropTypes;

PopulationStatistics.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationStatistics);
