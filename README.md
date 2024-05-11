# MIETBOT: AI-Powered Chatbot for Academic Assistance

## Project Overview

MIETBOT is an AI-powered chatbot designed to assist students, faculty, and visitors at the Model Institute of Engineering & Technology (MIET). It provides real-time information and support by leveraging technologies such as the OpenAI API, Supabase Vector Database, and Firebase. This chatbot enhances the educational experience by simplifying access to campus resources, academic programs, and event information.

## Features

- **24/7 Availability**: The chatbot is available around the clock.
- **Real-Time Interaction**: Engage with a responsive chatbot that offers prompt replies and accurate information.
- **Multi-Lingual Support**: The chatbot caters to a diverse user base with support in multiple languages.
- **Scalable Infrastructure**: Built on robust cloud technologies to ensure reliable performance under various loads.

## Technologies Used

- **HTML/CSS/JavaScript**: For front-end development.
- **Langchain**: For backend logic and integration with the Chatgpt OpenAI.
- **OpenAI Embeddings**: Enhances natural language understanding capabilities.
- **Firebase**: Provides real-time database storage.
- **Supabase Vector Database**: Efficiently manages and stores OpenAI embeddings.
- **Retrieval augmented generation**: RAG is a technique used in natural language processing that combines the retrieval of informational documents and the generation of text based on that retrieved information. This allows for more contextually relevant and informed responses in AI applications.

## MIETBOT Development Details

### Data Integration
- **Initiated the project** by collecting institutional data from the official MIET website ([www.mietjammu.in](http://www.mietjammu.in)) and systematically uploaded it to the Supabase Vector Database using `Langchain.js` for efficient data handling and retrieval.

### Frontend and Backend Development
- **Developed the user interface** using HTML, CSS, and JavaScript. Integrated these with `Langchain.js` to create dynamic response chains and templates, such as question-answer formats, enhancing user interaction with the chatbot.

### Natural Language Processing
- **Implemented ChatGPT OpenAI API and OpenAI Embeddings** for backend logic, significantly boosting the chatbot's ability to understand and generate human-like responses. Enhanced response relevance and information richness by incorporating **Retrieval-Augmented Generation (RAG)** techniques.

### Data Storage
- **Employed Firebase** to store conversation logs, ensuring data persistence and accessibility, which aids in refining chatbot responses and tracking user engagement.


## License

Distributed under the MIT License. See the `LICENSE` file for more information.

## Acknowledgments

- Prof. Gurpeet Kour, Project Supervisor
- Prof. (Dr.) Surbhi Sharma, Head of the Department, Electronics and Communication
- Model Institute of Engineering & Technology, Jammu


