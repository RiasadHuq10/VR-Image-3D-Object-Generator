# VR-Image-3D-Object-Generator

AI-driven dynamic XR presentations that move beyond static slides. Generate images and 3D objects on demand using natural language, and interact with them in immersive virtual and augmented reality environments.

## Overview

This project demonstrates how generative AI can transform XR presentations from static slide-based workflows to interactive, museum-like spatial storytelling. Presenters can use voice or text prompts to generate images and 3D objects in real time, manipulate them with XR controllers, and create engaging presentations without pre-authoring all content.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (WebXR/WebGPU)                  │
│  - Voice input (Whisper via WebGPU)                         │
│  - Text/image input                                         │
│  - Real-time 3D object interaction                          │
│  - VR/AR mode switching                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│              Backend (FastAPI + FastMCP)                     │
│  - AI Routing Agent                                         │
│  - Text-to-Image Pipeline (Z-Image)                         │
│  - Image-to-3D Pipeline (Hunyuan3D)                         │
│  - MCP Server Integration                                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

- **Live Content Generation**: Generate images and 3D models on-the-fly using natural language prompts
- **Natural Language Input**: Voice and text-based interaction optimized for presentations
- **Local Speech Processing**: Whisper transcription runs on-device via WebGPU for responsive speech-to-text
- **Unified Routing Agent**: Automatically selects optimal generation pipeline based on input
- **Immersive Object Manipulation**: Grab, rotate, scale, and delete generated objects with XR controllers
- **Multi-Modal Input**: Text, voice, or image-to-3D conversion
- **Lightweight Co-presence**: Real-time user awareness for collaborative presentations
- **VR & AR Support**: Switch seamlessly between immersive and augmented reality
- **Museum-Like Presentations**: Arrange objects spatially for narrative storytelling

## Technology Stack

**Frontend**:
- WebXR for VR/AR access
- Three.js for 3D rendering
- WebGPU for local Whisper inference
- Express.js for HTTPS server

**Backend**:
- FastAPI for REST API
- FastMCP for AI agent routing
- Hunyuan3D for 3D generation
- Z-Image for text-to-image generation
- HuggingFace Transformers & Spaces

## Installation & Setup

### Backend

Dependencies Installation and Start Backend:
```bash
cd ./backend

python3 -m venv venv
source ./venv/bin/activate

# installing dependencies
pip install -r ./requirements.txt

# starting backend server
uvicorn outer_layer.app:app --reload

# required environment variables: HF_TOKEN, MY_API_KEY
```

**Environment Variables**:
- `HF_TOKEN`: HuggingFace API token (for model access)
- `MY_API_KEY`: API key for authorizing frontend requests

### Frontend

Dependencies Installation and Start Frontend:
```bash
cd ./frontend

# installing dependencies
npm install

# generating openssl keys for https
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365

# starting frontend server
node server.js
```

**Configuration**:
Must also change 
```javascript
const API_TOKEN = "super_secret_api_token_123";
```
to an actual api token that matches `MY_API_KEY` on the hosted backend.

## Usage

1. **Start Backend**: Follow backend setup above
2. **Start Frontend**: Follow frontend setup above
3. **Access System**: Open `https://<ip>:<port>` on a VR headset (e.g., Meta Quest 3) on the same LAN
4. **Generate Content**:
   - Use the text input field or voice button to describe what you want to generate
   - Press "Generate" or speak a prompt
   - Objects appear in the scene ready for interaction
5. **Manipulate Objects**:
   - Grab: Trigger button while pointing at an object
   - Rotate: Move controller while holding
   - Scale: Pinch gesture or secondary trigger
   - Delete: Release while pointing at ground

## Evaluation Results

### Model Performance
- **Hunyuan3D**: Competitive performance on shape quality (T-3DGS: 32.9 dB, Gem3D: 35.2 dB) and texture quality
- **Z-Image**: Strong text-rendering and object generation across multiple benchmarks
- Consistent, balanced quality across evaluation metrics

### User Feedback
- **Most Valued**: Live generation and spatial presentations
- **Key Concerns**: Inference latency, output variability, content reliability
- **Engagement**: Interactive object manipulation rated as highly engaging
- **Presentations**: Spatial storytelling perceived as superior to traditional slide-based approaches

### Performance Characteristics
- **Speech Transcription**: Near real-time with WebGPU Whisper
- **Text-to-Image**: Moderate speed (depends on cloud load)
- **Image-to-3D**: Most computationally intensive stage
- **Mitigation**: Loading placeholders provide immediate visual feedback

## System Strengths

1. **Dynamic Content Creation**: Adapt presentations in real-time to audience questions
2. **Unified Interaction Flow**: Simple interface; routing agent selects models automatically
3. **Hybrid Inference Strategy**: Local processing + cloud generation balances responsiveness and quality
4. **Immersive Interaction**: Generated objects are immediately interactive
5. **Practical Architecture**: Modular design enables easy extension with new models

## Known Limitations

1. **Inference Latency**: Image-to-3D pipeline introduces significant delays
2. **Model Variability**: Output quality depends on prompt specificity
3. **Cloud Dependency**: Requires network connection to cloud backend
4. **Offline Use**: Not possible with current architecture

## Deployment

### Backend (HuggingFace Spaces)

Pre-deployed backend available at:
```
https://huggingface.co/spaces/HKBUniverse/riasad_fyp_backend
```

To deploy your own:
1. Duplicate the Space into your HuggingFace account
2. Add Space secrets:
   - `HF_TOKEN`: Your HuggingFace access token
   - `MY_API_KEY`: API key for frontend authorization
3. Build and run normally

### Frontend (Local HTTPS Server)

Run locally on a machine on the same LAN as your VR headset:
```bash
cd frontend
npm install
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365
node server.js
```

Access via: `https://<machine-ip>:<port>`

## Future Improvements

1. **Model Optimization**: Distillation and quantization for local inference
2. **Caching & Reuse**: Cache frequently generated objects to reduce latency
3. **Quality Filtering**: Generate multiple candidates and select best automatically
4. **Structured Commands**: Richer speech-command system for object organization
5. **Local PC Offload**: Leverage Steam Frame 6 GHz dongle for zero-latency local generation
6. **Multi-User XR**: Extend to collaborative group presentations
7. **Formal User Studies**: Controlled evaluation of engagement and learning outcomes

## Project Structure

```
.
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── inner_layer/
│   │   ├── backend.py
│   │   └── models/
│   │       ├── hunyuan3d/
│   │       └── zimage/
│   ├── outer_layer/
│   │   ├── ai_agent.py
│   │   └── app.py
│   └── mcp_server/
│       └── server.py
├── frontend/
│   ├── index.html
│   ├── server.js
│   ├── package.json
│   ├── assets/
│   └── three/
└── README.md
```


