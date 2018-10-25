from flask import Flask, jsonify, request

from dotenv import load_dotenv
import os
import pickle
import numpy as np
import tensorflow as tf
from keras import backend

app = Flask(__name__)

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'

@app.route('/test', methods=["POST"])
def test():
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

def load_model(course):
  model = pickle.load(open('./models/' + course + '.sav', 'rb'))
  return model

if __name__ == '__main__':
  load_dotenv()
  debug = os.getenv('ENV') == 'development'
  app.run("0.0.0.0", port=5000, debug=debug)