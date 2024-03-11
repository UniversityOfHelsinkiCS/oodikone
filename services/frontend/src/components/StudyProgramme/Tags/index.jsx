import moment from 'moment'
import { arrayOf, func, shape, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Confirm, Form, Header, Icon, Item, List, Message, Popup, Segment } from 'semantic-ui-react'

import { reformatDate } from '@/common'
import { SortableTable } from '@/components/SortableTable'
import { ConnectedTagModal as TagModal } from '@/components/StudyProgramme/TagModal'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { createTagAction, deleteTagAction, getTagsByStudytrackAction } from '@/redux/tags'

const YEAR_DATE_FORMAT = 'YYYY'

const Tags = ({ createTag, deleteTag, getTagsByStudytrack, tags, studyprogramme, combinedProgramme }) => {
  const [tagname, setTagname] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [year, setYear] = useState(null)
  const [personal, setPersonal] = useState(false)
  const { id: userId } = useGetAuthorizedUserQuery()

  useEffect(() => {
    const studytrack = combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme
    getTagsByStudytrack(studytrack)
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
      studytrack: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
      year: year ? reformatDate(year, YEAR_DATE_FORMAT) : null,
      personal_user_id: personal ? userId : null,
    }
    createTag(newTag)
    setTagname('')
    setYear(null)
    setPersonal(false)
  }

  const handleChange = ({ target }) => {
    setTagname(target.value)
  }

  const deleteButton = tag => (
    <Button negative onClick={() => setConfirm(tag)}>
      Delete
    </Button>
  )

  const populationUrl = tag => {
    if (!tag.year) {
      const year = new Date().getFullYear()
      const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
      const href = combinedProgramme
        ? `/populations?months=${months}&semesters=FALL&semesters=` +
          `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=${year}&tag=${tag.tag_id}`
        : `/populations?months=${months}&semesters=FALL&semesters=` +
          `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}&tag=${tag.tag_id}`
      return href
    }
    const months = Math.ceil(moment.duration(moment().diff(`${tag.year}-08-01`)).asMonths())
    const href = combinedProgramme
      ? `/populations?months=${months}&semesters=FALL&semesters=` +
        `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=${tag.year}&tag=${tag.tag_id}`
      : `/populations?months=${months}&semesters=FALL&semesters=` +
        `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${tag.year}&tag=${tag.tag_id}`
    return href
  }

  const decorateTagName = tag => {
    if (tag.personal_user_id)
      return (
        <>
          {tag.tagname}
          <Item as={Link} to={populationUrl(tag)}>
            <Icon name="level up alternate" />
          </Item>
          <Popup
            content="Only you can see this tag."
            trigger={<Icon color="purple" name="eye" style={{ marginLeft: '1em' }} />}
          />
        </>
      )
    return (
      <>
        {tag.tagname}
        <Item as={Link} to={populationUrl(tag)}>
          <Icon name="level up alternate" />
        </Item>
      </>
    )
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: tag => tag.tagname,
      getRowContent: tag => decorateTagName(tag),
    },
    {
      key: 'year',
      title: 'Associated start year',
      getRowVal: tag => tag.year,
    },
    {
      key: 'delete',
      title: 'Delete',
      getRowContent: tag => (
        <Form.Field>
          {deleteButton(tag.tag_id)}
          <Confirm
            cancelButton="Cancel"
            confirmButton="Confirm"
            content={`Are you sure you want to delete tag "${tag.tagname}"? If you press confirm you will delete it from all students that have it. You and other users won't be able to use this tag again.`}
            onCancel={() => setConfirm(null)}
            onConfirm={event => handleDeleteTag(event, tag)}
            open={confirm === tag.tag_id}
          />
        </Form.Field>
      ),
    },
  ]

  return (
    <List>
      <Form>
        <Message
          content="Here you can create tags for study programme. You can either create public tags or personal tags. 
          Tags can be used to combine students from other starting years. 'Associated start year' means what year you want to use as a start year for the students in that tag.
          For example with this you can move student from earlier starting year to next year if the student was absent during first year. However this is optional and you can 
          create a new tag without selecting year."
          header="Create tags for study programme"
        />
        <Segment>
          <Form.Group>
            <Form.Field>
              <label>Tag name</label>
              <Form.Input className="tagNameSelectInput" onChange={handleChange} value={tagname} />
            </Form.Field>
            <Form.Field>
              <label>Associated start year</label>
              <Datetime
                className="yearSelectInput"
                closeOnSelect
                control={Datetime}
                dateFormat={YEAR_DATE_FORMAT}
                onChange={handleTagYearSelect}
                renderYear={(props, selectableYear) => <td {...props}>{selectableYear}</td>}
                timeFormat={false}
                value={year}
              />
            </Form.Field>
            <Form.Field>
              <label>Personal tag</label>
              <Form.Checkbox checked={personal} onClick={() => setPersonal(!personal)} toggle />
            </Form.Field>
            <Button
              color="green"
              disabled={!tagname.trim() || tags.some(t => t.tagname === tagname.trim())}
              onClick={handleSubmit}
            >
              {' '}
              Create new tag{' '}
            </Button>
            <TagModal combinedProgramme={combinedProgramme} studytrack={studyprogramme} tags={tags} />
          </Form.Group>
        </Segment>
      </Form>
      <Header size="medium">Study programme tags</Header>
      <SortableTable columns={columns} data={tags} />
    </List>
  )
}

const mapStateToProps = state => ({
  tags: state.tags.data,
})

Tags.propTypes = {
  getTagsByStudytrack: func.isRequired,
  createTag: func.isRequired,
  deleteTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studyprogramme: string.isRequired,
  combinedProgramme: string.isRequired,
}

export const ConnectedTags = connect(mapStateToProps, {
  createTag: createTagAction,
  deleteTag: deleteTagAction,
  getTagsByStudytrack: getTagsByStudytrackAction,
})(Tags)
