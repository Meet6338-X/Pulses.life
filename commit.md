# Project Files and Commit Guide

This file contains information about each file in the project, what it contains, and git commands to add and commit them individually.

## Root Directory

### README.md
Project description and setup instructions for the Pulses.life health assistant application.
```
git add README.md && git commit -m "Add project README with setup and description"
```

### start.bat
Windows batch script to run both backend and frontend development servers simultaneously.
```
git add start.bat && git commit -m "Add batch script to start backend and frontend"
```

## Backend Directory

### .env
Environment variables for API keys and configuration (SARVAM_API_KEY, GROQ_API_KEY, PORT, FRONTEND_URL).
```
git add backend/.env && git commit -m "Add environment configuration file"
```

### .env.example
Template for environment variables showing required API keys and settings.
```
git add backend/.env.example && git commit -m "Add environment variables template"
```

### package.json
Backend dependencies, scripts, and project metadata for the Express.js server.
```
git add backend/package.json && git commit -m "Add backend package configuration"
```

### package-lock.json
Locked versions of backend dependencies for reproducible installs.
```
git add backend/package-lock.json && git commit -m "Add backend dependency lock file"
```

### src/index.js
Main Express server entry point - sets up middleware, CORS, routes, and starts the server on port 5000.
```
git add backend/src/index.js && git commit -m "Add main Express server entry point"
```

### src/routes/chat.js
Chat API route handler - processes chat messages, audio input, emergency detection, and coordinates with AI services.
```
git add backend/src/routes/chat.js && git commit -m "Add chat API route handler"
```

### src/routes/emergency.js
Emergency API route handler - handles emergency-related requests and responses.
```
git add backend/src/routes/emergency.js && git commit -m "Add emergency API route handler"
```

### src/routes/hospital.js
Hospital API route handler - manages hospital search and information requests.
```
git add backend/src/routes/hospital.js && git commit -m "Add hospital API route handler"
```

### src/services/emergency.js
Emergency detection and response service - identifies medical emergencies and generates appropriate responses.
```
git add backend/src/services/emergency.js && git commit -m "Add emergency detection service"
```

### src/services/groq.js
Groq AI service integration - handles LLM responses using Llama 3.3 70B model for medical advice.
```
git add backend/src/services/groq.js && git commit -m "Add Groq AI service integration"
```

### src/services/mapsService.js
Maps and location service - handles geographic data and mapping functionality.
```
git add backend/src/services/mapsService.js && git commit -m "Add maps and location service"
```

### src/services/rag.js
Retrieval-Augmented Generation service - retrieves medical context from vector store for grounded responses.
```
git add backend/src/services/rag.js && git commit -m "Add RAG service for medical context retrieval"
```

### src/services/sarvam.js
Sarvam AI service integration - handles speech-to-text, text-to-speech, and translation using Sarvam APIs.
```
git add backend/src/services/sarvam.js && git commit -m "Add Sarvam AI multilingual service integration"
```

### src/services/vectorStore.js
Vector store service - initializes and manages the vector database for medical knowledge retrieval.
```
git add backend/src/services/vectorStore.js && git commit -m "Add vector store initialization service"
```

### scripts/ingest_datasets.js
Script to ingest and process medical datasets into the vector store.
```
git add backend/scripts/ingest_datasets.js && git commit -m "Add dataset ingestion script"
```

### scripts/process_hospitals.js
Script to process and prepare hospital data for the application.
```
git add backend/scripts/process_hospitals.js && git commit -m "Add hospital data processing script"
```

## Frontend Directory

### package.json
Frontend dependencies and scripts for the Next.js React application.
```
git add frontend/package.json && git commit -m "Add frontend package configuration"
```

### package-lock.json
Locked versions of frontend dependencies for reproducible installs.
```
git add frontend/package-lock.json && git commit -m "Add frontend dependency lock file"
```

### app/page.js
Main page component for the Next.js frontend application.
```
git add frontend/app/page.js && git commit -m "Add main page component"
```

### app/layout.js
Root layout component defining the overall structure and metadata for the Next.js app.
```
git add frontend/app/layout.js && git commit -m "Add root layout component"
```

### app/globals.css
Global CSS styles for the frontend application.
```
git add frontend/app/globals.css && git commit -m "Add global CSS styles"
```

### components/MessageBubble.jsx
React component for displaying chat message bubbles in the interface.
```
git add frontend/components/MessageBubble.jsx && git commit -m "Add message bubble component"
```

### components/HospitalCard.jsx
React component for displaying hospital information cards.
```
git add frontend/components/HospitalCard.jsx && git commit -m "Add hospital card component"
```

### components/ChatInterface.jsx
Main chat interface component handling user interactions and message display.
```
git add frontend/components/ChatInterface.jsx && git commit -m "Add chat interface component"
```

### components/VoiceRecorder.jsx
Voice recording component for audio input functionality.
```
git add frontend/components/VoiceRecorder.jsx && git commit -m "Add voice recorder component"
```

### components/EmergencyAlert.jsx
Emergency alert component for displaying urgent medical notifications.
```
git add frontend/components/EmergencyAlert.jsx && git commit -m "Add emergency alert component"
```

### components/LanguageSelector.jsx
Language selection component for multilingual support.
```
git add frontend/components/LanguageSelector.jsx && git commit -m "Add language selector component"
```