import pandas as pd 
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from sklearn.preprocessing import OneHotEncoder
import pickle
import tensorflow as tf 
import itertools

from keras.models import Sequential
from sklearn.manifold import TSNE
from datetime import datetime
import json
from keras.layers import Dense, Dropout
import networkx as nx

def get_courses(data):
  return (data["code"].unique())

def get_course_data(data, course_code, return_labels=False):
  course_data = data[(data["code"] == course_code) & (data["studymodule"] == "f")]
  
  course_data = course_data.drop(axis=1, columns=[ "studymodule", "code", "credits"])
  X = course_data.drop(axis=1, columns=["grade"])
  X = X.replace(" ", 2.5)
  X = X.apply(pd.to_numeric)
  y = course_data["grade"]
  y = y.replace("Hyl.", 0)
  y = y.replace("Luop.", 0)
  y = y.replace("Luop", 0)
  y = y.replace("Eisa", 0)
  y = y.replace("Eisa.", 0)
  y = y.replace("Hyv.", 5)
  y = y.replace("TT", 2)
  y = y.replace("HT", 4)
  y = y.replace("ECLA", 4)
  y = y.replace("MCLA", 3)
  y = y.replace("L", 5)
  y = y.apply(pd.to_numeric)
  studentnumbers = X["studentnumber"]
  if return_labels:
    return(X, y,  studentnumbers, course_code)
  X = X.drop("studentnumber", axis="columns")
  return(X, y, course_code)


def cluster(X, y, studentnumbers, name,  verbose=False):
  if len(y.unique()) < 3 or X.shape[0] <= 80 :
    if verbose:
      print(f"Course: {name} | only one class or not enough samples, nothing to learn.")
    return(None)
  print(f"Clustering {name}")
  X = X.drop("studentnumber", axis="columns")
  X_embedded = TSNE(n_components=2, init="pca").fit_transform(X)

  dicti = {
    'course': {
      'name': name,
      'points': np.array(X_embedded).tolist(),
      'grades': np.array(y).tolist(),
      'students': np.array(studentnumbers).tolist()
      }
    }
  pickle.dump(dicti, open('./models/' + name + '_cluster.sav', 'wb'))
  return(dicti)

def grade_estimate(X, y, name, n=10, verbose=False):
  if np.unique(y).size <= 1 or X.shape[0] <= 80 :
    if verbose:
      print(f"Course: {name} | only one class or not enough samples, nothing to learn.")
    return(None)

  #rbf_feature = RBFSampler(gamma=1)
  #X_features = rbf_feature.fit_transform(X)
  model = Sequential()
  model.add(Dense(units=128, activation='relu', input_shape=(9,)))
  model.add(Dense(units=256, activation='relu'))
  model.add(Dropout(0.2))
  model.add(Dense(units=256, activation='relu'))
  model.add(Dropout(0.2))
  model.add(Dense(units=128, activation='relu'))
  model.add(Dense(units=6, activation='sigmoid'))
  model.compile(loss='mean_squared_error',
              optimizer='sgd',
              metrics=['accuracy'])
  counts = np.bincount(y)
  most_common_grade = np.argmax(counts)
  accuracies = []
  rand_accuracies = []
  common_accuracies = []
  advantages = []
  while True:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    if np.unique(y_train).size <= 1 or X_train.shape[0] == 0: # fucked up split
      continue
    break

  labels = [0,1,2, 3, 4, 5]
  dummies = pd.get_dummies(y_train)
  y_train = dummies.T.reindex(labels).T.fillna(0) # Magic to keep one-hot-encoding fixed to categories
  model.fit(np.array(X_train), np.array(y_train), epochs=1000, batch_size=16, verbose=0)
  pred = model.predict(X_test)
  pred = [np.argmax(arr) for arr in pred]
  if verbose:
    print("pred: ", pred)
    print("real: ", np.array(y_test).reshape(1, -1)[0])
    print("SAME: [", ' '.join(["t" if a == b else "f" for a, b in zip(pred, np.array(y_test).reshape(1, -1)[0])]), "]")
    print("----------------------------------------")
  random_pred = np.random.choice([0, 1, 2, 3, 4, 5], y_test.size, replace=True)
  common_accuracy = mean_squared_error(np.repeat(most_common_grade, y_test.size), y_test)
  real_accuracy = mean_squared_error(pred, y_test)
 
  baseline_accuracy = mean_squared_error(random_pred, y_test)
  accuracies.append(real_accuracy)
  rand_accuracies.append(baseline_accuracy)
  common_accuracies.append(common_accuracy)
  advantages.append(real_accuracy - baseline_accuracy)
    
  print(f"Course:  {name} | "
        f"Samples:  {len(X_train)} | "
        f"prediction loss:  {np.average(accuracies):.3f} | "
        f"random loss: {np.average(rand_accuracies):.3f} | "
        f"common loss: {np.average(common_accuracies):.3f} | "
        f"advantage: {np.average(advantages):.3f}")
  pickle.dump(model, open('./models/' + name + '.sav', 'wb'))
  if len(accuracies) == 0:
    return(None)
  return(model)

def start_grade_estimate():
  print("Starting grade estimation models...")
  questionnaires = pd.read_csv("./data/combined.csv", header=0)
  attainments = pd.read_csv("./data/attainments.csv", names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
  merged = pd.merge(questionnaires, attainments, left_on="Opiskelijanumero", right_on="studentnumber")
  data = merged[["studentnumber", "SBI", "Organised", "Surface", "Deep", "SE", "IntRel", "Peer", "Align", "ConsFeed", "credits", "code", "studymodule", "grade"]]
  mayhem = [grade_estimate(* get_course_data(data, course_code)) for course_code in get_courses(data)]
  return

def start_clustering():
  print("Starting population clustering...")
  questionnaires = pd.read_csv("./data/raw_questionanire.csv", header=0)
  questionnaires = questionnaires.drop(["Kysely", "Arviointimenetelmä", "Tyypillinenopis.määrä", "KAndipalaute53", "Kandipalaute54", "Kandipalaute55"], axis="columns")
  attainments = pd.read_csv("./data/attainments.csv", names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
  merged = pd.merge(questionnaires, attainments, left_on="Opiskelijanumero", right_on="studentnumber")
  data = merged.drop(["Opiskelijanumero", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "semester", "id"], axis="columns")
  data = data.dropna(thresh=(data.shape[1] - 5))
  data = data.fillna(3)
  mayhem = [cluster(* get_course_data(data, course_code, True)) for course_code in get_courses(data)]
  return
def map_grades(grades):
  grades = grades.replace("Hyl.", 0)
  grades = grades.replace("Luop.", 0)
  grades = grades.replace("Luop", 0)
  grades = grades.replace("Eisa", 0)
  grades = grades.replace("Eisa.", 0)
  grades = grades.replace("Hyv.", 5)
  grades = grades.replace("TT", 2)
  grades = grades.replace("HT", 4)
  grades = grades.replace("ECLA", 4)
  grades = grades.replace("MCLA", 3)
  grades = grades.replace("L", 5)
  grades = grades.replace("CL", 2)
  grades = grades.replace("LUB", 1)
  grades = grades.replace("NSLA", 1)
  return grades

def bucket_dates(attainments):
  dates = attainments[['attainmentdate', 'semester']]

  periods = []
  for index,row in dates.iterrows():
    date = datetime.strptime(row['attainmentdate'], "%Y-%m-%d %H:%M:%S+00")
    month = date.month
    if (month < 4):
      period = row["semester"] * 2 - 1
    elif (month >= 4 and month <= 9):
      period = row["semester"] * 2
    elif (month < 11):
      period = row["semester"] * 2 - 1
    else:
      period = row["semester"] * 2
    periods.append(period)
    
  attainments["period"] = np.array(periods)
  return attainments

def prune_graph(g):
  edges_to_remove = []
  for edge in g.edges:
    if g[edge[0]][edge[1]]["count"] < 20: # mean == 19.5
      edges_to_remove.append(edge)
  g.remove_edges_from(edges_to_remove)

  nodes_to_remove = []
  for node in g.nodes:
    counts = 0
    for edges in g.in_edges(node):
      counts += g[edges[0]][edges[1]]['count']
    for edges in g.out_edges(node):
      counts += g[edges[0]][edges[1]]['count']
    if counts < 50:
      nodes_to_remove.append(node)
  g.remove_nodes_from(nodes_to_remove)

  return(g)

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

def start_course_graph_calculation():
  attainments = pd.read_csv('./data/CSattainments2008.csv', names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
  attainments = attainments[attainments["studymodule"] == "f"]
  attainments= map_old_to_new(attainments)
  attainments = bucket_dates(attainments)

  g = nx.DiGraph()
  courses = attainments["code"].unique()
  attainments["grade"] = map_grades(attainments["grade"])
  attainments["grade"] = pd.to_numeric(attainments["grade"])
  g.add_nodes_from(courses)
  studentnumbers = attainments['studentnumber'].unique()
  i = 0
  for student in studentnumbers:
    student_attainments = attainments[attainments["studentnumber"] == student]
    student_attainments = student_attainments.sort_values(["period"])
    first = pd.Series()
    
    for period in student_attainments["period"].unique():
      #print(attainment)
      if first.empty:
        first = student_attainments[student_attainments["period"] == period]["code"]
        continue

      second = student_attainments[student_attainments["period"] == period]["code"]
      weight = 0
      count = 1
      #print(first, second)
      #print(g.edges)
      for codea in first:
        for codeb in second:

          if (codea, codeb) in g.edges:
            weight = g[codea][codeb]["weight"]
            count = g[codea][codeb]["count"] + 1
          course = student_attainments[(student_attainments["code"] == codeb) & (student_attainments["period"] == period)]
          g.add_edge(codea, codeb, weight= (weight + max(course["grade"])) / 2, count=count, period=np.max(attainments[attainments["code"] == codeb]["period"]))

        first = student_attainments[student_attainments["period"] == period]["code"]
    if i % 500 == 0:
      print("student: ", i, " / ", len(studentnumbers), "edges: ", len(g.edges))
    i += 1
  print(len(g.edges))
  
  pickle.dump(g, open('./models/graph.sav', 'wb'))
  g = prune_graph(g)
  pickle.dump(g, open('./models/graph_pruned.sav', 'wb'))
  return g

def suggest_next_course(done_courses=[]):
  done_courses = map_old_to_new(pd.DataFrame(done_courses, columns=["code"]))["code"].unique()
  print(done_courses)
  g = pickle.load(open('./models/graph_pruned.sav', 'rb'))
  attainments = pd.read_csv('./data/CSattainments2008.csv', names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
  attainments = map_old_to_new(attainments)
  attainments = bucket_dates(attainments)

  now = np.max(attainments["period"])
  print(now)
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
      
  top_three = sorted(suggested.items(), key=lambda kv: kv[1])[-3:]
  return [tuplez[0] for tuplez in top_three]

if __name__ == "__main__":
  start_grade_estimate()
  start_clustering()
  g = start_course_graph_calculation()
  print("Done.")
  exit( 1 )

