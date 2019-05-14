const { updateStudent, updateMeta } = require('./database_updater')
const { Student, Credit, Course,
    Organisation, CourseRealisationType,
    Semester, CreditType, CourseType,
    Discipline, CourseDisciplines, Teacher,
    CreditTeacher, SemesterEnrollment,
    Provider, CourseProvider, Studyright,
    StudyrightExtent, ElementDetails,
    StudyrightElement, Transfers } = require('../models/index')
const { students } = require('./test_assets/test_students')
const meta = require('./test_assets/meta')
const { sequelize, forceSyncDatabase } = require('../database/connection')
const { seedMigrations } = require('../database/seed_migrations')
const conf = require('../conf-backend')

describe('Updater works', () => {
    beforeAll(async () => {
        await forceSyncDatabase()
        await seedMigrations()

        await updateMeta(meta)
        await updateStudent(students[0])
        await updateStudent(students[1])
        await updateStudent(students[2])
    })

    afterAll(async () => {
        await sequelize.close()
    })

    describe('All metadata is written', () => {
        test('Organisations are written to database', async () => {
            const organizations = await Organisation.findAll()
            expect(organizations.length).toBe(17)
            expect(organizations.find(_ => _.code === 'H50').name.find(n => n.langcode === 'fi').text).toBe('Matemaattis-luonnontieteellinen tiedekunta')
        })

        test('Course realisation types are written to database', async () => {
            const courseRealisationTypes = await CourseRealisationType.findAll()
            expect(courseRealisationTypes.length).toBe(18)
            expect(courseRealisationTypes.map(_ => _.realisationtypecode)).not.toContain(null)
            expect(courseRealisationTypes.map(_ => _.name)[0]).toMatchObject({ en: expect.any(String), fi: expect.any(String), sv: expect.any(String) })
        })

        test('Semesters are written to database', async () => {
            const semesters = await Semester.findAll()
            expect(semesters.length).toBe(160)
            expect(semesters.map(_ => _.semestercode)).toEqual(expect.arrayContaining([...Array(160).keys()].map(_ => ++_)))
            expect(semesters.map(_ => _.name)[0]).toMatchObject({ en: expect.any(String), fi: expect.any(String), sv: expect.any(String) })
            expect(semesters.map(_ => _.startdate)).not.toContain(null)
            expect(semesters.map(_ => _.enddate)).not.toContain(null)
            expect(semesters.map(_ => _.createdAt)).not.toContain(null)
            expect(semesters.map(_ => _.updatedAt)).not.toContain(null)
            expect(new Set(semesters.map(_ => _.yearcode)).size).toBe(80)
            expect(semesters.find(_ => _.yearcode === 1).yearname).toBe('1950-51')
        })

        test('Credit types are written to database', async () => {
            const creditTypes = await CreditType.findAll()
            expect(creditTypes.length).toBe(11)
            expect(creditTypes.map(_ => _.credittypecode)).toEqual(expect.arrayContaining([expect.any(Number)]))
            expect(creditTypes.map(_ => _.name)[0]).toMatchObject({ en: expect.any(String), fi: expect.any(String), sv: expect.any(String) })
        })

        test('Course types are written to database', async () => {
            const courseTypes = await CourseType.findAll()
            expect(courseTypes.length).toBe(35)
            expect(courseTypes.map(_ => _.coursetypecode)).toEqual(expect.arrayContaining([expect.any(Number)]))
            expect(courseTypes.map(_ => _.name)[0]).toMatchObject({ en: expect.any(String), fi: expect.any(String), sv: expect.any(String) })
        })

        test('Disciplines are written to database', async () => {
            const disciplines = await Discipline.findAll()
            expect(disciplines.length).toBe(430)
            expect(disciplines.map(_ => _.discipline_id)).toEqual(expect.arrayContaining([expect.any(String)]))
            expect(disciplines.map(_ => _.name)[0]).toMatchObject({ fi: expect.any(String) })
        })

        test('Course disciplines are written to database', async () => {
            const courseDisciplines = await CourseDisciplines.findAll()
            expect(courseDisciplines.length).toBe(40)
            expect(courseDisciplines.map(_ => _.discipline_id)).not.toContain(null)
            expect(courseDisciplines.map(_ => _.course_id)).not.toContain(null)

        })

    })
    describe('Updater writes students the right way', () => {

        test('Student info is written to database', async () => {
            const students = await Student.findAll({
                order: [
                    ['studentnumber', 'DESC']]
            })
            expect(students.length).toBe(3)
            const { studentnumber, lastname, firstnames, abbreviatedname,
                birthdate, communicationlanguage, creditcount,
                dateofuniversityenrollment, city_fi, city_sv, gender_code,
                gender_fi, createdAt, updatedAt } = students[0]

            expect(studentnumber).toBe('014441008')
            expect(lastname).toBe('Orttenvuori')
            expect(firstnames).toBe('Oona')
            expect(abbreviatedname).toBe('Orttenvuori Oona')
            expect(birthdate.toISOString()).toBe(new Date('1966-04-24 00:00:00+00').toISOString())
            expect(communicationlanguage).toBe('Finnish')
            expect(creditcount).toBe(34)
            expect(dateofuniversityenrollment).toBe(null)
            expect(city_fi).toBe('HELSINKI')
            expect(city_sv).toBe('HELSINGFORS')
            expect(gender_code).toBe(2)
            expect(gender_fi).toBe('Nainen')
            expect(createdAt).not.toBe(undefined)
            expect(updatedAt).not.toBe(undefined)

            const { creditcount: creditcount1, dateofuniversityenrollment: dofue } = students[1]

            expect(creditcount1).toBe(380)
            expect(dofue.toISOString()).toBe(new Date('2003-07-31 21:00:00+00').toISOString())
        })

        test('Courses are written to database', async () => {
            const courses = await Course.findAll({ order: [['code', 'ASC']] })
            const { code, name, latest_instance_date, is_study_module, startdate, enddate, max_attainment_date, min_attainment_date, coursetypecode } = courses[0]

            expect(courses.length).toBe(147)
            expect(code).toBe('00031')
            expect(name.en).toBe('Master of Science (Agriculture and Forestry)')
            expect(latest_instance_date.toISOString()).toBe(new Date('2010-03-16 00:00:00+00').toISOString())
            expect(is_study_module).toBeTruthy()
            expect(startdate.toISOString()).toBe(new Date('1899-12-31 00:00:00+00').toISOString())
            expect(enddate.toISOString()).toBe(new Date('2112-12-20 00:00:00+00').toISOString())
            expect(max_attainment_date.toISOString()).toBe(new Date('2010-03-16 00:00:00+00').toISOString())
            expect(min_attainment_date.toISOString()).toBe(new Date('2010-03-16 00:00:00+00').toISOString())

            expect(coursetypecode).toBe(8)

            const { code: code1, is_study_module: ism, coursetypecode: ctc } = courses[6]

            expect(code1).toBe('402512')
            expect(ism).toBe(false)
            expect(ctc).toBe(2)
        })

        test('Credits are written to database', async () => {
            const allCredits = await Credit.findAll({ order: [['id', 'ASC']] })
            const { id, grade, student_studentnumber, credits, ordering, attainment_date, isStudyModule, lastmodifieddate, course_code, credittypecode, semestercode } = allCredits[0]

            expect(allCredits.length).toBe(150)
            expect(id).toBe('2340421')
            expect(grade).toBe('4')
            expect(allCredits.map(_ => _.grade)).not.toContain(null)
            expect(student_studentnumber).toBe('014441008')
            expect(credits).toBe(2)
            expect(allCredits.map(_ => _.credits)).not.toContain(null)
            expect(ordering).toBe('1997-10-21')
            expect(attainment_date.toISOString()).toBe(new Date('1997-10-21 00:00:00+00').toISOString())
            expect(isStudyModule).toBe(false)
            expect(lastmodifieddate).not.toBe(null)
            expect(course_code).toBe('65002')
            expect(allCredits.map(_ => _.course_code)).not.toContain(null)
            expect(credittypecode).toBe(4)
            expect(allCredits.map(_ => _.semestercode)).toEqual(expect.arrayContaining([expect.any(Number)]))
        })

        test('Teachers are written to database', async () => {
            const teachers = await Teacher.findAll({ order: [['name', 'ASC']] })
            const { id, code, name } = teachers[0]

            expect(teachers.length).toBe(51)
            expect(id).toBe('9016947')
            expect(code).toBe('hpyrhone')
            expect(name).toBe('Ahvenniemi Emilia')
        })

        test('Credit Teachers are written to database', async () => {
            const creditteachers = await CreditTeacher.findAll()

            expect(creditteachers.length).toBe(119)
            expect(creditteachers.map(_ => _.credit_id)).not.toContain(null)
            expect(creditteachers.map(_ => _.teacher_id)).not.toContain(null)
        })

        test('Semester enrollments are written to database', async () => {
            const semesterEnrollments = await SemesterEnrollment.findAll({ order: [['semestercode', 'ASC']] })
            const { id, enrollmenttype, enrollment_date, studentnumber, semestercode } = semesterEnrollments[0]

            expect(semesterEnrollments.length).toBe(28)
            expect(id).toEqual(expect.any(String))
            expect(enrollmenttype).toBe(1)
            expect(enrollment_date.toISOString()).toBe(new Date('2003-08-17 00:00:00+00').toISOString())
            expect(studentnumber).toBe('014272112')
            expect(semestercode).toBe(107)

        })

        test('Providers are written to database', async () => {
            const providers = await Provider.findAll({ order: [['providercode', 'DESC']] })
            const { providercode, name } = providers[0]

            expect(providers.length).toBe(20)
            expect(providercode).toBe('H906')
            expect(name).toMatchObject({ en: 'Language Centre', fi: 'Kielikeskus', sv: 'Språkcentrum' })
            expect(providers.map(_ => _.providercode)).not.toContain(null)

        })
        test('Course providers are written to database', async () => {
            const courseproviders = await CourseProvider.findAll()

            expect(courseproviders.length).toBe(123)
            expect(courseproviders.map(_ => _.coursecode)).not.toContain(null)
            expect(courseproviders.map(_ => _.providercode)).not.toContain(null)
        })

        test('Study right extent are written to database', async () => {
            const studyrightextent = await StudyrightExtent.findAll()
            const { extentcode, name, createdAt, updatedAt } = studyrightextent[0]

            expect(studyrightextent.length).toBe(2)
            expect(extentcode).toBe(1)
            expect(name.en).toBe(`Bachelor's Degree`)
            expect(createdAt).not.toBe(undefined)
            expect(updatedAt).not.toBe(undefined)
        })

        test('Study rights are written to database', async () => {
            const studyrights = await Studyright.findAll({ order: [['studyrightid', 'DESC']] })
            const { studyrightid, canceldate, cancelorganisation, enddate, givendate, graduated, highlevelname, prioritycode, startdate, studystartdate, organization_code, student_studentnumber, extentcode } = studyrights[0]

            expect(studyrights.length).toBe(4)
            expect(studyrightid).toBe('67628057')
            expect(cancelorganisation).toBe('4325')
            expect(enddate.toISOString()).toBe(new Date('2010-04-12 00:00:00+00').toISOString())
            expect(givendate.toISOString()).toBe(new Date('2004-07-31 00:00:00+00').toISOString())
            expect(graduated).toBe(1)
            expect(highlevelname).toBe('Teatteritiede')
            expect(prioritycode).toBe(30)
            expect(startdate.toISOString()).toBe(new Date('2004-07-31 00:00:00+00').toISOString())
            expect(studystartdate.toISOString()).toBe(new Date('2004-07-31 00:00:00+00').toISOString())
            expect(organization_code).toBe('4325')
            expect(student_studentnumber).toBe('011120775')
            expect(extentcode).toBe(1)

        })

        test('element details are written to database', async () => {
            const elementDetails = await ElementDetails.findAll({ order: [['code', 'DESC']] })
            const { code, name, type, createdAt, updatedAt } = elementDetails[0]

            expect(elementDetails.length).toBe(12)
            expect(code).toBe('A2004')
            expect(name.en).toBe('Government Decree (794/2004) on University Degrees')
            expect(type).toBe(15)
            expect(createdAt).not.toBe(undefined)
            expect(updatedAt).not.toBe(undefined)
        })

        test('study right elements are written to database', async () => {
            const studyrightElements = await StudyrightElement.findAll({ order: [['id', 'DESC']] })
            const { id, startdate, enddate, createdAt, updatedAt, studyrightid, code, studentnumber } = studyrightElements[0]


            expect(studyrightElements.length).toBe(21)
            expect(id).toBe(21)
            expect(startdate.toISOString()).toBe(new Date('2003-07-31 21:00:00+00').toISOString())
            expect(enddate.toISOString()).toBe(new Date('2010-07-30 21:00:00+00').toISOString())
            expect(createdAt).not.toBe(undefined)
            expect(updatedAt).not.toBe(undefined)
            expect(studyrightid).toBe('62346253')
            expect(code).toBe('0394')
            expect(studentnumber).toBe('014272112')

        })
        test('transfers are written to database', async () => {
            const transfers = await Transfers.findAll()
            const { id, transferdate, createdAt, updatedAt, studentnumber, studyrightid, sourcecode, targetcode } = transfers[0]

            expect(transfers.length).toBe(1)
            expect(id).toBe(1)
            expect(transferdate.toISOString()).toBe(new Date('2009-07-30 21:00:00+00').toISOString())
            expect(createdAt).not.toBe(undefined)
            expect(updatedAt).not.toBe(undefined)
            expect(studentnumber).toBe('014272112')
            expect(studyrightid).toBe('62346253')
            expect(sourcecode).toBe('820016')
            expect(targetcode).toBe('820042')

        })
    })
    describe('Updater updates existing students correctly', () => {
        beforeAll(async () => {
            const { studentInfo, studyRights, studyAttainments } = students[0]
            students[0].studentInfo = {
                ...studentInfo,
                email: 'Calgary.Flames@NHLonJätettä.fi',
                mobile: '0400521981',
                address: 'Yliopistonkatu 4',
                creditcount: 322,
                age: 41,
                lastname: 'Tauriainen',
                gender_code: 1,
                abbreviatedname: 'Tauriainen Maria Helena'
            }
            const newCredit = {
                id: 'ayyyyylmao',
                grade: '5',
                credits: 5,
                ordering: '2019.05.04',
                credittypecode: 1,
                student_studentnumber: '011120775',
                attainment_date: new Date(),
                course_code: '420_666',
                semestercode: 138,
                isStudyModule: false
            }
            const newCourse = {
                code: '420_666',
                name: {
                    fi: 'Kaljan juonti',
                    en: 'Beer drinking',
                    sv: 'dryckade öl'
                },
                latest_instance_date: new Date(),
                is_study_module: false,
                coursetypecode: 1,
                disciplines: [],
                startdate: new Date(),
                enddate: new Date(),
                providers: [],
                courseproviders: []
            }

            const newCreditTeachers = [
                {
                    credit_id: 'ayyyyylmao',
                    teacher_id: '9016417'
                }
            ]
            const newAttainment = { credit: newCredit, creditTeachers: newCreditTeachers, course: newCourse }
            students[0].studyAttainments = [
                ...studyAttainments,
                newAttainment,
                {
                    ...students[1].studyAttainments[2],
                    creditTeachers: [],
                    credit: {
                        ...students[1].studyAttainments[2].credit,
                        id: 'Kvas',
                        student_studentnumber: '011120775'
                    }
                }
            ]
            students[0].studyAttainments[2] = {
                ...students[0].studyAttainments[2],
                credit: {
                    ...students[0].studyAttainments[2].credit,
                    grade: '0'
                }
            }
            const newStudyRight = { ...studyRights[0], studyright: { ...studyRights[0].studyright, highlevelname: 'Kaljatiede' } }
            students[0].studyRights = [newStudyRight]

            await updateStudent(students[0])

        })

        test('StudentInfo for existing student is updated correclty', async () => {
            const updatedStudent = await Student.findOne({
                where: {
                    studentnumber: '011120775'
                }
            })
            const { studentnumber, lastname, abbreviatedname,
                gender_code, email, age, gender_fi, address, mobile } = updatedStudent

            expect(studentnumber).toBe('011120775')
            expect(lastname).toBe('Tauriainen')
            expect(abbreviatedname).toBe('Tauriainen Maria Helena')
            expect(email).toBe('Calgary.Flames@NHLonJätettä.fi')
            expect(gender_code).toBe(1)
            expect(gender_fi).toBe('Nainen')
            expect(age).toBe(41)
            expect(address).toBe('Yliopistonkatu 4')
            expect(mobile).toBe('0400521981')

        })
        test('Existing courses are updated (not duplicated) in database', async () => {
            const courses = await Course.findAll({ order: [['code', 'ASC']] })
            const newCourse = courses.find(_ => _.code === '420_666')
            expect(courses.length).toBe(148)

            expect(newCourse).not.toBe(undefined)

        })

        test('Updating credits works', async () => {
            const allCredits = await Credit.findAll({ order: [['id', 'ASC']] })
            const updatedCredit = allCredits.find(_ => _.id === students[0].studyAttainments[2].credit.id)
            expect(allCredits.length).toBe(152)
            expect(updatedCredit.grade).toBe('0')
        })

        test('Studyrights are rewritten', async () => {
            const updatedStudyRights = await Studyright.findAll({
                where: {
                    student_studentnumber: '011120775'
                }
            })
            expect(updatedStudyRights.length).toBe(1)
            expect(updatedStudyRights[0].highlevelname).toBe('Kaljatiede')
            // theres really not a lot to test here since everything related to studyrights are just rewritten
        })


    })

})
