import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';
import { Segment, Header, Dimmer, Loader } from 'semantic-ui-react';

import StudentSearch from '../StudentSearch';
import StudentDetails from '../StudentDetails';
import { addError, getStudentAction } from '../../actions';

import sharedStyles from '../../styles/shared';


class StudentStatistics extends Component {
  state = {
    studentNumber: null,
    isLoading: false
  };

  handleSearchSelect = (e, student) => {
    const { studentNumber } = student;
    const { dispatchGetStudent, dispatchAddError } = this.props;
    this.setState({ isLoading: true });
    dispatchGetStudent(studentNumber)
      .then(
        () => this.setState({ studentNumber, isLoading: false }),
        err => dispatchAddError(err)
      );
  };

  partialRender = () => {
    const { studentNumber } = this.state;
    const t = this.props.translate;
    if (studentNumber) {
      return (
        <StudentDetails studentNumber={studentNumber} translate={t} />
      );
    }
    return (
      <StudentSearch
        handleResultFn={this.handleSearchSelect}
        translate={t}
      />);
  };

  render() {
    const { translate } = this.props;
    const { isLoading } = this.state;
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('studentStatistics.header')}</Header>
        <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={sharedStyles.contentSegment}>
          <Dimmer active={isLoading} inverted>
            <Loader>{translate('common.loading')}</Loader>
          </Dimmer>
          {this.partialRender()}
        </Dimmer.Dimmable>
      </div>
    );
  }
}

const { func } = PropTypes;

StudentStatistics.propTypes = {
  translate: func.isRequired,
  dispatchAddError: func.isRequired,
  dispatchGetStudent: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  dispatchGetStudent: studentNumber =>
    dispatch(getStudentAction(studentNumber)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentStatistics);

