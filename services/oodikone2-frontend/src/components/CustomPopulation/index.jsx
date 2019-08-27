import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea, Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import { intersection, difference } from 'lodash'

import { getUserIsAdmin } from '../../common'
import { getCustomPopulation } from '../../redux/populations'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'
import { clearPopulationFilters } from '../../redux/populationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationFilters from '../CustomPopulationFilters'
import CustomPopulationCourses from '../CustomPopulationCourses'
import CustomPopulationProgrammeDist from '../CustomPopulationProgrammeDist'

const CustomPopulation = ({
  getCustomPopulationDispatch,
  getCustomPopulationCoursesByStudentnumbers,
  custompop,
  translate,
  isAdmin,
  selectedStudents,
  clearPopulationFiltersDispatch
}) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')

  const onClicker = (e) => {
    e.preventDefault()
    const studentnumbers = input.match(/[0-9]+/g)
    getCustomPopulationDispatch({ studentnumberlist: studentnumbers })
    getCustomPopulationCoursesByStudentnumbers({ studentnumberlist: studentnumbers })
    clearPopulationFiltersDispatch()
    setModal(false)
  }
  const renderCustomPopulationSearch = () => (
    <Modal
      trigger={<Button size="small" onClick={() => setModal(true)}>Custom population</Button>}
      open={modal}
      onClose={() => setModal(false)}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Custom population </h2>
          <Form.Field>
            <em> Insert studentnumbers you wish to use for population here </em>
            <TextArea placeholder="011111111" onChange={e => setInput(e.target.value)} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => setModal(false)}
        >
          Cancel
        </Button>
        <Button
          positive
          onClick={e => onClicker(e)}
        >
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )

  const renderCustomPopulation = () => (
    <div>
      <Segment>
        <CustomPopulationFilters samples={custompop} coursecodes={[]} />
        <Segment>
          <Header size="medium" dividing>
            {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
          </Header>
          <CreditAccumulationGraphHighCharts students={custompop} selectedStudents={selectedStudents} translate={translate} />
        </Segment>
      </Segment>
      <Segment>
        <Header>Programme distribution</Header>
        <CustomPopulationProgrammeDist samples={custompop} selectedStudents={selectedStudents} />
      </Segment>
      <CustomPopulationCourses
        selectedStudents={selectedStudents}
      />
      <PopulationStudents
        samples={custompop}
        selectedStudents={selectedStudents}
      />
    </div>
  )


  if (!isAdmin) return <div>you are not an admin, go away</div>

  return (
    <div>
      {renderCustomPopulationSearch()}
      {custompop.length > 0 ? (renderCustomPopulation()) : null}
    </div>
  )
}

CustomPopulation.propTypes = {
  translate: func.isRequired,
  custompop: arrayOf(shape({})).isRequired,
  getCustomPopulationDispatch: func.isRequired,
  getCustomPopulationCoursesByStudentnumbers: func.isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  isAdmin: bool.isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ populationFilters, populations, localize, populationCourses, auth: { token: { roles } } }) => {
  const samples = populations.data.students ? populations.data.students : []
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []
  const { complemented } = populationFilters

  if (samples.length > 0 && populationFilters.filters.length > 0) {
    const studentsForFilter = (f) => {
      if (f.type === 'CourseParticipation') {
        return Object.keys(f.studentsOfSelectedField)
      }
      return samples.filter(f.filter).map(s => s.studentNumber)
    }

    const matchingStudents = populationFilters.filters.map(studentsForFilter)
    selectedStudents = intersection(...matchingStudents)

    if (complemented) {
      selectedStudents = difference(samples.map(s => s.studentNumber), selectedStudents)
    }
  }

  return ({
    translate: getTranslate(localize),
    custompop: populations.data.students || [],
    courses: populationCourses.data,
    pending: populationCourses.pending,
    isAdmin: getUserIsAdmin(roles),
    selectedStudents
  })
}

export default connect(mapStateToProps, {
  getCustomPopulationDispatch: getCustomPopulation,
  getCustomPopulationCoursesByStudentnumbers,
  clearPopulationFiltersDispatch: clearPopulationFilters
})(CustomPopulation)
