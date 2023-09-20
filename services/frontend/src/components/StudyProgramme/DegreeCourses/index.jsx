import React, { useEffect, useState } from 'react'
import { connect, useSelector, useDispatch } from 'react-redux'
import { string, func, object } from 'prop-types'
import { Container } from 'semantic-ui-react'
import {
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
} from 'redux/programmeProgressCriteria'
import {
  setCourseExclusion,
  removeCourseExclusion,
  getMandatoryCourses,
} from '../../../redux/populationMandatoryCourses'

import CreditCriteriaForm from './CreditCriteriaForm'
import DegreeCourseTableView from './DegreeCourseTableView'

const DegreeCourses = ({ studyProgramme, criteria, setCriteria, setExclusion, removeExclusion, combinedProgramme }) => {
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const [defaultModules, setDefaultModules] = useState([])
  // Second programme modules are for combined studyprogrammes
  const [secondProgrammeModules, setSecondProgrammeModules] = useState([])
  const [addProgressCriteriaCourse, { data: courseData }] = useAddProgressCriteriaCourseMutation()
  const [addProgressCriteriaCredits, { data: creditsData }] = useAddProgressCriteriaCreditsMutation()
  useEffect(() => {
    dispatch(getMandatoryCourses(studyProgramme))
  }, [])

  useEffect(() => {
    if (courseData) {
      setCriteria(courseData)
    }
  }, [courseData])

  useEffect(() => {
    if (creditsData) {
      setCriteria(creditsData)
    }
  }, [creditsData])

  useEffect(() => {
    if (!mandatoryCourses || !mandatoryCourses?.defaultProgrammeCourses?.length) return
    const defaultModules = {}
    const secondProgrammeModules = {}
    mandatoryCourses.defaultProgrammeCourses.forEach(course => {
      const code = course.parent_code
      if (!defaultModules[code]) {
        defaultModules[code] = []
      }
      defaultModules[code].push(course)
    })
    if (combinedProgramme) {
      mandatoryCourses.secondProgrammeCourses.forEach(course => {
        const code = course.parent_code
        if (!secondProgrammeModules[code]) {
          secondProgrammeModules[code] = []
        }
        secondProgrammeModules[code].push(course)
      })
    }

    setDefaultModules(
      Object.entries(defaultModules)
        .map(([module, courses]) => ({ module, courses, module_order: courses[0].module_order }))
        .sort((a, b) => a.module_order - b.module_order)
    )
    setSecondProgrammeModules(
      Object.entries(secondProgrammeModules)
        .map(([module, courses]) => ({ module, courses, module_order: courses[0].module_order }))
        .sort((a, b) => a.module_order - b.module_order)
    )
  }, [mandatoryCourses])

  // WARNING STUPIDNESS AHEAD
  useEffect(() => {
    if (!defaultModules[0]) return
    if (defaultModules[0].module === 'undefined') {
      dispatch(getMandatoryCourses(studyProgramme, true))
    }
  }, [defaultModules])

  return (
    <Container>
      {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
        <CreditCriteriaForm
          criteria={criteria}
          studyProgramme={studyProgramme}
          addProgressCriteriaCredits={addProgressCriteriaCredits}
        />
      )}
      {defaultModules && defaultModules.length > 1 && (
        <DegreeCourseTableView
          modules={defaultModules}
          criteria={criteria}
          studyProgramme={studyProgramme}
          combinedProgramme=""
          setExclusion={setExclusion}
          removeExclusion={removeExclusion}
          addProgressCriteriaCourse={addProgressCriteriaCourse}
        />
      )}
      {secondProgrammeModules.length > 0 && (
        <DegreeCourseTableView
          modules={secondProgrammeModules}
          criteria={criteria}
          studyProgramme={studyProgramme}
          combinedProgramme={combinedProgramme}
          setExclusion={setExclusion}
          removeExclusion={removeExclusion}
          addProgressCriteriaCourse={addProgressCriteriaCourse}
        />
      )}
    </Container>
  )
}

DegreeCourses.propTypes = {
  studyProgramme: string.isRequired,
  removeExclusion: func.isRequired,
  setExclusion: func.isRequired,
  criteria: object.isRequired,
  setCriteria: func.isRequired,
}

const mapDispatchToProps = dispatch => ({
  setExclusion: (programmecode, excludeFromProgramme, coursecode) =>
    dispatch(setCourseExclusion(programmecode, excludeFromProgramme, coursecode)),
  removeExclusion: (programmecode, coursecode, id) => dispatch(removeCourseExclusion(programmecode, coursecode, id)),
})

export default connect(null, mapDispatchToProps)(DegreeCourses)
