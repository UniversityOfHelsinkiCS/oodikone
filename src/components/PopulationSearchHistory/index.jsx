import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Segment } from 'semantic-ui-react';


import { addError } from '../../actions';

class PopulationSearchHistory extends Component {

  renderQueryItem = (item, sample) => (<div>{sample.length}</div>);

  render() {
    const { queries, samples } = this.props;
    return (
      <div>
        { queries.map((item, i) => this.renderQueryItem(item, samples[i]))}
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
