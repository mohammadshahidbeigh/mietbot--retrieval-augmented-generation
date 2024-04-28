import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "/utils/retriever";
import { combineDocuments } from "/utils/combineDocuments";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { formatConvHistory } from "/utils/formatConvHistory";

// Initialize Firebase
const appSettings = {
  databaseURL:
    "https://mietbot-2-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const conversationRef = ref(database, "conversations");

document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("user-input");
  const submitButton = document.getElementById("submit-btn");

  // Event listener for the submit button
  submitButton.addEventListener("click", progressConversation);

  // Event listener for Enter key press in the input field
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default form submission behavior

      // Check if input is not empty before progressing conversation
      if (userInput.value.trim() !== "") {
        progressConversation();
        // Call the progressConversation function
      }
    }
  });
});

const openAIApiKey = "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";
const llm = new ChatOpenAI({ openAIApiKey });

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
);

const answerTemplate = `You are a supportive and dynamic conversational bot, designed to address any inquiries about MIET Jammu with the utmost precision. Your role involves analyzing the context and conversation history to provide the most accurate response. If the information needed to address the query isn't given in the context or conversation history, it's crucial to admit, "I'm sorry, I cannot provide a definitive answer to that." At this point, kindly guide the user to reach out to info@mietjammu.in for further assistance. Remember to avoid fabricating responses. Always keep your tone friendly, approachable, and informative.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = standaloneQuestionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

const retrieverChain = RunnableSequence.from([
  (prevResult) => prevResult.standalone_question,
  retriever,
  combineDocuments,
]);

const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question,
    conv_history: ({ original_input }) => original_input.conv_history,
  },
  answerChain,
]);

const convHistory = [];

async function progressConversation() {
  const userInput = document.getElementById("user-input");
  const chatbotConversation = document.getElementById("chatbot-conversation");
  const question = userInput.value.trim(); // Trim whitespace from the input
  userInput.value = ""; // Clear the input field

  // If the input is empty, return without progressing the conversation
  if (question === "") {
    return;
  }

  // Add human message
  const newHumanSpeechBubble = document.createElement("div");
  newHumanSpeechBubble.classList.add("speech", "speech-human");
  newHumanSpeechBubble.textContent = question;
  chatbotConversation.appendChild(newHumanSpeechBubble);

  // Scroll to the bottom of the conversation container
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

  // Get response from AI

  // Get response from AI
  const response = await chain.invoke({
    question: question,
    conv_history: formatConvHistory(convHistory),
  });
  convHistory.push(question);
  convHistory.push(response);

  // Add AI message
  // Add AI message
  const newAiSpeechBubble = document.createElement("div");
  newAiSpeechBubble.classList.add("speech", "speech-ai", "blinking-cursor"); // Add blinking cursor class
  newAiSpeechBubble.classList.add("speech", "speech-ai", "blinking-cursor"); // Add blinking cursor class
  chatbotConversation.appendChild(newAiSpeechBubble);
  renderTypewriterText(response, newAiSpeechBubble); // Use typewriter effect for response

  // Scroll to the bottom of the conversation container after adding the AI message
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

  // Store conversation in Firebase
  push(conversationRef, {
    question: question,
    response: response,
  });

  // Generate suggestive prompts
  generateSuggestivePrompts(question);
}

document.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.getElementById("clear-btn");
  clearButton.addEventListener("click", () => {
    clearConversation();
  });
});

function clearConversation() {
  const chatbotConversation = document.getElementById("chatbot-conversation");
  chatbotConversation.innerHTML =
    '<div class="speech speech-ai">Hey there! Welcome to MIET Jammu\'s virtual assistant.<br> How can I assist you today?</div>';
}

// Function to render AI response with typewriter effect
function renderTypewriterText(text, element) {
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text.slice(i - 1, i);
    if (text.length === i) {
      clearInterval(interval);
      element.classList.remove("blinking-cursor");
    }
    i++;
  }, 50);
}

// Append style for blinking cursor
const style = document.createElement("style");
style.textContent = `
/* Define blinking cursor animation */
@keyframes cursor-blink {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Apply blinking cursor animation to cursor element */
.blinking-cursor::after {
  content: "●";/* Use FULL BLOCK character */
  font-size: 24px; /* Set font size to make it bigger */
  color: white; /* Set color to black */
  animation: cursor-blink 0.5s infinite;
}
`;
document.head.appendChild(style);

// Create Speech
document.addEventListener("DOMContentLoaded", () => {
  const micButton = document.getElementById("microphone-btn");
  const userInput = document.getElementById("user-input");
  const micSound = document.getElementById("mic-sound");
  const micStopSound = document.getElementById("mic-stop-sound");

  // Initialize SpeechRecognition object
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;

  // Track whether speech recognition is active
  let isSpeechRecognitionActive = false;

  // Event listener for microphone button click
  micButton.addEventListener("click", toggleSpeechRecognition);

  // Function to toggle between text input and speech recognition
  function toggleSpeechRecognition() {
    if (!isSpeechRecognitionActive) {
      // Start speech recognition
      if (recognition) {
        isSpeechRecognitionActive = true;
        recognition.start();
        micButton.classList.add("active");
        micButton.classList.add("hover-active");
        micSound.play(); // Play the microphone sound
      } else {
        console.error("Speech recognition is not supported in this browser.");
      }
    } else {
      // Stop speech recognition
      isSpeechRecognitionActive = false;
      recognition.stop();
      micButton.classList.remove("active");
      micButton.classList.remove("hover-active");
      micStopSound.play(); // Play the microphone stop sound
      micStopSound.currentTime = 0; // Reset the sound to the beginning
    }
  }

  // Event listener for speech recognition results
  recognition.onresult = function (event) {
    const transcript = event.results[event.results.length - 1][0].transcript;
    userInput.value += transcript;
  };

  // Event listener for speech recognition errors
  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    if (event.error === "no-speech") {
      alert("No speech detected. Please try again.");
    }
  };
});

import OpenAI from "openai";
import { process } from "./env";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For Frontend Usage/Can be omitted.
});

async function generateSuggestivePrompts(userInput) {
  const suggestivePromptsContainer = document.getElementById(
    "chatbot-prompts-container"
  );
  suggestivePromptsContainer.innerHTML = ""; // Clear previous suggestions

  const promptTemplate = `Given the user input: ${userInput}, generate 5 suggestive one word prompts.`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: promptTemplate }],
      model: "gpt-3.5-turbo",
    });

    console.log("Chat completion response:", chatCompletion); // Log the entire response

    if (chatCompletion.choices && chatCompletion.choices.length > 0) {
      const messageContent = chatCompletion.choices[0].message.content.trim();
      const prompts = messageContent.split("\n").map((line) => line.trim());

      prompts.forEach((promptText) => {
        // Create a button for each prompt
        const promptButton = document.createElement("button");
        promptButton.textContent = promptText.replace(/^\d+\.\s*/, "");
        promptButton.classList.add("suggestive-prompt-button"); // Add a class for styling
        promptButton.addEventListener("click", () => {
          // Find the input element by its ID
          const userInput = document.getElementById("user-input");
          // Set its value as the text content of the clicked button
          userInput.value = promptButton.textContent;
          // Trigger a click event on the submit button
          document.getElementById("submit-btn").click();
        });
        suggestivePromptsContainer.appendChild(promptButton);
      });
    } else {
      // No choices found in response
      const errorMessage = document.createElement("div");
      errorMessage.textContent =
        "Sorry, no suggestive prompts are available at the moment.";
      errorMessage.classList.add("error-message");
      suggestivePromptsContainer.appendChild(errorMessage);
    }
  } catch (error) {
    console.error("Error generating suggestive prompts:", error);
    // Display error message
    const errorMessage = document.createElement("div");
    errorMessage.textContent =
      "Sorry, an error occurred while generating suggestive prompts.";
    errorMessage.classList.add("error-message");
    suggestivePromptsContainer.appendChild(errorMessage);
  }
}
