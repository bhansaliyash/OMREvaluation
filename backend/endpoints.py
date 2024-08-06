from flask import Flask, request, abort, send_file
from flask_cors import CORS
from src.entry import process_dir
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)
DATA_DIR = "/app/evaluation_config"

@app.route('/api/answerKey', methods=['GET'])
def getAnswerKey():
    file_path = os.path.join(DATA_DIR, 'evaluation.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            data = json.load(f)
            return data['options'].get('answers_in_order')
    else:
        abort(404, description="Evaluation file does not exist")

@app.route('/api/evaluationReport', methods=['GET'])
def getEvaluationReport():
    file_path = Path('outputs').joinpath('Results').joinpath('Results.csv')
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        abort(404, description="Evaluation report does not exist")

@app.route('/api/evaluate', methods=['POST'])
def evaluteOMRs():
    files = request.files.getlist('files')
    return process_dir(files, {'input_paths': ['inputs'], 'debug': True, 'output_dir': 'outputs', 'autoAlign': False, 'setLayout': False})

@app.route('/api/createAnswerKey', methods=['POST'])
def createAnswerKey():
    answers = request.get_json()
    data = {
        "source_type": "custom",
        "options": {
            "questions_in_order": [
            "q1..50"
            ],
            "answers_in_order": answers
        },
        "marking_schemes": {
            "DEFAULT": {
            "correct": "1",
            "incorrect": "0",
            "unmarked": "0"
            }
        }
    }

    json_data = json.dumps(data, indent=4)
    file_path = os.path.join(DATA_DIR, 'evaluation.json') # Specify the file path where you want to save the JSON data

    with open(file_path, 'w') as file:
        file.write(json_data)

    return "true"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)