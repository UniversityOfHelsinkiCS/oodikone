import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea, Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { shape, func, arrayOf } from 'prop-types'

import { userIsAdmin } from '../../common'
import { getCustomPopulation } from '../../redux/customPopulation'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'

const CustomPopulation = ({ getCustomPopulationDispatch, custompop, translate }) => {
  const [admin, setAdmin] = useState(false)
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    const isAdmin = userIsAdmin()
    setAdmin(isAdmin)
  }, [])

  const onClicker = (e) => {
    e.preventDefault()
    const studentnumbers = input.match(/[0-9]+/g)
    getCustomPopulationDispatch({ studentnumberlist: studentnumbers })
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

  const renderCustomPopulation = () => {
    const selectedStudents = custompop.map(student => student.studentNumber)
    return (
      <div>
        <Segment>
          <Header size="medium" dividing>
            {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
          </Header>
          <CreditAccumulationGraphHighCharts students={custompop} selectedStudents={selectedStudents} translate={translate} />
        </Segment>
        <PopulationStudents
          samples={custompop}
          selectedStudents={selectedStudents}
        />
      </div>
    )
  }

  if (!admin) return <div>you are not an admin, go away</div>

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
  getCustomPopulationDispatch: func.isRequired
}

const mapStateToProps = ({ customPopulation, localize }) => ({
  translate: getTranslate(localize),
  custompop: customPopulation.students.students || []
})

export default connect(mapStateToProps, { getCustomPopulationDispatch: getCustomPopulation })(CustomPopulation)
