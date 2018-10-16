from flask import Flask, jsonify
from dotenv import load_dotenv

app = Flask(__name__)

@app.route('/ping')
def ping():
  print('someone is pinging')
  return 'pong'


if __name__ == '__main__':
    app.run("0.0.0.0", port=5000, debug=True)