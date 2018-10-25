from flask import Flask, jsonify, request

from dotenv import load_dotenv
import os
import pickle
import numpy as np
import tensorflow as tf

app = Flask(__name__)

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'

@app.route('/test', methods=["POST"])
def test():
  body = request.get_json()
  course = body['course']
  data = np.array(list(body['data'].values())).reshape(1, -1)
  tf.reset_default_graph()
  f = open('./models/' + course + '.sav', 'rb')
  model = pickle.load(f)
  f.close()
  res = model.predict(np.array(data))
  return str(np.argmax(res))

if __name__ == '__main__':
  load_dotenv()
  debug = os.getenv('ENV') == 'development'
  app.run("0.0.0.0", port=5000, debug=debug)