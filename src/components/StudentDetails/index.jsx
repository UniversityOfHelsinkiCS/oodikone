import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Segment, Dimmer } from 'semantic-ui-react';

import StudentInfoCard from '../StudentInfoCard';
import { removeTagFromStudentAction } from '../../actions';
import CreditAccumulationGraph from '../CreditAccumulationGraph';
import SearchResultTable from '../SearchResultTable';
import { removeInvalidCreditsFromStudent } from '../../common';
import SegmentDimmer from '../SegmentDimmer';

import sharedStyles from '../../styles/shared';


class StudentDetails extends Component {
  state = {
    isLoading: false
  };

  renderInfoCard = () => {
    const { translate, students, studentNumber } = this.props;
    const student = students[studentNumber];
    if (student) {
      return <StudentInfoCard student={student} translate={translate} />;
    }
    return null;
  };
  renderCreditsGraph = () => {
    const { translate, students, studentNumber } = this.props;
    const student = students[studentNumber];
    if (student) {
      return (
        <CreditAccumulationGraph
          students={[student]}
          title={translate('studentStatistics.chartTitle')}
          translate={translate}
        />
      );
    }
    return null;
  };

  renderCourseParticipation = () => {
    const { translate, students, studentNumber } = this.props;
    const student = removeInvalidCreditsFromStudent(students[studentNumber]);
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
  };

  render() {
    const { isLoading } = this.state;
    const { translate } = this.props;

    return (
      <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={sharedStyles.contentSegment}>
        <SegmentDimmer isLoading={isLoading} translate={translate} />
        { this.renderInfoCard() }
        { this.renderCreditsGraph() }
        { this.renderCourseParticipation() }
      </Dimmer.Dimmable>
    );
  }
}

const {
  string, func, shape, object
} = PropTypes;

StudentDetails.propTypes = {
  studentNumber: string.isRequired,
  translate: func.isRequired,
  students: shape(object).isRequired
};

const mapStateToProps = ({ students }) => ({
  students: students.students
});

const mapDispatchToProps = dispatch => ({
  dispatchRemoveTagFromStudent: (studentNumber, tag) =>
    dispatch(removeTagFromStudentAction(studentNumber, tag))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentDetails);
