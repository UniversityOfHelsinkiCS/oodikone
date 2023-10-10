import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { string, func } from 'prop-types'
import { Container } from 'semantic-ui-react'
import {
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
  useGetProgressCriteriaQuery,
} from 'redux/programmeProgressCriteria'
import CurriculumPicker from 'components/PopulationDetails/CurriculumPicker'
import { setCourseExclusion, removeCourseExclusion } from '../../../redux/courseExclusions'
import CreditCriteriaForm from './CreditCriteriaForm'
import DegreeCourseTableView from './DegreeCourseTableView'

const DegreeCourses = ({ studyProgramme, setExclusion, removeExclusion, combinedProgramme }) => {
  const [defaultModules, setDefaultModules] = useState([])
  const [curriculum, setCurriculum] = useState(null)
  const [secondProgrammeModules, setSecondProgrammeModules] = useState([])
  const [addProgressCriteriaCourse, { data: courseData }] = useAddProgressCriteriaCourseMutation()
  const [addProgressCriteriaCredits, { data: creditsData }] = useAddProgressCriteriaCreditsMutation()
  const progressCriteria = useGetProgressCriteriaQuery({ programmeCode: studyProgramme })
  const emptyCriteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }

  const [criteria, setCriteria] = useState(progressCriteria?.data ? progressCriteria.data : emptyCriteria)

  useEffect(() => {
    if (progressCriteria.data) {
      setCriteria(progressCriteria.data)
    }
  }, [progressCriteria.data])

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
}

const mapDispatchToProps = dispatch => ({
  setExclusion: (programmecode, excludeFromProgramme, coursecode, curriculum) =>
    dispatch(setCourseExclusion(programmecode, excludeFromProgramme, coursecode, curriculum)),
  removeExclusion: ({ programmeCode, curriculumVersion, courseCodes }) =>
    dispatch(removeCourseExclusion({ programmeCode, curriculumVersion, courseCodes })),
})

export default connect(null, mapDispatchToProps)(DegreeCourses)
