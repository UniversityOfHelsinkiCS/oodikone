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
  define: {
    underscored: true
  }
})

router.get('/', async (req, res) => {
  const result = await initModels(sequelize).Student.findOne({ where: { studentnumber: '' }, logging: console.log })
  return res.send(JSON.stringify(result))
})

module.exports = router
