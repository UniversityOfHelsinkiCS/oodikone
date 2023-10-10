import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { string, func, object } from 'prop-types'
import { Container } from 'semantic-ui-react'
import {
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
} from 'redux/programmeProgressCriteria'
import CurriculumPicker from 'components/PopulationDetails/CurriculumPicker'
import { setCourseExclusion, removeCourseExclusion } from '../../../redux/courseExclusions'

import CreditCriteriaForm from './CreditCriteriaForm'
import DegreeCourseTableView from './DegreeCourseTableView'

const DegreeCourses = ({ studyProgramme, criteria, setCriteria, setExclusion, removeExclusion, combinedProgramme }) => {
  const [defaultModules, setDefaultModules] = useState([])
  const [curriculum, setCurriculum] = useState(null)
  const [secondProgrammeModules, setSecondProgrammeModules] = useState([])
  const [addProgressCriteriaCourse, { data: courseData }] = useAddProgressCriteriaCourseMutation()
  const [addProgressCriteriaCredits, { data: creditsData }] = useAddProgressCriteriaCreditsMutation()

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
    if (!curriculum || !curriculum?.defaultProgrammeCourses?.length) return
    const defaultModules = {}
    const secondProgrammeModules = {}
    curriculum.defaultProgrammeCourses.forEach(course => {
      const code = course.parent_code
      if (!defaultModules[code]) {
        defaultModules[code] = []
      }
      defaultModules[code].push(course)
    })
    if (combinedProgramme) {
      curriculum.secondProgrammeCourses.forEach(course => {
        const code = course.parent_code
        if (!secondProgrammeModules[code]) {
          secondProgrammeModules[code] = []
        }
        secondProgrammeModules[code].push(course)
      })
    }

    setDefaultModules(
      _.orderBy(
        Object.entries(defaultModules).map(([module, courses]) => ({
          module,
          courses,
          module_order: courses[0].module_order,
        })),
        m => m.code
      )
    )
    setSecondProgrammeModules(
      _.orderBy(
        Object.entries(secondProgrammeModules).map(([module, courses]) => ({
          module,
          courses,
          module_order: courses[0].module_order,
        })),
        m => m.code
      )
    )
  }, [curriculum])

  return (
    <Container>
      <div>
        <h3 style={{ marginTop: '15px', marginBottom: '15px' }}>
          Select curriculum to edit:
          <CurriculumPicker programmeCodes={[studyProgramme, combinedProgramme]} setCurriculum={setCurriculum} />
        </h3>
      </div>
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
          curriculum={curriculum}
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
          curriculum={curriculum}
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
  setExclusion: (programmecode, excludeFromProgramme, coursecode, curriculum) =>
    dispatch(setCourseExclusion(programmecode, excludeFromProgramme, coursecode, curriculum)),
  removeExclusion: ({ programmeCode, curriculumVersion, courseCodes }) =>
    dispatch(removeCourseExclusion({ programmeCode, curriculumVersion, courseCodes })),
})

export default connect(null, mapDispatchToProps)(DegreeCourses)
