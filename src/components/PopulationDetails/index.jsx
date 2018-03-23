import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, object, arrayOf } from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';
import { getTranslate } from 'react-localize-redux';

import CreditAccumulationGraph from '../CreditAccumulationGraph';
import CourseQuarters from '../CourseQuarters';
import { flattenAndCleanPopulations } from '../../common';

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(arrayOf(object)).isRequired
  };

  isSamplesRenderable = () => {
    const { samples } = this.props;
    console.log(samples);
    return samples && samples.length > 0;
  };

  renderCourseStatistics = () => {
    const { samples, translate } = this.props;
    let statistics = [];
    if (samples) {
      statistics = samples.map((sample, i) =>
        (<CourseQuarters
          key={`course-quarters-${i}`} // eslint-disable-line react/no-array-index-key
          sample={sample}
          title={`${translate('populationStatistics.sampleId')}: ${i}`}
          translate={translate}
        />));
    }
    return (
      <Segment>
        <Header size="medium" dividing>{translate('populationStatistics.creditStatisticsHeader')}</Header>
        { statistics }
      </Segment>
    );
  };

  renderCreditGainGraphs = () => {
    const { samples, translate } = this.props;
    const graphs = samples.map((sample, i) =>
      (<CreditAccumulationGraph
        key={`credit-graph-${i}`} // eslint-disable-line react/no-array-index-key
        students={sample}
        title={`${translate('populationStatistics.sampleId')}: ${i}`}
        translate={translate}
      />));
    return (
      <Segment>
        <Header size="medium" dividing>{translate('populationStatistics.graphSegmentHeader')}</Header>
        { graphs }
      </Segment>
    );
  };

  render() {
    if (!this.isSamplesRenderable()) {
      return null;
    }
    return (
      <div>
        { this.renderCourseStatistics() }
        { this.renderCreditGainGraphs() }
      </div>
    );
  }
}

const mapStateToProps = ({ newReducers, locale }) => ({
  samples: flattenAndCleanPopulations(newReducers.populations),
  translate: getTranslate(locale)
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationDetails);

