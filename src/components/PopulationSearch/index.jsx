import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Segment, Header } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import _ from 'lodash';


class PopulationSearch extends Component {
  constructor(props) {
    super(props);

    this.isQueryEqualToAlreadyFetched = this.isQueryEqualToAlreadyFetched.bind(this);

    this.state = {
      query: {}
    };
  }

  isQueryEqualToAlreadyFetched() {
    const { queries } = this.props;
    const { query } = this.state;
    return queries.some(q => _.isEqual(q, query));
  }

  render() {
    return (
      <Segment color="teal" inverted attached="top">
        <Header size="small">Hardcoded MVP search for 2017 env population</Header>
      </Segment>
    );
  }
}

const { func, arrayOf, object } = PropTypes;

PopulationSearch.propTypes = {
  translate: func.isRequired,
  queries: arrayOf(object).isRequired
};

const mapStateToProps = ({ populations }) => ({
  queries: populations.queries
});

export default connect(mapStateToProps)(PopulationSearch);
