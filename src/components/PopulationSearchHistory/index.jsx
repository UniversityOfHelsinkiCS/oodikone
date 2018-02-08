import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate } from 'react-localize-redux';

import PopulationQueryCard from '../PopulationQueryCard';
import { removePopulationAction } from '../../actions';

import styles from './populationSearchHistory.css';

class PopulationSearchHistory extends Component {
  removePopulation = (uuid) => {
    const { dispatchRemovePopulation } = this.props;
    dispatchRemovePopulation(uuid);
  };

  renderQueryCards = () => {
    const { populations, translate } = this.props;
    const { samples, queries } = populations;
    console.log(queries);
    return queries.map((query, i) => (
      <PopulationQueryCard
        key={`population-${query.uuid}`}
        translate={translate}
        population={samples[query.uuid]}
        query={query}
        queryId={i}
        removeSampleFn={this.removePopulation}
      />));
  };

  render() {
    return (
      <div className={styles.historyContainer} >
        { this.renderQueryCards() }
      </div>
    );
  }
}

const {
  func, shape, arrayOf, object
} = PropTypes;

PopulationSearchHistory.propTypes = {
  translate: func.isRequired,
  dispatchRemovePopulation: func.isRequired,
  populations: shape({
    queries: arrayOf(object),
    samples: object
  }).isRequired
};

const mapStateToProps = ({ populations, locale }) => ({
  populations,
  translate: getTranslate(locale)
});

const mapDispatchToProps = dispatch => ({
  dispatchRemovePopulation: uuid =>
    dispatch(removePopulationAction(uuid))
});


export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchHistory);
