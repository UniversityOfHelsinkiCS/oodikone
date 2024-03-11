import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { Container } from 'semantic-ui-react'

import { CurriculumPicker } from '@/components/PopulationDetails/CurriculumPicker'
import {
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
  useGetProgressCriteriaQuery,
} from '@/redux/programmeProgressCriteria'
import { CreditCriteriaForm } from './CreditCriteriaForm'
import { DegreeCourseTableView } from './DegreeCourseTableView'

export const DegreeCoursesTable = ({ studyProgramme, combinedProgramme, year }) => {
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
          <CurriculumPicker
            programmeCodes={[studyProgramme, combinedProgramme]}
            setCurriculum={setCurriculum}
            year={year}
          />
        </h3>
      </div>
      {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
        <CreditCriteriaForm
          addProgressCriteriaCredits={addProgressCriteriaCredits}
          criteria={criteria}
          studyProgramme={studyProgramme}
        />
      )}
      {defaultModules && defaultModules.length > 1 && (
        <DegreeCourseTableView
          addProgressCriteriaCourse={addProgressCriteriaCourse}
          combinedProgramme=""
          criteria={criteria}
          curriculum={curriculum}
          modules={defaultModules}
          studyProgramme={studyProgramme}
        />
      )}
      {secondProgrammeModules.length > 0 && (
        <DegreeCourseTableView
          addProgressCriteriaCourse={addProgressCriteriaCourse}
          combinedProgramme={combinedProgramme}
          criteria={criteria}
          curriculum={curriculum}
          modules={secondProgrammeModules}
          studyProgramme={studyProgramme}
        />
      )}
    </Container>
  )
}
