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
from operator import itemgetter
import itertools


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
  jsonData=json.load(open('../data/oldToNew.json', 'rb'))
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

# This is to calculate the different groups
# It will assign each student to "above", "below" and "average" group on each dimension.
# Use this for what the fuck group comparisons.
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
      "sdSBI": { "$stdDevSamp": "$SBI" },
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
  mongo.db.populations.drop()
  for values in d:
    # print(values)
    population = {}
    population['population'] = values['_id']
    population['n'] = mongo.db.students.count({'Kysely': values['_id']})
    for dimension in dimensions:
      population[dimension] = {}
      average = values['avg' + dimension]
      sd = values['sd' + dimension]
      dimension_high = average + sd
      dimension_low = average - sd
      population[dimension]['average'] = average
      population[dimension]['below'] = dimension_low
      population[dimension]['above'] = dimension_high

    students = mongo.db.students.find({'Kysely': values['_id']})
    for student in students:
      for dimension in dimensions:
        average = values['avg' + dimension]
        sd = values['sd' + dimension]
        dimension_high = average + sd
        dimension_low = average - sd
        if type(student[dimension]) == str:
          continue
        if student[dimension] > dimension_high:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'above'}})
        elif student[dimension] < dimension_low:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'below'}})
        else:
          mongo.db.students.update_one({'_id': student['_id']}, {'$set': {dimension + 'Group': 'average'}})
    mongo.db.populations.insert_one(population)
  return 'beans'

@app.route('/groups/<string:population>')
def get_groups(population):
  students = mongo.db.students.find({'Kysely': population})
  data = {}
  data['students'] = []
  for student in students:
    student_data = {}
    student_data['studentnumber'] = student['Opiskelijanumero']
    for dim in dimensions:
      try:
        student_data[dim] = { 'value': student[dim], 'group': student[dim + 'Group'] }
      except:
        student_data[dim] = { 'value': '', 'group': '' }
    data['students'].append(student_data)
  data['dimensions'] = mongo.db.populations.find_one({'population': population})
  return json_util.dumps(data)

@app.route('/student/<int:studentnumber>')
def get_student(studentnumber):
  print(studentnumber)
  online_users = mongo.db.students.find_one({'Opiskelijanumero': int(studentnumber)})
  return json_util.dumps(online_users)

@app.route('/populations/')
def get_populations():
  populations = mongo.db.populations.find()
  return json_util.dumps(populations)

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
  period = request.args.get("period")
  if not period:
    period = 274
  done_courses = map_old_to_new(pd.DataFrame(done_courses, columns=["code"]))["code"].unique()
  g = pickle.load(open('../models/graph_pruned.sav', 'rb'))

  now = int(period) # 274 # TODO GET REALTIME
  edges = []
  suggested = {}
  for course in done_courses:
    for edge in g[course]:
      if edge in done_courses or g[course][edge]["period"] < now - 8 or edge.startswith('AY'):
        continue
      weight = (g[course][edge]["weight"] + (g[course][edge]["count"] * 0.01))
      if edge in suggested:
        if suggested[edge] > weight:
          continue
      suggested[edge] = weight
  # print(suggested)
  top_three = sorted(suggested.items(), key=lambda kv: kv[1])[-7:]
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

@app.route('/suggest_route_to_graduation')
def suggest_route_to_graduation(done_courses=[]):
  done_courses = map_old_to_new(pd.DataFrame(done_courses, columns=["code"]))["code"].unique()
  g = pickle.load(open('../models/graph_acyclic.sav', 'rb'))
  compulsory = pd.read_json("../data/degree_structure.json")
  compulsory = compulsory["CS"].map(lambda x: x["courses"] if 'courses' in x else [x[0]["courses"], x[1]["courses"]])
  compulsory = compulsory[0] + compulsory[1] + compulsory[2] + compulsory[3][0] + compulsory[3][1]
  
  def find_path(graph, start, path=[]):
    path = path + [start]
    s = start
    top_three = ["none", "none", "none"]
    top_three_v = [-100,-100,-100]
    top_comp = {}
    # Initialize dict with arrays for each compulsory course
    for comp in compulsory:
      top_comp[comp] = []
    # Initialize the top three courses for first period. Why? How?
    for v in graph[s]:
      if v not in path and any(graph[s][v]["grade"] > i for i in top_three_v) and len(graph[v]) > 0:
        idx = np.argmin(top_three_v)
        top_three[idx] = v
        top_three_v[idx] = graph[s][v]["grade"]
    path = path + top_three

    def naive_bois(path, graph, i):
      top_three = ["none", "none", "none"]
      top_three_v = [-100,-100,-100]
      for v in path[-3:-1]:
        if v == "none":
          continue
        for pot in graph[v]:
          period = pot.split("_")[0]
          course_name = pot.split("_")[1]
          grade = graph[v][pot]["grade"]
          count = graph[v][pot]["count"]
          grade += count * 0.05
          # if re.search(r"^3[0-9]_TKT20014", pot):
          #   return path + [pot]

          if course_name in compulsory:
            top_comp[course_name] = top_comp[course_name] + [(grade + count * 0.05, period, count)]

          if course_name not in [z.split("_")[1] for z in path[1:]] and any(grade > i for i in top_three_v) and len(graph[pot]) > 0 and pot not in top_three:
              idx = np.argmin(top_three_v)
              top_three[idx] = pot
              top_three_v[idx] = grade
        
      path = path + [y for y in top_three if y != "none"]
      if i  == 13:
        return path
      return naive_bois(path, graph, i + 1)
      
    path = naive_bois(path, graph, 0)

    for key in top_comp.keys():
      filtered = [x for x in top_comp[key] if x[2] > 4]
      top_comp_options = [(k, max(g, key=lambda a: a[0])) for k, g in itertools.groupby(filtered, itemgetter(1))]
      top_comp[key] = top_comp_options
    sorted_top_comp = sorted(top_comp.keys(), key=lambda a: len(top_comp[a]))
    for c in path:
      course = c.split("_")
      if len(course) > 1 and course[1] in sorted_top_comp:
        sorted_top_comp.remove(course[1])
    # print(sorted_top_comp)
    for comp_course in sorted_top_comp:
      cur_course = top_comp[comp_course]
      handled = False
      for period in cur_course:
        if handled:
          break
        for path_i, path_course in enumerate(path):
          pc = path_course.split("_")
          if pc[0] == period[0] and pc[1] not in sorted_top_comp:
            handled = True
            path[path_i] = period[0] + "_" + comp_course
            break
    # print(path)
    return path

  path = find_path(g,"start")
  # print(path)
  #print(routes)
  return json_util.dumps(path)

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