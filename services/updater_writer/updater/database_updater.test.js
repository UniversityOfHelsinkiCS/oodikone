const { updateStudent } = require('./database_updater')
const testStudent = require('./test_student')

test('Student is written to database', async () => {
    await updateStudent(testStudent)  
})
