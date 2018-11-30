import pandas as pd 
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from sklearn.preprocessing import OneHotEncoder
import pickle
import tensorflow as tf 
import itertools
import re
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

def convert_to_period(semester, month):
  if (month < 4):
      period = (semester * 2 - 1)
  elif (month >= 4 and month <= 9):
    period = (semester * 2)
  elif (month < 11):
    period = (semester * 2 - 1) 
  else:
    period = semester * 2 
  return period

def bucket_dates_to_relative(attainments):
  dates = attainments[['attainmentdate', 'semester']]
  all_student_attainments = pd.DataFrame()
  i = 0
  student_len = len(attainments["studentnumber"].unique())
  for student in attainments["studentnumber"].unique():
      i = i + 1
      if i % 100 == 0:
        print("BUCKETING: ", i, "/", student_len)
      student_attainments = attainments[attainments["studentnumber"] == student]

      first = student_attainments.sort_values(["attainmentdate"]).iloc[0][["semester", "attainmentdate"]]
      date = datetime.strptime(first['attainmentdate'], "%Y-%m-%d %H:%M:%S+00")
      month = date.month
      first = convert_to_period(first["semester"], month)
      periods = []
      dates = student_attainments[['attainmentdate', 'semester']]

      for index,row in dates.iterrows():
        date = datetime.strptime(row['attainmentdate'], "%Y-%m-%d %H:%M:%S+00")
        month = date.month
        period = convert_to_period(row["semester"], month)
        periods.append(period)

      student_attainments["period"] = np.array(periods) - first + 1
      all_student_attainments = all_student_attainments.append(student_attainments)

  all_student_attainments.to_csv("./relative_period_attainments.csv")
  return all_student_attainments

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

def structure_hierarchy(attainments):
  attainments = attainments.sort_values(["period"])
  all_courses = pd.DataFrame(columns=attainments["code"].unique())
  g_all_courses = all_courses.add_suffix("_g")
  c_all_courses = all_courses.add_suffix("_c")
  hier = {}
  acual = {}
  for period in attainments["period"].unique():
    print(period, "/", len(attainments["period"].unique()))

    acual[period] = attainments[attainments["period"] == period][["code", "grade"]]
    

    hier[period] = attainments[attainments["period"] == period][["code", "grade", "studentnumber"]]
  
    grade = hier[period].groupby(['code']).mean().reset_index()
    grade = pd.concat([grade, g_all_courses], axis=1)
    grade = pd.concat([grade, c_all_courses], axis=1)
    count = hier[period].groupby(['code']).count().reset_index()
    count = count.rename(index=str, columns={"grade": "count"})
    grade = grade.drop(["studentnumber"], axis="columns")
    count = count.drop(["studentnumber"], axis="columns")

    acual[period] = pd.merge(grade, count, on="code")
    #print(acual[period])
  
    previous = attainments[attainments["period"] < period][["code", "grade", "studentnumber", "period"]]
    print("attainments: ", len(previous["code"]))
    
    for course in hier[period]["code"].unique():
      #print(course)
      grades = {}
      counts = {}
      for student in hier[period][hier[period]["code"] == course]["studentnumber"].unique():
        
        student_courses = previous[previous["studentnumber"] == student]
        
        for crs in student_courses["code"].unique():
          crs_g = student_courses[student_courses["code"] == crs]["grade"].values
          # print(crs_g)
          if len(crs_g) > 0:
            if crs + "_g" in grades:
              grades[crs + "_g"] = (grades[crs + "_g"] + crs_g[0])/2
            else:
              grades[crs + "_g"] = crs_g[0]
            if crs + "_c" in counts:
              counts[crs + "_c"] = counts[crs + "_c"] + 1
            else:
              counts[crs + "_c"] = 1

      idx = acual[period].index[acual[period]["code"] == course].tolist()[0]
      for column, count in zip(grades.keys(), counts.keys()):
        acual[period].at[idx , column] = grades[column]
        acual[period].at[idx , count] = counts[count] 
    print(acual[period])
      

  pickle.dump(acual, open("./data/hierarchical_attainments.pkl", "wb"))
  return acual

def start_acyclic_course_graph_calculation():
  try:
    attainments = pd.read_csv('./data/relative_period_attainments.csv')
  except:
    attainments = pd.read_csv('./data/CSattainments2008.csv', names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
    attainments = attainments[attainments["studymodule"] == "f"]
    attainments = map_old_to_new(attainments)
    attainments = bucket_dates_to_relative(attainments)
  g = nx.DiGraph()
  attainments["grade"] = map_grades(attainments["grade"])
  attainments["grade"] = pd.to_numeric(attainments["grade"])
  try:
    courses = pickle.load(open("./data/hierarchical_attainments.pkl", "rb"))
  except:
    courses = structure_hierarchy(attainments)
  try: 
    g = pickle.load(open("./models/graph_acyclic.sav", "rb"))
  except:
    g.add_node("start")
    g.add_nodes_from(["0_" + code for code in courses[0]["code"]])
    i = 0
    prev = ["start"]
    for period in courses:
      print("period: ", period, "/", len(courses),"| nodes: ", len(g.nodes), " edges: ", len(g.edges))
      g.add_nodes_from([str(period) + "_" + code for code in courses[period]["code"]])
      regx = r"^" + str(period) + r"_"
      for course in [x for x in g.nodes if re.search(regx, x)]:
        code = course.split("_")[1]
        # print(courses[period])
        data = courses[period][courses[period]["code"] == code]
        # print(data)
        if prev[0] == "start":
          g.add_edge("start", course , grade = data["grade"].values[0], count = data["count"].values[0]) # SO MUCH CANCER SYNTAX 
        else:
          for previous_course in prev:
            # print(data)
            if data[previous_course + "_c"].values[0] > 4:
              g.add_edge(str(period - 1) + "_" + previous_course, course, grade = data[previous_course + "_g"].values[0], count = data[previous_course + "_c"].values[0])
      prev = courses[period]["code"]
   

  pickle.dump(g, open('./models/graph_acyclic.sav', 'wb'))
  g = prune_graph(g)
  pickle.dump(g, open('./models/graph_acyclic_pruned.sav', 'wb'))
  return g


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

def suggest_route_to_graduation(done_courses=[]):
  done_courses = map_old_to_new(pd.DataFrame(done_courses, columns=["code"]))["code"].unique()
  g = pickle.load(open('./models/graph_acyclic.sav', 'rb'))
  plt.figure()
  nx.draw(g)
  plt.show()
  # def dijkstra(G, sources, target):
  #   Q = []
  #   on_route = []
  #   dist = {}
  #   prev = {}
  #   done_courses = sources
  #   source = sources[-1]
  #   # Initialize graph 
  #   for node in G.nodes:
  #     dist[node] = 99999999999
  #     prev[node] = None
  #     Q.append(node)
    
  #   dist[source] = 0

  #   while Q:
  #     least = 99999999999999
  #     u = None
  #     S = []
  #     for node in Q:
  #       tmp = dist[node]
  #       if tmp < least:
  #         u = node
  #         least = tmp
  #         if re.search(r"^3[0-9]*_TKT20013", u):
  #           print(u, prev[u])
  #           return dist, prev, u
      
  #     Q.remove(u)
  #     for v in g[u]:
  #       alt = dist[u] + (5 - g[u][v]["grade"])
  #       if alt < dist[v] and v.split("_")[1] not in on_route:
  #         dist[v] = alt
  #         prev[v] = u
  #         on_route.append(v.split("_")[1])

  # S = []
  # dist, prev, target = dijkstra(g, done_courses, "TKT20013")
  # u = target
  # # print(dist)
  # # print(prev)
  # if prev[target] or target == "start":
  #     while u:
  #       print(u)
  #       S.insert(0,u)
  #       u = prev[u]
        
  # S.insert(0, done_courses)
  # print(S)


  # def initialize(graph, source):
  #     d = {} # Stands for destination
  #     p = {} # Stands for predecessor
  #     for node in graph.nodes:
  #         d[node] = float('Inf') # We start admiting that the rest of nodes are very very far
  #         p[node] = None
  #     d[source] = 0 # For the source we know how to reach
  #     return d, p

  # def relax(node, neighbour, graph, d, p):
  #     # If the distance between the node and the neighbour is lower than the one I have now
  #     if d[neighbour] > d[node] + (5 - graph[node][neighbour]["grade"]):
  #         # Record this lower distance
  #         d[neighbour]  = d[node] + (5 - graph[node][neighbour]["grade"])
  #         p[neighbour] = node

  # def bellman_ford(graph, sources):
  #     d, p = initialize(graph, sources[-1])
  #     for i in range(len(graph)-1): #Run this until is converges
  #         for u in graph.nodes:
  #             for v in graph[u]: #For each neighbour of u
  #                 relax(u, v, graph, d, p) #Lets relax it


  #     return d, p


  
  #print(routes)
  return
if __name__ == "__main__":
  # start_grade_estimate()
  # start_clustering()
  g = start_acyclic_course_graph_calculation()
  suggest_route_to_graduation(["start"])
  print("Done.")
  exit( 1 )

