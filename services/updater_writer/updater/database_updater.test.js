const { updateStudent, updateMeta } = require('./database_updater')
const { Student, Credit, Course, Organisation, CourseRealisationType, Semester, CreditType, CourseType, Discipline, CourseDisciplines } = require('../models/index')
const { students } = require('./test_assets/test_students')
const meta = require('./test_assets/meta')
const { sequelize, forceSyncDatabase } = require('../database/connection')
const { seedMigrations } = require('../database/seed_migrations')


describe('Updater writes students the right way', () => {
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
        const allCredits = await Credit.findAll({ order: [['id', 'ASC']]})
        const { id, grade, student_studentnumber, credits, ordering, attainment_date, isStudyModule,  lastmodifieddate, course_code, credittypecode, semestercode } = allCredits[0]

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
    

})
