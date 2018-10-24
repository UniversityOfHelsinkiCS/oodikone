from flask import Flask, jsonify, request

from dotenv import load_dotenv
import os
import pickle

app = Flask(__name__)

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'

@app.route('/test')
def test():
  print(request.args)
  course = request.args.get('course')
  data = request.args.get('data')
  clf = pickle.load(open('./models/' + course + '.sav', 'rb'))
  res = clf.predict(data)
  return res

if __name__ == '__main__':
  load_dotenv()
  debug = os.getenv('ENV') == 'development'
  app.run("0.0.0.0", port=5000, debug=debug)