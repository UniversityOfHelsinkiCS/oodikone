import pandas as pd 
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.kernel_approximation import RBFSampler
from sklearn.metrics import accuracy_score
import pickle

def get_courses(data):
  return (data["code"].unique())

def get_course_data(data, course_code):
  course_data = data[(data["code"] == course_code) & (data["studymodule"] == "f")]
  course_data = course_data.drop(axis=1, columns=["studentnumber", "studymodule", "code", "credits"])
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
  y = y.replace("L", 5)
  y = y.apply(pd.to_numeric)
  return(X, y, course_code)


def train(X, y, name, n=10, verbose=False):
  if np.unique(y).size <= 1 or X.shape[0] <= 50 :
    if verbose:
      print(f"Course: {name} | only one class or not enough samples, nothing to learn.")
    return(None)
  rbf_feature = RBFSampler(gamma=1)
  X_features = rbf_feature.fit_transform(X)
  counts = np.bincount(y)
  most_common_grade = np.argmax(counts)
  accuracies = []
  rand_accuracies = []
  common_accuracies = []
  advantages = []
  best_accuracy = 0
  for i in range(n): # idea is to check some options for a better model here
    X_train, X_test, y_train, y_test = train_test_split(X_features, y, test_size=0.15)
    if np.unique(y_train).size <= 1 or X_train.shape[0] == 0: # fucked up split
      continue
    clf = SGDClassifier(loss="log", penalty="l2", max_iter=10000, early_stopping=True)
    clf.fit(X_train, y_train)
    pred = clf.predict(X_test)
    if verbose:
      print("pred: ", pred)
      print("real: ", np.array(y_test).reshape(1, -1)[0])
      print("SAME: [", ' '.join(["t" if a == b else "f" for a, b in zip(pred, np.array(y_test).reshape(1, -1)[0])]), "]")
      print("----------------------------------------")
    random_pred = np.random.choice([0, 1, 2, 3, 4, 5], y_test.size, replace=True)
    common_accuracy = mean_squared_error(np.repeat(most_common_grade, y_test.size), y_test)
    real_accuracy = mean_squared_error(pred, y_test)
    if real_accuracy < best_accuracy:
      best_accuracy = real_accuracy
      best_model = clf
    baseline_accuracy = mean_squared_error(random_pred, y_test)
    accuracies.append(real_accuracy)
    rand_accuracies.append(baseline_accuracy)
    common_accuracies.append(common_accuracy)
    advantages.append(real_accuracy - baseline_accuracy)
    
  print(f"Course:  {name} | "
        f"prediction loss:  {np.average(accuracies):.3f} | "
        f"random loss: {np.average(rand_accuracies):.3f} | "
        f"common loss: {np.average(common_accuracies):.3f} | "
        f"advantage: {np.average(advantages):.3f}")
  pickle.dump(clf, open('./models/' + name + '.sav', 'wb'))
  if len(accuracies) == 0:
    return(None)
  return(clf)

      


if __name__ == "__main__":
  questionnaires = pd.concat([pd.read_csv("TKT_HUL.csv", header=0), pd.read_csv("YET_HUL.csv", header=0)])
  attainments = pd.read_csv("attainments.csv", names=["id", "grade", "studentnumber", "credits", "ordering", "createddate", "lastmodified", "typecode", "attainmentdate", "code", "semester", "studymodule"])
  merged = pd.merge(questionnaires, attainments, left_on="Opisnro", right_on="studentnumber")
  data = merged[["studentnumber", "SBI", "Organised", "Surface", "Deep", "SE", "IntRel", "Peer", "Align", "ConsFeed", "credits", "code", "studymodule", "grade"]]
  mayhem = [train(* get_course_data(data, course_code)) for course_code in get_courses(data)]
 
  

