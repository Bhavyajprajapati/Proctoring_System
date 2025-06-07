from flask import Flask, request, jsonify
import google.generativeai as genai
import os
import json  
from dotenv import load_dotenv

genai.configure(api_key=os.getenv("API_KEY"))

def clean_json_string(input_str):
    return input_str.replace('```json', '').replace('```', '').strip()

def get_questions(total_questions, skill):
    try:
        model_name = "models/gemini-1.5-flash"

        prompt = f"""
            You are an expert-level skill identifier specializing in breaking down skills into essential industry-level topics.. You are tasked with identifying 3-5 topics of skill : {skill}. Adhere to following guidelines:
            - Identify 3 to 5 key topics that are fundamental to understanding {skill}.
            - Ensure the topics are industry-relevant and cover essential aspects of the skill.
            - Output format :- Return output in following standard JSON format :-

                {{
                    "topics" : ["",""]
                }}
            - Ensure the output is concise, relevant, and properly structured.
        """

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        data = response.text

       
        data = clean_json_string(data)
        parsed_data = json.loads(data)

        print(parsed_data);

        subtopic = parsed_data.get("topics");
        prompt = f"""
            You are an expert-level question generator tasked with creating {total_questions} high-quality multiple-choice questions (MCQs) on "{skill}" and its subtopics: {subtopic}. Ensure accuracy, clarity, and adherence to Bloom’s Taxonomy. Adhere to following guidelines:

            ---               
            ### *1. Subtopic Identification and Organization
            - Generate questions only for the provided subtopics {subtopic}.
            - Organize questions by subtopic, ensuring equal coverage across all subtopics.

            ### *2. Bloom's Taxonomy Coverage*
            - Ensure proper distribution of all six levels of Bloom's taxonomy as per the following chart:
                Remember : 10-15 percent
                Understand : 15-20 percent
                Apply : 25-30 percent
                Analyze : 15-20 percent
                Evaluate : 10-15 percent
                Create : 5-10 percent
                
            - *Remember*: Recall basic facts and definitions.  
            - *Understand*: Explain concepts or interpret information.  
            - *Apply*: Solve problems using learned techniques.  
            - *Analyze*: Break down information to examine relationships.  
            - *Evaluate*: Judge based on criteria or standards.  
            - *Create*: Formulate new solutions or ideas.  
            - Sort questions in the order of Bloom's taxonomy levels: remember, understand, apply, analyze, evaluate, and create.  

            ---

            ### *3. Question Design*  
            - Each question must be clear, concise, and self-contained.  
            - For applied questions, include *code snippets* where relevant, written in programming languages suitable to the "{skill}" (e.g., Python, JavaScript, etc.).  
            - Indicate the language explicitly in the "code" field.  
            - Ensure code snippets are executable and produce results aligned with the correct answer.  

            ---

            ### *4. Skills coverage
            - If comma seperated skills are provided, ensure questions of each comma seperated skill are included.
            - Generate equal number of questions of each skill.
            - Ensure generated questions are relevant to provided skills.

            ### *5. Options and Correct Answer*  
            - Provide *four options* (option1, option2, option3, option4) for each question.  
            - Systematically alternate the correct option between "A", "B", "C", and "D" across the set.  
            - Design *distractor options* (incorrect answers) to be plausible, closely related to the correct answer, and capable of challenging critical thinking.  

            ---

            ### *6. Difficulty Levels*  
            - Assign one of three difficulty levels to each question: *Easy, **Intermediate, or **Hard*.  
            - Ensure a balanced distribution of difficulty across questions.  

            ---

            ### *7. JSON Output Format*  
            Strictly adhere to the following JSON structure:
            {{
                "questions": [
                    {{
                        "topic": "{skill}",
                        "subtopic": "",
                        "question": "What is ...?",
                        "code": "<language>\n<code_snippet>\n",
                        "options" : ["option A", "option B", "option C", "option D"],
                        "answer": "option A",
                        "BT_level": "understand",
                        "difficulty": "Easy"
                    }},
                ]
            }}

            ### *8. Verification Requirements*  
            - *Accuracy*: Verify the correctness of the provided correct option.  
            - *Code Execution*: For code-based questions, execute the code snippets in a sandbox environment to confirm results.  
            - *Distractor Quality*: Ensure incorrect options are plausible but not correct.  
            - *Taxonomy and Difficulty Validation*: Confirm that the Bloom's taxonomy level and difficulty level match the question's complexity.  

            ---

            ### *9. Additional Guidelines*  
            - Avoid ambiguity or overly complex jargon in questions and options.  
            - Use professional language and ensure all questions align with the topic and subtopic.  
            - Validate all Q&A pairs before finalizing.
        """

        # prompt = f"""
        #     You are tasked with analyzing the topic "{skill}" and generating comprehensive multiple-choice questions (MCQs) for all its relevant subtopics. Follow these detailed guidelines:
        #     ### 1. Subtopic Identification and Organization
        #     - First, identify and list all industry-level subtopics that are essential to understanding {skill}
        #     - For each subtopic, generate {1} highly suitable MCQs
        #     - Organize questions by subtopic, with clear separation between different subtopics
        #     ### 2. Question Requirements (For Each Subtopic)- Ensure equal representation of all six Bloom's Taxonomy levels:
        #      - Remember: Recall facts and definitions
        #      - Understand: Explain concepts
        #      - Apply: Solve problems using techniques
        #      - Analyze: Break down information
        #      - Evaluate: Judge based on criteria
        #      - Create: Formulate new solutions
        #     - Sort questions within each subtopic by Bloom's taxonomy levels
        #     ### 3. Question Design
        #     - Include relevant code snippets where appropriate
        #     - Ensure practical, real-world examples
        #     - Maintain progressive difficulty within each subtopic
        #     ### 4. Options and Correct Answer
        #     - Provide contextually relevant options
        #     - Include common misconceptions as distractors
        #     - Ensure clear, unambiguous correct answers
        #     ### 5. JSON Output Format
        #     {{
        #      "topic": "{skill}",
        #      "subtopics": [
        #      {{
        #      "subtopic_name": "identified_subtopic_1",
        #      "questions": [
        #      {{
        #      "question": "What is ...?",
        #      "code": "<language>\n<code_snippet>\n",
        #      "options": ["option A", "option B", "option C", "option D"],
        #      "answer": "option A",
        #      "BT_level": "understand",
        #      "difficulty": "Easy"
        #      }}
        #     ]
        #     }}
        #     // Repeat for each subtopic
        #     ]
        #     }}
        #     ### 6. Verification Requirements
        #     - Verify questions properly represent their respective subtopics
        #     - Ensure progressive complexity within each subtopic
        #     - Validate that examples and scenarios are practical and relevant
        #     - Check that explanations are clear and comprehensive
        #     ### 7. Additional Guidelines
        #     - Use consistent terminology throughout each subtopic
        #     - Include practical examples relevant to each subtopic
        #     - Maintain coherent difficulty progression
        #     - Provide thorough explanations for correct answers
        # """

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        data = response.text

       
        data = clean_json_string(data)
        parsed_data = json.loads(data)
        #print(parsed_data)

        return parsed_data

    except Exception as e:
        return {"error": f"An error occurred while generating questions: {str(e)}"}