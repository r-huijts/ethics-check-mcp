#!/bin/bash

# Direct curl test matching Google AI Studio example
# Tests the exact same API call format as shown in the documentation

echo "🧪 Testing Gemini API with curl (matching Google AI Studio example)"

# Load API key from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not found in .env file"
    exit 1
fi

echo "🔑 Using API key: ${GEMINI_API_KEY:0:10}..."

# Exact curl command from Google AI Studio
echo "📡 Making API call to gemini-2.0-flash..."

response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }')

# Check if response contains error
if echo "$response" | grep -q "error"; then
    echo "❌ API call failed:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    exit 1
fi

# Check if response contains expected content
if echo "$response" | grep -q "candidates"; then
    echo "✅ API call successful!"
    echo "📝 Response:"
    echo "$response" | jq '.candidates[0].content.parts[0].text' 2>/dev/null || echo "$response"
else
    echo "⚠️  Unexpected response format:"
    echo "$response"
fi

echo ""
echo "🎉 Curl test completed!" 