import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';

import CreditAccumulationGraph from '../CreditAccumulationGraph';
import CourseStatistics from '../CourseStatistics';
import { removeInvalidCreditsFromSamples } from '../../common';

class PopulationDetails extends Component {
  constructor(props) {
    super(props);

    this.renderCreditGainGraphs = this.renderCreditGainGraphs.bind(this);
    this.renderCourseStatistics = this.renderCourseStatistics.bind(this);

    this.state = {};
  }

  renderCourseStatistics() {
    const { samples, translate } = this.props;
    if (samples) {
      return samples.map((sample, i) =>
        (<CourseStatistics key={`course-statistics-${i}`} translate={translate} sample={sample} />)); // eslint-disable-line react/no-array-index-key
    }
    return null;
  }

  renderCreditGainGraphs() {
    const { samples, translate } = this.props;
    if (samples) {
      return samples.map((sample, i) =>
        (<CreditAccumulationGraph key={`credit-graph-${i}`} students={sample} title="test title" translate={translate} />)); // eslint-disable-line react/no-array-index-key
    }
    return null;
  }

  render() {
    const { translate } = this.props;

    return (
      <Segment attached>
        <Header size="medium" dividing>{translate('populationStatistics.creditStatisticsHeader')}</Header>
        { this.renderCourseStatistics() }
        <Header size="medium">{translate('populationStatistics.graphSegmentHeader')}</Header>
        { this.renderCreditGainGraphs() }
      </Segment>
    );
  }
}

const { func, object, arrayOf } = PropTypes;

PopulationDetails.propTypes = {
  translate: func.isRequired,
  samples: arrayOf(arrayOf(object)).isRequired
};

const mapStateToProps = ({ populations }) => ({
  samples: removeInvalidCreditsFromSamples(populations.samples)
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationDetails);

