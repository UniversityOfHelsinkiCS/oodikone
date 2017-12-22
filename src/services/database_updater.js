//const Sequelize = require('sequelize')
//const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
//const { formatStudent } = require('../services/students')
//const Op = Sequelize.Op
const axios = require('axios')
require('dotenv').config()


axios.defaults.auth = {
    username:'tktl',
    password: process.env.OODI_PW
}

const url = process.env.OODI_ADDR + '/students/013737399'
axios.get(url)
  .then(response => {
    console.log(response)
  })
  .catch(error => {
    console.log("asd")
  })


