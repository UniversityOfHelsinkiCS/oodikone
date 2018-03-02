import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Search } from 'semantic-ui-react';

import { addError, findStudyrightsAction } from '../../actions';

import styles from './studyrightSearch.css';

const { func } = PropTypes;


const DEFAULT_STATE = {
  studyrights: [],
  isLoading: false,
  searchStr: '',
  selectedStudyrights: []
};

class StudyrightSearch extends Component {
  constructor(props) {
    super(props);

    this.resetComponent = this.resetComponent.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.fetchStudyrightList = this.fetchStudyrightList.bind(this);

    this.state = DEFAULT_STATE;
  }

  resetComponent() {
    this.setState(DEFAULT_STATE);
  }

  handleSearchChange(e, { value }) {
    if (value.length > 0) {
      this.fetchStudyrightList(value);
    } else {
      this.resetComponent();
    }
  }

  fetchStudyrightList(searchStr) {
    this.setState({ searchStr, isLoading: true });
    this.props.dispatchFindStudyrights(searchStr)
      .then(
        json => this.setState({ studyrights: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  render() {
    const { isLoading, studyrights, searchStr } = this.state;
    const { translate } = this.props;

    return (
      <div className={styles.searchContainer}>
        <Search
          className={styles.studentSearch}
          input={{ fluid: true }}
          loading={isLoading}
          results={studyrights.map(sr => ({ title: sr }))}
          onResultSelect={(e, data) => this.props.selectStudyright(data.result)}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={translate('studyrights.searchPlaceholder')}
        />
      </div>
    );
  }
}

StudyrightSearch.propTypes = {
  dispatchFindStudyrights: func.isRequired,
  dispatchAddError: func.isRequired,
  translate: func.isRequired,
  selectStudyright: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchFindStudyrights: searchStr =>
    dispatch(findStudyrightsAction(searchStr)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudyrightSearch);
