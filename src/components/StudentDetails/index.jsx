import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Segment, Loader, Dimmer } from 'semantic-ui-react';

import StudentInfoCard from '../StudentInfoCard';
import { addError, getStudentAction } from '../../actions';

import styles from './studentDetails.css';

class StudentDetails extends Component {
  constructor(props) {
    super(props);

    this.partialRender = this.partialRender.bind(this);

    this.state = {
      isLoading: true,
      student: null
    };
  }

  componentDidMount() {
    const { studentNumber } = this.props;
    this.props.dispatchGetStudent(studentNumber)
      .then(
        json => this.setState({ student: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  partialRender() {
    const { student } = this.state;
    const t = this.props.translate;
    if (student) {
      return <StudentInfoCard student={student} translate={t} />;
    }
    return null;
  }


  render() {
    const { isLoading } = this.state;
    const t = this.props.translate;
    return (
      <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={styles.studentSegment}>
        <Dimmer active={isLoading} inverted>
          <Loader>{t('common.loading')}</Loader>
        </Dimmer>
        { this.partialRender() }
      </Dimmer.Dimmable>
    );
  }
}

const { string, func } = PropTypes;

StudentDetails.propTypes = {
  studentNumber: string.isRequired,
  translate: func.isRequired,
  dispatchAddError: func.isRequired,
  dispatchGetStudent: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchGetStudent: studentNumber =>
    dispatch(getStudentAction(studentNumber)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentDetails);
