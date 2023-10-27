# YouTube Video Analysis and Chat CLI Tool

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Codebase](#codebase)
  - [Dependencies](#dependencies)
  - [File Structure](#file-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

This CLI tool is a TypeScript application that leverages the OpenAI API, HNSWLib, and Langchain to analyze YouTube videos and engage in an AI-driven conversation based on the video's content. Aimed at TypeScript engineers, this README provides an exhaustive guide for understanding, installing, and using this tool.

## Application Functionality

- **Prompt for YouTube URL**: Asks the user for a YouTube video URL with a default option.
- **Transcript Download**: Downloads the transcript of the given YouTube video and splits it into documents.
- **OpenAI Embeddings**: Utilizes OpenAI embeddings to create vector embeddings for the downloaded documents.
- **Local Vector Store**: Utilizes the HNSWLib library to store embeddings in a local vector store on the filesystem.
- **AI-Driven Chat**: Uses the Langchain library to build a chat interface that uses the embeddings as context.
- **Summary Display**: Evaluates and displays a summary of the video based on its transcripts.
- **Interactive Q&A**: Allows the user to ask follow-up questions, which are answered using the embeddings until the user types "exit".

## Screenshot

![Screen](/screenshot.png)

## Installation

To install the CLI tool, you need to have Node.js and npm installed on your system. Then run:

```bash
# Clone the repository
git clone https://github.com/djheru/gpt-cli.git

# Navigate into the directory
cd gpt-cli

# Install dependencies
npm install
```

## Usage

To execute the application, run:

```bash
npm run youtube
```

Follow the on-screen prompts to input a YouTube URL (or use the default) and engage in a conversation based on the video's content.

## Codebase

### Dependencies

Here are the main libraries and their roles in this project as per `package.json`:

- `openai`: For generating embeddings and AI-related functionalities.
- `hnswlib`: Used for efficient similarity search and storage of embeddings.
- `langchain`: For building the chat interface.

### File Structure

- `index.ts`: Entry point for the application.
- `youtube.ts`: Contains the logic for handling YouTube video analysis and chat.
- `utils.ts`: Utility functions used across the project.

```typescript
// File: index.ts
// Entry point for the CLI application

// File: youtube.ts
// Main logic for YouTube video analysis and chat functionality

// File: utils.ts
// Contains utility functions for embedding creation, summary, etc.
```

## Contributing

If you're interested in contributing, please follow the standard fork, feature-branch, pull request workflow.

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Create a pull request.

## License

This project is licensed under the MIT License.

---

This README aims to be a thorough guide for TypeScript engineers looking to understand and contribute to this tool. Feel free to submit issues or pull requests to improve it.
