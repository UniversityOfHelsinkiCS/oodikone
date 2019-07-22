import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Segment, Form, Table, Button, Modal, Header } from 'semantic-ui-react'
import { string, func, shape, arrayOf } from 'prop-types'
import {
  GetMandatoryCourseLabels,
  AddMandatoryCourseLabel,
  DeleteMandatoryCourseLabel,
  MoveMandatoryCourseLabel
} from '../../../redux/mandatoryCourseLabels'

const MandatoryCourseLabels = ({
  studyProgramme,
  labels,
  getLabels,
  removeLabel,
  moveLabel,
  addLabel,
  getMandatoryCourses
}) => {
  useEffect(() => { getLabels(studyProgramme) }, [])
  const [newLabel, setNewLabel] = useState('')
  return (
    <Segment basic>
      <Header>Labels</Header>
      <Form>
        <Form.Group>
          <Form.Input placeholder="Label text.." value={newLabel} onChange={(__, action) => setNewLabel(action.value)} />
          <Form.Button content="Add" disabled={newLabel.length === 0 || labels.some(e => newLabel.trim() === e.label)} onClick={() => addLabel(studyProgramme, { label: newLabel.trim() }) && setNewLabel('')} />
        </Form.Group>
      </Form>
      <Table compact className="fixed-header">
        <Table.Body>
          {_.orderBy(labels, ['orderNumber']).map((label, index) => (
            <Table.Row key={label.id}>
              <Table.Cell>{label.label}</Table.Cell>
              <Table.Cell collapsing>
                <Button
                  icon="angle up"
                  disabled={index === 0}
                  onClick={() => moveLabel(studyProgramme, label, 'up')}
                />
                <Button
                  icon="angle down"
                  disabled={index === labels.length - 1}
                  onClick={() => moveLabel(studyProgramme, label, 'down')}
                />
                <Modal
                  trigger={<Button icon="remove" negative />}
                  header="Really remove label?"
                  content={`Are you sure you want to remove the label "${
                    label.label
                  }"? This removes the label from all courses it is attached to.`}
                  actions={[
                    'Cancel',
                    {
                      key: 'remove',
                      content: 'Remove',
                      positive: true,
                      onClick: () => removeLabel(studyProgramme, label).then(() => getMandatoryCourses(studyProgramme))
                    }
                  ]}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  )
}

MandatoryCourseLabels.propTypes = {
  studyProgramme: string.isRequired,
  getLabels: func.isRequired,
  addLabel: func.isRequired,
  removeLabel: func.isRequired,
  moveLabel: func.isRequired,
  labels: arrayOf(shape({ code: string, label: string, name: shape({}) })).isRequired,
  getMandatoryCourses: func.isRequired
}

const mapStateToProps = ({ mandatoryCourseLabels }) => ({
  labels: mandatoryCourseLabels.data
})

const mapDispatchToProps = dispatch => ({
  getLabels: studyProgramme => dispatch(GetMandatoryCourseLabels(studyProgramme)),
  addLabel: (studyProgramme, label) => dispatch(AddMandatoryCourseLabel(studyProgramme, label)),
  removeLabel: (studyProgramme, label) => dispatch(DeleteMandatoryCourseLabel(studyProgramme, label)),
  moveLabel: (studyProgramme, label, direction) => dispatch(MoveMandatoryCourseLabel(studyProgramme, label, direction))
})

export default connect(mapStateToProps, mapDispatchToProps)(MandatoryCourseLabels)
