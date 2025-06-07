from flask import Blueprint,Flask, request, jsonify
import random
from flask_cors import CORS
from . import globals

test_gen_bp = Blueprint("test_gen",__name__)

CORS(test_gen_bp)

@test_gen_bp.route('/api/generate-test', methods=['POST'])
def generate_test():
    #global uploaded_questions
    if globals.uploaded_questions is None:
        print("Error!!")
        return jsonify({'error': 'No questions uploaded. Please upload a file first.'}), 400

    data = request.json
    selected_topics = data.get('selectedTopics', {})
    
    generated_test = []
    for topic, subtopics in selected_topics.items():
        for subtopic, count in subtopics.items():
            # Filter questions for this topic and subtopic
            questions = globals.uploaded_questions[(globals.uploaded_questions['Topic'] == topic) & 
                                        (globals.uploaded_questions['Subtopic'] == subtopic)]
            
            # Randomly select the specified number of questions
            selected_questions = questions.sample(n=min(count, len(questions)))
            
            for _, question in selected_questions.iterrows():
                generated_test.append({
                    'id': question['ID'],
                    'topic': question['Topic'],
                    'subtopic': question['Subtopic'],
                    'question': question['Question'],
                    'options': [
                        question['Option A'],
                        question['Option B'],
                        question['Option C'],
                        question['Option D']
                    ],
                    'correct_answer': question['Correct Answer'],
                    'difficulty': question['Difficulty']
                })
    print(generate_test)
    
    # Shuffle the test questions
    random.shuffle(generated_test)
    
    return jsonify(generated_test)
