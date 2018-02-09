import React, { Component } from 'react';
import { func, shape, object } from 'prop-types';
import { connect } from 'react-redux';
import { Segment } from 'semantic-ui-react';
import { isEmpty } from 'lodash';

import StudentInfoCard from '../StudentInfoCard';
import { removeTagFromStudentAction } from '../../actions';
import CreditAccumulationGraph from '../CreditAccumulationGraph';
import SearchResultTable from '../SearchResultTable';
import { removeInvalidCreditsFromStudent } from '../../common';

import sharedStyles from '../../styles/shared';

class StudentDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    student: shape(object).isRequired
  };

  renderCreditsGraph = () => {
    const { translate, student } = this.props;

    const filteredStudent = removeInvalidCreditsFromStudent(student);
    return (
      <CreditAccumulationGraph
        students={[filteredStudent]}
        title={translate('studentStatistics.chartTitle')}
        translate={translate}
      />
    );
  };

  renderCourseParticipation = () => {
    const { translate, student } = this.props;

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
  };

  render() {
    const { translate, student } = this.props;
    if (isEmpty(student)) {
      return null;
    }
    return (
      <Segment className={sharedStyles.contentSegment} >
        <StudentInfoCard student={student} translate={translate} />;
        { this.renderCreditsGraph() }
        { this.renderCourseParticipation() }
      </Segment>
    );
  }
}

const mapStateToProps = ({ students }) => ({
  student: students.selectedStudent
});

const mapDispatchToProps = dispatch => ({
  dispatchRemoveTagFromStudent: (studentNumber, tag) =>
    dispatch(removeTagFromStudentAction(studentNumber, tag))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentDetails);
