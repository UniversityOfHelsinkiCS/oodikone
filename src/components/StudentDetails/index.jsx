import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Segment, Loader, Dimmer } from 'semantic-ui-react';

import StudentInfoCard from '../StudentInfoCard';
import { addError, getStudentAction, removeTagFromStudentAction } from '../../actions';
import CreditAccumulationGraph from '../CreditAccumulationGraph';
import SearchResultTable from '../SearchResultTable';

import styles from './studentDetails.css';


class StudentDetails extends Component {
  constructor(props) {
    super(props);

    this.renderInfoCard = this.renderInfoCard.bind(this);
    this.renderCreditsGraph = this.renderCreditsGraph.bind(this);
    this.renderCourseParticipation = this.renderCourseParticipation.bind(this);

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
    const { translate } = this.props;
    if (student) {
      return (
        <CreditAccumulationGraph
          students={[student]}
          title={translate('studentStatistics.chartTitle')}
        />
      );
    }
    return null;
  }

  renderCourseParticipation() {
    const { student } = this.state;
    const { translate } = this.props;
    if (student) {
      const courseHeaders = [
        translate('common.date'),
        translate('common.course'),
        translate('common.grade'),
        translate('common.credits')
      ];
      const courseRows = student.courses.map((c) => {
        const {
          date, grade, credits, course
        } = c;
        return {
          date, course: `${course.name} (${course.code})`, grade, credits
        };
      });
      return (
        <SearchResultTable
          headers={courseHeaders}
          rows={courseRows}
          noResultText={translate('common.noResults')}
        />
      );
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
        { this.renderCourseParticipation() }
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
