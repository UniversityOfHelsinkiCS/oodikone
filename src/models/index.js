const Sequelize = require('sequelize')

const sequelize = new Sequelize('tkt_oodi', 'tkt_oodi', process.ENV.PW, {
  host: 'localhost',
  dialect:'postgres',
});


const Student = sequelize.define('student', 
  {
    studentnumber: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    lastname: { type: Sequelize.STRING },
    firstnames: { type: Sequelize.STRING },
    abbreviatedname: { type: Sequelize.STRING },
    birthdate: { type: Sequelize.DATE },
    communicationlanguage: { type: Sequelize.STRING },
    country: { type: Sequelize.STRING },                    
    creditcount: { type: Sequelize.INTEGER },
    dateoffirstcredit: { type: Sequelize.DATE },
    dateoflastcredit: { type: Sequelize.DATE },
    dateofuniversityenrollment: { type: Sequelize.DATE },
    gradestudent: { type: Sequelize.STRING },
    matriculationexamination: { type: Sequelize.STRING },
    nationalities: { type: Sequelize.STRING },
    semesterenrollmenttypecode: { type: Sequelize.STRING },
    sex: { type: Sequelize.STRING },
    studentstatuscode: { type: Sequelize.INTEGER },    
  },
  {
    tableName: 'student',
    timestamps: false,  
  }
);

const Credit = sequelize.define('credit', 
  {
    id: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    grade: { type: Sequelize.STRING },
    student_studentnumber: { type: Sequelize.STRING },
    credits: { type: Sequelize.DOUBLE },
    ordering: { type: Sequelize.STRING },
    status: { type: Sequelize.STRING },
    statuscode: { type: Sequelize.STRING },
    courseinstance_id: { type: Sequelize.BIGINT },    
  },
  {
    tableName: 'credit',
    timestamps: false,  
  }
);

const Studyright = sequelize.define('studyright', 
  {
    studyrightid: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    canceldate: { type: Sequelize.DATE },
    cancelorganisation: { type: Sequelize.STRING },
    enddate: { type: Sequelize.DATE },
    extentcode: { type: Sequelize.INTEGER },
    givendate: { type: Sequelize.DATE },
    graduated: { type: Sequelize.INTEGER },
    highlevelname: { type: Sequelize.STRING },
    prioritycode: { type: Sequelize.INTEGER },
    startdate: { type: Sequelize.DATE },
    studystartdate: { type: Sequelize.DATE },
    organization_code: { type: Sequelize.STRING },
    student_studentnumber: { type: Sequelize.STRING },
  },
  {
    tableName: 'studyright',
    timestamps: false,  
  }
);

Credit.belongsTo(Student, {foreignKey: 'student_studentnumber', targetKey: 'studentnumber'});
Student.hasMany(Credit, {foreignKey: 'student_studentnumber', sourceKey: 'studentnumber'});

Studyright.belongsTo(Student, {foreignKey: 'student_studentnumber', targetKey: 'studentnumber'});
Student.hasMany(Studyright, {foreignKey: 'student_studentnumber', sourceKey: 'studentnumber'});

module.exports = {Student, Credit, Studyright, sequelize}