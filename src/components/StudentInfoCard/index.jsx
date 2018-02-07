import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';

import { reformatDate } from '../../common';
import { studentDetailsType } from '../../constants/types';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import TagListSelector from '../TagListSelector';

import styles from './studentInfoCard.css';
import { addError, addTagToStudentAction, removeTagFromStudentAction, removeTagFromStudentHackSuccessAction } from '../../actions';

class StudentInfoCard extends Component {
 setState = {};


  handleAddTagFn = (tag) => {
    const { student, dispatchAddTagToStudent } = this.props;
    dispatchAddTagToStudent(student.studentNumber, { text: tag });
  };

  handleRemoveTagFn = (tag) => {
    const {
      student, dispatchRemoveTagFromStudent,
      dispatchRemoveTagFromStudentHackSuccess,
      dispatchAddError
    } = this.props;
    dispatchRemoveTagFromStudent(student.studentNumber, { text: tag })
      .then(
        () => dispatchRemoveTagFromStudentHackSuccess(student.studentNumber, tag),
        err => dispatchAddError(err)
      );
  };

  render() {
    const { student, translate } = this.props;
    const { tags, studentNumber, started } = student;
    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>
            <Icon.Group size="large">
              <Icon name="student" />
              <Icon corner name="hashtag" />
            </Icon.Group>
            <span className={styles.cardHeader}>{`${studentNumber}`}</span>

          </Card.Header>
          <Card.Meta>
            <div className={styles.startDate}>
              {`${translate('common.started')}: ${reformatDate(started, DISPLAY_DATE_FORMAT)}`}
            </div>
          </Card.Meta>
          <Card.Description>
            {`${translate('common.credits')}: ${student.credits || 0}`}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <TagListSelector
            tags={tags}
            translate={translate}
            handleAddTagFn={this.handleAddTagFn}
            handleRemoveTagFn={this.handleRemoveTagFn}
          />
        </Card.Content>
      </Card>
    );
  }
}

const { func } = PropTypes;

StudentInfoCard.propTypes = {
  student: studentDetailsType.isRequired,
  translate: func.isRequired,
  dispatchRemoveTagFromStudent: func.isRequired,
  dispatchRemoveTagFromStudentHackSuccess: func.isRequired,
  dispatchAddTagToStudent: func.isRequired,
  dispatchAddError: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchRemoveTagFromStudent: (studentNumber, tag) =>
    dispatch(removeTagFromStudentAction(studentNumber, tag)),
  dispatchRemoveTagFromStudentHackSuccess: (studentNumber, tag) =>
    dispatch(removeTagFromStudentHackSuccessAction(studentNumber, tag)),
  dispatchAddTagToStudent: (studentNumber, tag) =>
    dispatch(addTagToStudentAction(studentNumber, tag)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentInfoCard);

