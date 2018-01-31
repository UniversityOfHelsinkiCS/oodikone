import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Segment, Loader, Dimmer } from 'semantic-ui-react';

import StudentInfoCard from '../StudentInfoCard';
import { addError, getStudentAction, removeTagFromStudentAction } from '../../actions';
import CreditAccumulationGraph from '../CreditAccumulationGraph';

import styles from './studentDetails.css';

class StudentDetails extends Component {
  constructor(props) {
    super(props);

    this.renderInfoCard = this.renderInfoCard.bind(this);
    this.renderCreditsGraph = this.renderCreditsGraph.bind(this);

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

  renderInfoCard() {
    const { student } = this.state;
    const t = this.props.translate;
    if (student) {
      return <StudentInfoCard student={student} translate={t} />;
    }
    return null;
  }
  renderCreditsGraph() {
    const { student } = this.state;
    if (student) {
      return <CreditAccumulationGraph students={[student]} />;
    }
    return null;
  }


  render() {
    const { isLoading } = this.state;
    const { translate } = this.props;

    return (
      <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={styles.studentSegment}>
        <Dimmer active={isLoading} inverted>
          <Loader>{translate('common.loading')}</Loader>
        </Dimmer>
        { this.renderInfoCard() }
        { this.renderCreditsGraph() }
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
  dispatchRemoveTagFromStudent: (studentNumber, tag) =>
    dispatch(removeTagFromStudentAction(studentNumber, tag)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentDetails);
