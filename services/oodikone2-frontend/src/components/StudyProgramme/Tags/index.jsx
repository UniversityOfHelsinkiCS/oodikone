import React, { useState, useEffect } from 'react'
import Datetime from 'react-datetime'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, List, Segment, Header, Confirm, Form, Icon, Popup } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import TagModal from '../TagModal'
import { reformatDate } from '../../../common'
import SortableTable from '../../SortableTable'
import { getTagsByStudytrackAction, createTagAction, deleteTagAction } from '../../../redux/tags'

const YEAR_DATE_FORMAT = 'YYYY'

const Tags = ({ createTag, deleteTag, getTagsByStudytrack, tags, studyprogramme, userId }) => {
  const [tagname, setTagname] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [year, setYear] = useState(null)
  const [personal, setPersonal] = useState(false)

  useEffect(() => {
    getTagsByStudytrack(studyprogramme)
  }, [])

  const handleDeleteTag = (event, tag) => {
    event.preventDefault()
    deleteTag(tag)
    setConfirm(null)
  }

  const handleTagYearSelect = momentYear => {
    setYear(momentYear)
  }

  const handleSubmit = event => {
    event.preventDefault()
    const newTag = {
      tagname: tagname.trim(),
      studytrack: studyprogramme,
      year: reformatDate(year, YEAR_DATE_FORMAT),
      personal_user_id: personal ? userId : null
    }
    createTag(newTag)
    setTagname('')
    setYear(null)
    setPersonal(false)
  }

  const handleChange = ({ target }) => {
    setTagname(target.value)
  }

  const deleteButton = tag => <Button onClick={() => setConfirm(tag)}>Delete</Button>

  const decorateTagName = tag => {
    if (tag.personal_user_id)
      return (
        <>
          {tag.tagname}
          <Popup
            content="Only you can see this tag."
            trigger={<Icon style={{ marginLeft: '1em' }} name="eye" color="purple" />}
          />
        </>
      )
    return tag.tagname
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: tag => decorateTagName(tag)
    },
    {
      key: 'year',
      title: 'Associated start year',
      getRowVal: tag => tag.year
    },
    {
      key: 'delete',
      title: 'Delete',
      getRowVal: tag => (
        <Form.Field>
          {deleteButton(tag.tag_id)}
          <Confirm
            open={confirm === tag.tag_id}
            onCancel={() => setConfirm(null)}
            onConfirm={event => handleDeleteTag(event, tag)}
            content={`Are you sure you want to delete tag "${tag.tagname}"? If you press confirm you will delete it from all students that have it. You and other users won't be able to use this tag again.`}
            cancelButton="Cancel"
            confirmButton="Confirm"
          />
        </Form.Field>
      )
    }
  ]

  return (
    <List>
      <Form>
        <Segment>
          <Form.Group>
            <Form.Field>
              <label>Tag name</label>
              <Form.Input onChange={handleChange} value={tagname} />
            </Form.Field>
            <Form.Field>
              <label>Associated start year</label>
              <Datetime
                className="yearSelectInput"
                control={Datetime}
                dateFormat={YEAR_DATE_FORMAT}
                timeFormat={false}
                renderYear={(props, selectableYear) => <td {...props}>{selectableYear}</td>}
                closeOnSelect
                value={year}
                onChange={handleTagYearSelect}
              />
            </Form.Field>
            <Form.Field>
              <label>Personal tag</label>
              <Form.Checkbox toggle checked={personal} onClick={() => setPersonal(!personal)} />
            </Form.Field>
            <Button
              disabled={!tagname.trim() || tags.find(t => t.tagname === tagname.trim()) || !year}
              onClick={handleSubmit}
            >
              {' '}
              Create new tag{' '}
            </Button>
            <TagModal tags={tags} studytrack={studyprogramme} />
          </Form.Group>
        </Segment>
      </Form>
      <Header size="medium">Study programme tags</Header>
      <SortableTable columns={columns} data={tags} getRowKey={row => row.tag_id} />
    </List>
  )
}

const mapStateToProps = state => ({
  tags: state.tags.data,
  userId: state.auth.token.id
})

Tags.propTypes = {
  getTagsByStudytrack: func.isRequired,
  createTag: func.isRequired,
  deleteTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studyprogramme: string.isRequired,
  userId: string.isRequired
}

export default withRouter(
  connect(
    mapStateToProps,
    {
      createTag: createTagAction,
      deleteTag: deleteTagAction,
      getTagsByStudytrack: getTagsByStudytrackAction
    }
  )(Tags)
)
