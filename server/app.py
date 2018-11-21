from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import json_util
from dotenv import load_dotenv
import os
import pickle
import numpy as np
import tensorflow as tf
from keras import backend
import pandas as pd
import json
import networkx as nx

app = Flask(__name__)
load_dotenv()
app.config["MONGO_URI"] = os.getenv('MONGO_URI')
mongo = PyMongo(app)

dimensions = [
  "SBI",
  "Organised",
  "Surface",
  "Deep",
  "SE",
  "IntRel",
  "Peer",
  "Align",
  "ConsFeed"
]

def map_old_to_new(data):
  jsonData=json.load(open('./data/oldToNew.json', 'rb'))
  oldToNew = pd.DataFrame(jsonData, index=range(len(jsonData)), columns=["old", "new"])
  oldToNew["old"] = jsonData.keys()
  oldToNew["new"] = jsonData.values()
  possible_codes = data["code"].unique()
  for code in possible_codes:
    if code in oldToNew["old"].values:
      new = oldToNew[oldToNew["old"] == code]["new"].unique()[0]
      data["code"] = data["code"].replace(code, new)
    
  return data

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'

@app.route('/calc-groups')
def calc_groups():
  pipeline = [
    { "$group": {
       "_id": "$Kysely",
       "avgSBI": { "$avg": "$SBI" },
       "avgOrganised": { "$avg": "$Organised" },
       "avgSurface": { "$avg": "$Surface" },
       "avgDeep": { "$avg": "$Deep" },
       "avgSE": { "$avg": "$SE" },
       "avgIntRel": { "$avg": "$IntRel" },
       "avgPeer": { "$avg": "$Peer" },
       "avgAlign": { "$avg": "$Align" },
       "avgConsFeed": { "$avg": "$ConsFeed" },
       "sdSBI": { "$avg": "$SBI" },
       "sdOrganised": { "$stdDevSamp": "$Organised" },
       "sdSurface": { "$stdDevSamp": "$Surface" },
       "sdDeep": { "$stdDevSamp": "$Deep" },
       "sdSE": { "$stdDevSamp": "$SE" },
       "sdIntRel": { "$stdDevSamp": "$IntRel" },
       "sdPeer": { "$stdDevSamp": "$Peer" },
       "sdAlign": { "$stdDevSamp": "$Align" },
       "sdConsFeed": { "$stdDevSamp": "$ConsFeed" }
      }
    }
  ]
  d = mongo.db.students.aggregate(pipeline)
  for values in d:
    # print(values)
    students = mongo.db.students.find({'Kysely': values['_id']})
    for student in students:
      for dimension in dimensions:
        dimension_high = values['avg' + dimension] + values['sd' + dimension]
        dimension_low = values['avg' + dimension] - values['sd' + dimension]
        if type(student[dimension]) == str:
          continue
        if student[dimension] > dimension_high:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'above'}})
        elif student[dimension] < dimension_low:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'below'}})
        else:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'average'}})
  return 'beans'

@app.route('/student/<int:studentnumber>')
def get_student(studentnumber):
  print(studentnumber)
  online_users = mongo.db.students.find_one({'Opiskelijanumero': int(studentnumber)})
  return json_util.dumps(online_users)

@app.route('/students/')
def get_students():
  studentnumbers = request.args.getlist('student[]')
  numbers = list(map(int, studentnumbers))
  students = mongo.db.students.find({'Opiskelijanumero': { "$in": numbers }})
  return json_util.dumps(students)

@app.route('/averages/')
def get_averages():
  keys = request.args.keys()
  grade_students = {}
  for key in keys:
    studentnumbers = request.args.getlist(key)
    numbers = list(map(int, studentnumbers))
    students = mongo.db.students.find({'Opiskelijanumero': { "$in": numbers }})
    row_n = students.count()
    sbi = 0
    organised = 0
    surface = 0
    deep = 0
    se = 0
    int_rel = 0
    peer = 0
    align = 0
    cons_feed = 0
    # YO! This is calculated wrong, LOL!
    # If the value is empty, i.e. string, the divider needs to be reduced by one for each empty.
    for s in students:
      sbi += (s['SBI'] / row_n) if (type(s['SBI']) != str) else 0
      organised += (s['Organised'] / row_n) if (type(s['Organised']) != str) else 0
      surface += (s['Surface'] / row_n) if (type(s['Surface']) != str) else 0
      deep += (s['Deep'] / row_n) if (type(s['Deep']) != str) else 0
      se += (s['SE'] / row_n) if (type(s['SE']) != str) else 0
      int_rel += (s['IntRel'] / row_n) if (type(s['IntRel']) != str) else 0
      peer += (s['Peer'] / row_n) if (type(s['Peer']) != str) else 0
      align += (s['Align'] / row_n) if (type(s['Align']) != str) else 0
      cons_feed += (s['ConsFeed'] / row_n) if (type(s['ConsFeed']) != str) else 0
    grade_students[key] = {
      'SBI': sbi,
      'Organised': organised,
      'Surface': surface,
      'Deep': deep,
      'SE': se,
      'IntRel': int_rel,
      'Peer': peer,
      'Align': align,
      'ConstFeed': cons_feed
    }
  return json_util.dumps(grade_students)
@app.route("/suggest_new_course")
def suggest_new_course():
  done_courses = request.args.getlist("doneCourses[]")
  done_courses = map_old_to_new(pd.DataFrame(done_courses, columns=["code"]))["code"].unique()
  g = pickle.load(open('../models/graph_pruned.sav', 'rb'))

  now = 274 # TODO GET REALTIME
  edges = []
  suggested = {}
  for course in done_courses:
    for edge in g[course]:
      if edge in done_courses or g[course][edge]["period"] < now - 8:
        continue
      weight = (g[course][edge]["weight"] + (g[course][edge]["count"] * 0.0005))
      if edge in suggested:
        if suggested[edge] > weight:
          continue
      suggested[edge] = weight
  print(suggested)
  top_three = sorted(suggested.items(), key=lambda kv: kv[1])[-3:]
  return json_util.dumps([tuplez[0] for tuplez in top_three])

@app.route('/grade_estimate')
def grade_estimate():
  """
  example request body:
  {
    "course": "TKT20002",
    "data": {
      "SBI": 1,
      "Organised": 1,
      "Surface": 1,
      "Deep": 1,
      "SE": 1,
      "IntRel": 1,
      "Peer": 1,
      "Align": 1,
      "ConsFeed": 1
    }
  }
  """
  body = request.get_json()
  course = body['course']
  data = np.array(list(body['data'].values())).reshape(1, -1)
  with backend.get_session().graph.as_default() as g:
      model = load_model(course)
      res = model.predict(np.array(data))
  return str(np.argmax(res))

@app.route('/<course_code>')
def get_cluster(course_code):
  print(course_code)
  cluster = pickle.load(open('../models/' + course_code + '_cluster.sav', 'rb'))
  return json_util.dumps(cluster)

def load_model(course):
  model = pickle.load(open('../models/' + course + '.sav', 'rb'))
  return model

if __name__ == '__main__':
  debug = os.getenv('ENV') == 'development'
  app.run("0.0.0.0", port=5000, debug=debug)