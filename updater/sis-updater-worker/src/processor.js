import { intersection } from 'lodash-es'

import { update } from './updater/index.js'
import { purgeByStudentNumber, prePurge, purge } from './updater/purge.js'
import { loadMapsOnDemand } from './updater/shared.js'
import {
  fixVarhaiskasvatusStudyRights,
  studentsThatNeedToBeFixed,
} from './updater/updateStudents/varhaiskasvatusFixer.js'

const updateMsgHandler = async updateMsg => {
  await update(updateMsg)
  if (updateMsg.type === 'students') {
    const studentsToBeFixed = intersection(
      updateMsg.entityIds || [],
      studentsThatNeedToBeFixed.map(s => s.id)
    )
    if (studentsToBeFixed.length > 0) {
      await fixVarhaiskasvatusStudyRights(studentsToBeFixed)
    }
  }
}

export default async job => {
  switch (job.name) {
    case 'students_with_purge': {
      const studentNumbers = job.data.map(student => student.student_number)
      await purgeByStudentNumber(studentNumbers)
      await updateMsgHandler({ type: 'students', entityIds: job.data.map(student => student.id) })
      break
    }
    case 'prepurge_start': {
      const count = await prePurge(job.data)
      return { counts: count, before: job.data.before }
    }
    case 'purge_start':
      await purge(job.data)
      break
    case 'course_units':
    case 'credit_types':
    case 'curriculum_periods':
    case 'education_types':
    case 'organisations':
    case 'programme_modules':
    case 'students':
    case 'study_levels':
    case 'study_modules':
      await updateMsgHandler({ entityIds: job.data, type: job.name })
      break
    case 'reload_redis':
      await loadMapsOnDemand()
      break
    default:
      throw new Error(`Unknown job type: ${job.name}`)
  }
}
