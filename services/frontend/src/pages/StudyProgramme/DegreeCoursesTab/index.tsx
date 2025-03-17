import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'
import { Container } from 'semantic-ui-react'

import { CurriculumPicker } from '@/components/PopulationDetails/CurriculumPicker'
import { useGetProgressCriteriaQuery } from '@/redux/programmeProgressCriteria'
import { CreditCriteriaForm } from './CreditCriteriaForm'
import { DegreeCourseTableView } from './DegreeCourseTableView'

export const DegreeCoursesTab = ({ studyProgramme, combinedProgramme, year }) => {
  const [defaultModules, setDefaultModules] = useState([])
  const [curriculum, setCurriculum] = useState(null)
  const [secondProgrammeModules, setSecondProgrammeModules] = useState([])
  const { data: progressCriteria } = useGetProgressCriteriaQuery({ programmeCode: studyProgramme })
  const emptyCriteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }
  const criteria = progressCriteria ?? emptyCriteria

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
      orderBy(
        Object.entries(defaultModules).map(([module, courses]) => ({
          module,
          courses,
          module_order: courses[0].module_order,
        })),
        m => m.code
      )
    )
    setSecondProgrammeModules(
      orderBy(
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
        <CreditCriteriaForm criteria={criteria} studyProgramme={studyProgramme} />
      )}
      {defaultModules && defaultModules.length > 1 && (
        <DegreeCourseTableView
          combinedProgramme=""
          criteria={criteria}
          curriculum={curriculum}
          modules={defaultModules}
          studyProgramme={studyProgramme}
        />
      )}
      {secondProgrammeModules.length > 0 && (
        <DegreeCourseTableView
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
