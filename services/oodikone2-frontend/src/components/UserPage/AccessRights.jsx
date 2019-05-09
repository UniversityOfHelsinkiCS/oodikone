import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Form, Accordion, Divider } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import { textAndDescriptionSearch } from '../../common'
import selectors from '../../selectors/programmes'
import { addUserUnits } from '../../redux/users'

const formatToOptions = ({ code, name }) => ({
  key: code,
  value: code,
  text: name,
  description: code
})

const AccessRights = ({ uid, options, ...props }) => {
  const [programme, setProgramme] = useState(undefined)
  const [selectedTracks, setTracks] = useState([])
  const [selectedDegrees, setDegrees] = useState([])
  const [showOptional, setShowOptional] = useState(false)
  const [loading, setLoading] = useState(false)
  const programmeOptions = options.map(formatToOptions)
    .sort((p1, p2) => p1.text.localeCompare(p2.text))
  const { tracks, degrees } = options.find(opt => opt.code === programme) || {}
  const trackOptions = !tracks ? [] : tracks.map(formatToOptions)
  const degreeOptions = !degrees ? [] : degrees.map(formatToOptions)
  const setAllOptions = () => {
    setTracks(trackOptions.map(t => t.value))
    setDegrees(degreeOptions.map(d => d.value))
  }
  const toggleExpanded = () => setShowOptional(!showOptional)
  const handleClick = async () => {
    setLoading(true)
    const codes = [...selectedTracks, ...selectedDegrees, programme].filter(e => !!e)
    await props.addUserUnits(uid, codes)
    setProgramme(undefined)
    setTracks([])
    setDegrees([])
    setShowOptional(false)
    setLoading(false)
  }
  return (
    <Form loading={loading}>
      <Form.Dropdown
        name="programme"
        required
        label="Study programme"
        placeholder="Select unit"
        options={programmeOptions}
        value={programme}
        onChange={(_, { value }) => {
          setProgramme(value)
          setTracks([])
          setDegrees([])
          setShowOptional(true)
        }}
        fluid
        search={textAndDescriptionSearch}
        selection
        clearable
        selectOnNavigation={false}
      />
      <Accordion>
        <Accordion.Title content="Optional" active={showOptional} onClick={toggleExpanded} />
        <Accordion.Content active={showOptional}>
          <Form.Dropdown
            label="Degree (optional)"
            disabled={!programme}
            name="degree"
            placeholder="Select specialization"
            options={degreeOptions}
            value={selectedDegrees}
            onChange={(_, { value }) => setDegrees(value)}
            fluid
            search={textAndDescriptionSearch}
            multiple
            selection
            clearable
          />
          <Form.Dropdown
            disabled={!programme}
            label="Specialization (Optional)"
            name="specializations"
            placeholder="Select specialization"
            options={trackOptions}
            value={selectedTracks}
            onChange={(_, { value }) => setTracks(value)}
            fluid
            search={textAndDescriptionSearch}
            multiple
            selection
            clearable
          />
          <Form.Button
            disabled={!programme}
            basic
            fluid
            onClick={setAllOptions}
            content="Select all"
          />
        </Accordion.Content>
      </Accordion>
      <Divider />
      <Form.Button
        disabled={!programme}
        basic
        fluid
        positive
        content="Save"
        onClick={handleClick}
      />
    </Form>
  )
}

AccessRights.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
    tracks: PropTypes.arrayOf({
      code: PropTypes.string,
      name: PropTypes.string
    })
  })).isRequired,
  addUserUnits: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
}

const mapStateToProps = (state) => {
  const { programmes, tracks, degrees } = selectors.dropdownOptionsSelector(state)
  const options = selectors.dropdownAssociationsSelector(state)
  return {
    programmes,
    tracks,
    degrees,
    options
  }
}

export default connect(mapStateToProps, { addUserUnits })(AccessRights)
