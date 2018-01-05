const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../../models')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')

const { getDate } = require('./oodi_data_mapper')
const moment = require('moment')

// const CourseService = require('../services/courses')
const Op = Sequelize.Op
const Oi = require('./oodi_interface')


// let minStudentNumber = 1000000
// let maxStudentNumber = 1500000
// add possibility to update specific students ?
// console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

// for (let i = minStudentNumber; i < maxStudentNumber; i++) {
//   let studentNumber = '0' + i + getStudentNumberChecksum(i.toString)
//   console.log('Updating student ' + studentNumber)

//   updateStudentInformation(studentNumber)
// }

/**
 * Calculate checksum of student number.
 *
 * @param studentNumber Student number without the checksum (last digit).
 * @return Checksum digit.
 
const getStudentNumberChecksum = studentNumber => {
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumber.length; i++) {Studyright.byStudent(student.studentnumber)
    // go from end to start
    let currentNumber = studentNumber.charAt(studentNumber.length - (i + 1))
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}
*/

const updateStudentInformation = async studentNumber => {
  let student = await loadAndUpdateStudent(studentNumber)
  if (student === null) {
    return
  }
  updateStudentStudyRights(student)
  return
  updateStudentCredits(student)
}

const updateStudentStudyRights = async student => {
  const oodiStudentStudyRights = await Oi.getStudentStudyRights(student.studentnumber)
  const studentStudyRights = await StudyrightService.byStudent(student.studentnumber).map(studyright => studyright.dataValues)
  
  if (oodiStudentStudyRights.length === studentStudyRights.length) {
    console.log('Student: ' + student.studentnumber + 'No need to update study rights')
    return
  }

  //not the best solution so far
  const oodiStudentStudyRightIds = oodiStudentStudyRights.map(sr => sr.studyRightId)
  const studentStudyRightIds = studentStudyRights.map(sr => sr.studyrightid)

  console.log('Student: ' + student.studentnumber + ' updating study rights')
  oodiStudentStudyRightIds.forEach(studyRight => {
    if (!studentStudyRightIds.includes(studyRight)) {
      console.log('whoa')
      return
      let organization = Organization.findByCode(studyRight.organization_code)
      if (organization === null) {
        organization = Oi.getOrganisation(studyRight.organization_code)
        organization.save().then(() => { })// save the organization
      }
      studyRight.organization_code = organization
      studyRight.student_studentnumber = student.studentnumber
      studyRight.save().then(() => { // save study right
        student.setStudentStudyRights([student.getStudentStudyRights(), studyRight]) // add studyrights to student
      })
    }
  })
}

const updateStudentCredits = async student => {
  let studentCourseCredits = await Oi.getStudentCourseCredits(student.studentnumber)

  await student.getCredits().then(studentOldCredits => {
    if (studentOldCredits.lenght === studentCourseCredits.length) {
      console.log('Student: ' + student.studentnumber + ' no need to update credits')
      return
    }
  })
  console.log('Student: ' + student.studentnumber + ' updating credits')
  studentCourseCredits.forEach(async credit => {
    if (!student.studentAlreadyHasCredit(student, credit)) {
      let instance = await credit.getCourseInstance()
      let course = await CourseService.byNameOrCode(instance.course_code)
      if (course === null) {
        /* something like this?
        course = credit.getCourseInstance().then(instance => {
          instance.getCourse().then(() => {})
        })
        course.save()
        */
      }
      await credit.getCourseInstance().then(instance => {
        instance.setCourse(course)
      })

      // Is instanceStatistics the right one to use?
      let courseInstance = CourseService.instanceStatistic(instance.course_code, instance.coursedate)
      if (courseInstance === null) {
        teacherDetailData = oi.getTeacherDetails(instance.course_code, instance.coursedate)
        /*
        Map<Teacher, String> teacherRoles = OodiDataMapper.getTeacherRoles(teacherDetailData);
        List<CourseTeacher> courseTeachers = new ArrayList<>();
        for (Teacher teacher : teacherRoles.keySet()) {
            Teacher t = (teacher.getCode() == null ? teacherRepository.findByName(teacher.getName()) : teacherRepository.findByCodeOrName(teacher.getCode(), teacher.getName()));
            
            if(t == null) {
                t = teacherRepository.saveAndFlush(teacher);
            }
            
            CourseTeacher ct = new CourseTeacher();
            ct.setTeacher(t);
            ct.setTeacherRole(teacherRoles.get(teacher));
            
            courseTeachers.add(ct);
        }
        
        courseInstance = courseInstanceRepository.saveAndFlush(credit.getCourseInstance());
        
        for (CourseTeacher courseTeacher : courseTeachers) {
            courseTeacher.setCourseInstance(courseInstance);
            courseTeacher = courseTeacherRepository.saveAndFlush(courseTeacher);
            courseInstance.getTeachers().add(courseTeacher);
        }
        
        courseInstance = courseInstanceRepository.saveAndFlush(credit.getCourseInstance());
        */
      }
      await credit.setCourseInstance(courseInstance)
      await credit.getCourseInstance().then(() => setCourse(course))

      await credit.setStudent(student)
      await credit.save()

      await courseInstance.addCredit(credit)
      await courseInstance.save()
    }
  })
  await student.save()
}

const studentAlreadyHasCredit = (student, credit) => {
  student.getCredits.forEach(studentCredit => {
    // do below credit methods exist?
    if (credit.getGrade() === studentCredit.getGrade() &&
      credit.hasSameCourseInstance(studentCredit.getCourseInstance())) {
      return true
    }
  })
  return false
}

const loadAndUpdateStudent = async studentNumber => {
  let student = await StudentService.byId(studentNumber)
  let studentFromOodi = await Oi.getStudent(studentNumber)
  if (studentFromOodi == null) {
    console.log('couldn\'t fetch student ' + studentNumber + '\'s information.')
    return null
  }
  if (student == null) {
    StudentService.createStudent(student)
    return student
  } else console.log('Student ' + studentNumber + ' found in database')

  let oodiLastCreditDate
  if (studentFromOodi[21] != null) {
    oodiLastCreditDate = getDate(studentFromOodi[21], 'DD.MM.YYYY')
  }
  if (oodiLastCreditDate === null ||
    oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
    console.log('No need to update student ' + studentNumber + ' information.')
    return student
  }
  
  await StudentService.updateStudent(studentFromOodi)
  
  console.log('Student ' + studentNumber + ' details updated')
  return student
}
updateStudentInformation('014272112')
