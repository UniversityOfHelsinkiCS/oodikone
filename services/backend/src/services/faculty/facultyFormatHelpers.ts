import { Studyright, Transfer } from '../../models'

export const formatFacultyStudyRight = (studyright: Studyright) => {
  return {
    studyrightid: studyright.studyrightid,
    studystartdate: studyright.studystartdate,
    startdate: studyright.startdate,
    enddate: studyright.enddate,
    givendate: studyright.givendate,
    graduated: studyright.graduated,
    active: studyright.active,
    prioritycode: studyright.prioritycode,
    extentcode: studyright.extentcode,
    studentnumber: studyright.student_studentnumber,
    studyrightElements: studyright.studyright_elements,
    facultyCode: studyright.facultyCode,
  }
}

export const formatFacultyTransfer = (transfer: Transfer) => {
  return {
    sourcecode: transfer.sourcecode,
    targetcode: transfer.targetcode,
    transferdate: transfer.transferdate,
    studyrightid: transfer.studyrightid,
    studentnumber: transfer.studentnumber,
  }
}
