import React, { Component } from 'react';
import { func } from 'prop-types';
import { Card, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';

import { reformatDate } from '../../common';
import { studentDetailsType } from '../../constants/types';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import TagListSelector from '../TagListSelector';

import styles from './studentInfoCard.css';
import { addTagToStudentAction, removeTagFromStudentAction } from '../../actions';

class StudentInfoCard extends Component {
  static propTypes = {
    student: studentDetailsType.isRequired,
    translate: func.isRequired,
    dispatchRemoveTagFromStudent: func.isRequired,
    dispatchAddTagToStudent: func.isRequired
  };

  handleAddTagFn = (tag) => {
    const { student, dispatchAddTagToStudent } = this.props;
    dispatchAddTagToStudent(student.studentNumber, { text: tag });
  };

  handleRemoveTagFn = (tag) => {
    const { student, dispatchRemoveTagFromStudent } = this.props;
    dispatchRemoveTagFromStudent(student.studentNumber, { text: tag });
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

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchRemoveTagFromStudent: (studentNumber, tag) =>
    dispatch(removeTagFromStudentAction(studentNumber, tag)),
  dispatchAddTagToStudent: (studentNumber, tag) =>
    dispatch(addTagToStudentAction(studentNumber, tag))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentInfoCard);

