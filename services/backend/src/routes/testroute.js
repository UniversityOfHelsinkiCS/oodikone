const router = require('express').Router()
const _ = require('lodash')

const { initModels } = require('../models/init-models')
const { Sequelize } = require('sequelize')

export const sequelize = new Sequelize({
  username: 'postgres',
  dialect: 'postgres',
  database: 'sis-db',
  host: 'sis-db',
  port: 5432,
  logging: false,
})

router.get('/', async (req, res) => {
  const results = []

  await initModels(sequelize).CourseTypes.findOne({ logging: console.log })
  await initModels(sequelize).Credit.findOne({ logging: console.log })
  await initModels(sequelize).Enrollment.findOne({ logging: console.log })
  await initModels(sequelize).ElementDetails.findOne({ logging: console.log })
  await initModels(sequelize).Migrations.findOne({ logging: console.log })
  await initModels(sequelize).ProgrammeModuleChildren.findOne({ logging: console.log })
  await initModels(sequelize).CreditTeachers.findOne({ logging: console.log })
  await initModels(sequelize).Organization.findOne({ logging: console.log })
  await initModels(sequelize).ProgrammeModules.findOne({ logging: console.log })
  await initModels(sequelize).SemesterEnrollments.findOne({ logging: console.log })
  await initModels(sequelize).Semesters.findOne({ logging: console.log })
  await initModels(sequelize).SisStudyRightElements.findOne({ logging: console.log })
  await initModels(sequelize).SisStudyRights.findOne({ logging: console.log })
  await initModels(sequelize).Student.findOne({ logging: console.log })
  await initModels(sequelize).Studyplan.findOne({ logging: console.log })
  await initModels(sequelize).Studyright.findOne({ logging: console.log })
  await initModels(sequelize).SisStudyRightElements.findOne({ logging: console.log })
  await initModels(sequelize).StudyrightExtents.findOne({ logging: console.log })
  await initModels(sequelize).SisStudyRightElements.findOne({ logging: console.log })
  await initModels(sequelize).Teacher.findOne({ logging: console.log })
  await initModels(sequelize).Transfers.findOne({ logging: console.log })

  return res.send()
})

module.exports = router
