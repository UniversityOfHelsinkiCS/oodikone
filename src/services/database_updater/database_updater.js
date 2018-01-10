const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../../models')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const OrganisationService = require('../organisations')
const { getDate } = require('./oodi_data_mapper')
const CourseService = require('../courses')
const Op = Sequelize.Op
const Oi = require('./oodi_interface')


let minStudentNumber = 1420000
let maxStudentNumber = 1500000
console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

const updateStudentInformation = async studentNumber => {
  if(studentNumber == '014424850') return
  let student = await loadAndUpdateStudent(studentNumber)
  if (student === null) {
    return
  }
  updateStudentStudyRights(student)
  // updateStudentCredits(student)
  return
}

const updateStudentStudyRights = async student => {
  const oodiStudentStudyRights = await Oi.getStudentStudyRights(student.studentnumber)
  const studentStudyRights = await StudyrightService.byStudent(student.studentnumber).map(studyright => studyright.dataValues)
  if (oodiStudentStudyRights.length === studentStudyRights.length) {
    return
  }
  //not the best solution so far 
  const studentStudyRightIds = studentStudyRights.map(sr => sr.studyrightid)

  oodiStudentStudyRights.forEach(async studyRight => {
    if (!studentStudyRightIds.includes(studyRight.studyRightId)) {
      let organisation = await OrganisationService.byCode(studyRight.organisation)
      if (organisation === null) {
        organisation = await Oi.getOrganisation(studyRight.organisation_code)
        OrganisationService.createOrganisation(organisation)
      }
      studyRight.organisation = organisation.code
      studyRight.student = student.studentnumber

      StudyrightService.createStudyright(studyRight)
      console.log('Student ' + student.studentnumber + ': new studyright added')
    }
  })
}

const updateStudentCredits = async student => {
  // get credits from Oodi
  let studentCourseCredits = await Oi.getStudentCourseCredits(student.studentnumber)

  await student.getCredits().then(studentOldCredits => {
    if (studentOldCredits.lenght === studentCourseCredits.length) {
      console.log('Student: ' + student.studentnumber + ' no need to update credits')
      return
    }
  })
  console.log('Student: ' + student.studentnumber + ' updating credits')
  studentCourseCredits.forEach(async credit => {
    // check for each credit whether oodikone db already has it
    if (!studentAlreadyHasCredit(student, credit)) {
      let creditCourseCode = credit.courseInstance.course.courseCode
      let date = getDate(credit.courseInstance.date)
      let instance = await CourseService.courseInstanceByCodeAndDate(creditCourseCode, date)
      // WORKS UNTIL HERE
      // if the course doesn't exist and the instance doesn't exist, handle those.
      let course = await CourseService.bySearchTerm(instance.course_code)
      if (course === null) {
        /* something like this?
        course = credit.getCourseInstance().then(instance => {
          instance.getCourse().then(() => {})
        })
        course.save()
        */
      }
      //await credit.getCourseInstance().then(instance => {
      //instance.setCourse(course)
      //})

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
      return
      await credit.setCourseInstance(courseInstance)
      await credit.getCourseInstance().then(() => setCourse(course))

      await credit.setStudent(student)
      await credit.save()

      await courseInstance.addCredit(credit)
      await courseInstance.save()
    }
  })
  //await student.save()
}

const studentAlreadyHasCredit = (student, credit) => {
  // get the course code of the credit from Oodi
  let creditCode = credit.courseInstance.course.courseCode
  student.getCredits().then(credits => {
    credits.forEach(async studentCredit => {
      let instance = await CourseInstance.findById(studentCredit.courseinstance_id)
      // get the course code from credit in oodikone db
      let instanceCode = instance.course_code
      // compare codes and grades
      if (creditCode === instanceCode && credit.grade === studentCredit.grade) {
        return true
      }
    })
  })
  return false
}

const loadAndUpdateStudent = async studentNumber => {
  let student = await StudentService.byId(studentNumber)
  
  let studentFromOodi = await Oi.getStudent(studentNumber)
  if (studentFromOodi == null) {
    return null
  }
  if (student == null) {
    StudentService.createStudent(student)
    return student
  }
  console.log(getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD'))
  console.log(getDate(studentFromOodi[21], 'DD.MM.YYYY'))
  let oodiLastCreditDate
  if (studentFromOodi[21] != null) {
    oodiLastCreditDate = getDate(studentFromOodi[21], 'DD.MM.YYYY')
  }
  if (oodiLastCreditDate == null ||
    oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
    return student
  }

  await StudentService.updateStudent(studentFromOodi)

  console.log('Student: ' + studentNumber + ' details updated')
  return student
}
// updateStudentInformation('0142712')

// updateStudentInformation('014349281')


const getStudentNumberChecksum = studentNumber => {
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumber.length; i++) {
    // go from end t start
    let currentNumber = studentNumber[studentNumber.length - (i + 1)]
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}


const run = async () => {

  for (let i = minStudentNumber; i < maxStudentNumber; i++) {
    let studentNumber = '0' + i + getStudentNumberChecksum(String(i))

    await updateStudentInformation(studentNumber)
  }

} 

run()