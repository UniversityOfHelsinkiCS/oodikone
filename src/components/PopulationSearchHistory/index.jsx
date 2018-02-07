import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';


import PopulationQueryCard from '../PopulationQueryCard';
import { addError } from '../../actions';

class PopulationSearchHistory extends Component {
  removePopulation = (query, population) => {
    console.log(query);
    console.log(population);
  };

  render() {
    const { queries, samples, translate } = this.props;
    return (
      <div>
        { queries.map((item, i) =>
          (<PopulationQueryCard
            key={`population-${i}`}
            translate={translate}
            population={samples[i]}
            query={item}
            queryId={i}
            removeSampleFn={this.removePopulation}
          />))
        }
      </div>
    );
  }
}

const { func, arrayOf, object } = PropTypes;

PopulationSearchHistory.propTypes = {
  translate: func.isRequired,
  queries: arrayOf(object).isRequired,
  samples: arrayOf(object).isRequired
};

const mapStateToProps = ({ populations }) => ({
  queries: populations.queries,
  samples: populations.samples
});

const mapDispatchToProps = () => ({

});


export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchHistory);
