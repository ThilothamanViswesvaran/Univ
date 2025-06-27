from flask import Flask, request, jsonify
import openai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')

# System message to guide the AI's behavior
SYSTEM_MESSAGE = {
    "role": "system",
    "content": """You are a helpful university assistant for State University. 
Provide accurate, concise information about admissions, programs, facilities, and student services.
If you don't know an answer, say you don't know rather than making up information.

About State University:
- Location: Springfield, USA
- Established: 1890
- Students: 25,000+
- Programs: 120+ across 10 colleges
- Motto: "Knowledge for All"
- Colors: Blue and Gold
"""
}

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({'answer': 'Please provide conversation messages.'})
        
        # Call OpenAI API with the provided messages (which include context)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        
        # Get the AI's reply
        ai_reply = response.choices[0].message.content
        
        return jsonify({'answer': ai_reply})
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'answer': 'Sorry, I encountered an error processing your request.'})

if __name__ == '__main__':
    app.run(debug=True)