import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';
import { Segment, Header } from 'semantic-ui-react';

import StudentSearch from '../StudentSearch';
import StudentDetails from '../StudentDetails';

import sharedStyles from '../../styles/shared';


class StudentStatistics extends Component {
  state = { };

  render() {
    const { translate } = this.props;
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('studentStatistics.header')}</Header>
        <Segment className={sharedStyles.contentSegment}>
          <StudentSearch translate={translate} />
          <StudentDetails translate={translate} />
        </Segment>
      </div>
    );
  }
}

const { func } = PropTypes;

StudentStatistics.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(StudentStatistics);

