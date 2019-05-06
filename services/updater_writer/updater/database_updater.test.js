const { updateStudent } = require('./database_updater')
const { Student } = require('../models/index')
const { students } = require('./test_assets/test_students')
const { sequelize } = require('../database/connection')

describe('Updater writes students the right way', () => {
    beforeAll(async () => {
        const fuck = await updateStudent(students[0])
        console.log(fuck)
        await updateStudent(students[1])
        await updateStudent(students[2])
    })
    afterAll(async () => {
        await sequelize.close()
      })
    test('Student info is written to database', async () => {
        const students = await Student.findAll({
            order: [
                ['studentnumber', 'DESC']]
        })
        expect(students.length).toBe(3)
        const { studentnumber, lastname, firstnames, abbreviatedname,
             birthdate, communicationlanguage,  creditcount,
              dateofuniversityenrollment, city_fi, city_sv, gender_code,
               gender_fi, createdAt, updatedAt }= students[0]

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
        expect(dofue.toISOString()).toBe(String(new Date('2003-07-31 21:00:00+00').toISOString()))
    })
    
})
