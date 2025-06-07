from flask import Blueprint,Flask, request, jsonify
import pandas as pd
import random
from . import globals
from flask_cors import CORS

QA_XLX_CSV_bp = Blueprint("QA_XLX_CSV", __name__)

CORS(QA_XLX_CSV_bp)  
    
@QA_XLX_CSV_bp.route('/api/analyze-file', methods=['POST'])
def analyze_file():
    print("inside analyze file!!")
    #global uploaded_questions
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Check the file extension
    if file and (file.filename.endswith('.xlsx') or file.filename.endswith('.csv')):
        try:
            # Read the file based on the extension
            if file.filename.endswith('.xlsx'):
                df = pd.read_excel(file)
            elif file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            
            globals.uploaded_questions = df
            total_questions = len(df)

            # Group by Topic and Subtopic, count questions
            topic_counts = df.groupby(['Topic', 'Subtopic']).size().unstack(fill_value=0)

            # Convert to desired format, filtering out subtopics with a count of 0
            formatted_topics = {}
            for topic in topic_counts.index:
                subtopic_counts = topic_counts.loc[topic]
                # Only include subtopics with a count greater than 0
                filtered_subtopics = subtopic_counts[subtopic_counts > 0].to_dict()
                if filtered_subtopics:  # Only add topics with non-empty subtopics
                    formatted_topics[topic] = filtered_subtopics

            # Count questions by Difficulty
            difficulty_counts = df['Difficulty'].value_counts().to_dict()

            return jsonify({
                'totalQuestions': total_questions,
                'topics': formatted_topics,
                'difficultyDistribution': difficulty_counts
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file format. Please upload a CSV or Excel (.xlsx) file.'}), 400