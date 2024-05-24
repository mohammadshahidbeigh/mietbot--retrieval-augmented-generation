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
  const micButton = document.getElementById("microphone-btn");
  const micSound = document.getElementById("mic-sound");
  const micStopSound = document.getElementById("mic-stop-sound");

  submitButton.addEventListener("click", progressConversation);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (userInput.value.trim() !== "") {
        progressConversation();
      }
    }
  });

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  let isSpeechRecognitionActive = false;

  micButton.addEventListener("click", () => {
    if (!isSpeechRecognitionActive) {
      if (recognition) {
        isSpeechRecognitionActive = true;
        recognition.start();
        micButton.classList.add("active");
        micButton.classList.add("hover-active");
        micSound.play();
      } else {
        console.error("Speech recognition is not supported in this browser.");
      }
    } else {
      isSpeechRecognitionActive = false;
      recognition.stop();
      micButton.classList.remove("active");
      micButton.classList.remove("hover-active");
      micStopSound.play();
      micStopSound.currentTime = 0;
    }
  });

  recognition.onresult = function (event) {
    const transcript = event.results[event.results.length - 1][0].transcript;
    userInput.value += transcript;
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    if (event.error === "no-speech") {
      alert("No speech detected. Please try again.");
    }
  };
});

const openAIApiKey = "";
const llm = new ChatOpenAI({ openAIApiKey });

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
);

const answerTemplate = `You are a supportive and dynamic conversational bot, designed to address any inquiries about MIET Jammu with the utmost precision. Your role involves analyzing the context and conversation history to provide the most accurate response. If the information needed to address the query isn't given in the context or conversation history, it's crucial to admit, "Sorry, I wasn't able to find any information about your question." At this point, kindly guide the user to reach out to info@mietjammu.in for further assistance. No hallucination, remember the focus on MIET Jammu. Always keep your tone friendly, approachable, and informative.
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

let conversationEntries = [];

const suggestivePromptsTemplate = `Based on the user input "{user_input}", generate suggestive few word prompts from the stored questions in the database that are similar to "{user_input}".`;
const suggestivePromptTemplate = PromptTemplate.fromTemplate(
  suggestivePromptsTemplate
);

document.addEventListener("DOMContentLoaded", () => {
  const storedEntries = localStorage.getItem("conversationEntries");
  if (storedEntries) {
    conversationEntries = JSON.parse(storedEntries);
    renderConversationEntries(conversationEntries);
  }
});

async function progressConversation() {
  const userInput = document.getElementById("user-input");
  const chatbotConversation = document.getElementById("chatbot-conversation");
  const question = userInput.value.trim();
  userInput.value = "";

  if (question === "") {
    return;
  }

  const newHumanSpeechBubble = document.createElement("div");
  newHumanSpeechBubble.classList.add("speech", "speech-human");
  newHumanSpeechBubble.textContent = question;
  chatbotConversation.appendChild(newHumanSpeechBubble);
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

  const response = await chain.invoke({
    question: question,
    conv_history: formatConvHistory(
      conversationEntries.map((entry) => entry.question)
    ),
  });

  const newAiSpeechBubble = document.createElement("div");
  newAiSpeechBubble.classList.add("speech", "speech-ai", "blinking-cursor");
  chatbotConversation.appendChild(newAiSpeechBubble);

  renderTypewriterText(response, newAiSpeechBubble, async () => {
    const prompts = await generateSuggestivePrompts(question);
    const newEntry = {
      question: question,
      response: response,
      prompts: prompts.map((prompt) => ({ text: prompt, clicked: false })),
    };
    conversationEntries.push(newEntry);
    renderSuggestivePrompts(newEntry.prompts, chatbotConversation);
    localStorage.setItem(
      "conversationEntries",
      JSON.stringify(conversationEntries)
    );
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
  });

  push(conversationRef, { question: question, response: response });
}

document.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.getElementById("clear-btn");
  clearButton.addEventListener("click", clearConversation);
});

function clearConversation() {
  const chatbotConversation = document.getElementById("chatbot-conversation");
  chatbotConversation.innerHTML =
    '<div class="speech speech-ai">Hey there! Welcome to MIET virtual assistant.<br> How can I assist you today?</div>';
  localStorage.removeItem("conversationEntries");
  conversationEntries = [];
}

function renderTypewriterText(text, element, onComplete) {
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text.slice(i - 1, i);
    if (text.length === i) {
      clearInterval(interval);
      element.classList.remove("blinking-cursor");
      onComplete();
    }
    i++;
  }, 50);
}

function renderConversationEntries(entries) {
  const chatbotConversation = document.getElementById("chatbot-conversation");
  entries.forEach((entry) => {
    const humanBubble = document.createElement("div");
    humanBubble.classList.add("speech", "speech-human");
    humanBubble.textContent = entry.question;
    chatbotConversation.appendChild(humanBubble);

    const aiBubble = document.createElement("div");
    aiBubble.classList.add("speech", "speech-ai");
    aiBubble.textContent = entry.response;
    chatbotConversation.appendChild(aiBubble);

    renderSuggestivePrompts(entry.prompts, chatbotConversation);
  });
}

function renderSuggestivePrompts(prompts, container) {
  const suggestivePromptsContainer = document.createElement("div");
  suggestivePromptsContainer.classList.add("chatbot-prompts-container");

  prompts.forEach((prompt) => {
    const button = document.createElement("button");
    button.textContent = prompt.text;
    button.classList.add("suggestive-prompt-button");
    if (prompt.clicked) {
      button.classList.add("clicked");
    }
    button.addEventListener("click", () => {
      const userInputField = document.getElementById("user-input");
      userInputField.value = prompt.text;
      document.getElementById("submit-btn").click();
      button.classList.add("clicked");

      // Update the clicked state in the conversation entry
      prompt.clicked = true;
      localStorage.setItem(
        "conversationEntries",
        JSON.stringify(conversationEntries)
      );
    });
    suggestivePromptsContainer.appendChild(button);
  });

  container.appendChild(suggestivePromptsContainer);
}

const style = document.createElement("style");
style.textContent = `
@keyframes cursor-blink {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
.blinking-cursor::after {
  content: "●";
  font-size: 24px;
  color: white;
  animation: cursor-blink 0.5s infinite;
}
`;
document.head.appendChild(style);

async function generateSuggestivePrompts(userInput) {
  console.log("generateSuggestivePrompts received userInput:", userInput);
  try {
    const templateResult = await suggestivePromptTemplate.invoke({
      user_input: userInput.toString(),
    });
    console.log(
      "Intermediate results from suggestivePromptTemplate:",
      templateResult
    );

    const promptString = templateResult.value;
    console.log("Extracted prompt string:", promptString);

    const retrievedDocuments = await retriever.getRelevantDocuments(
      promptString
    );
    console.log("Retrieved documents from retriever:", retrievedDocuments);

    const combinedDocuments = combineDocuments(retrievedDocuments);
    console.log("Combined documents:", combinedDocuments);

    const prompts = extractPrompts(combinedDocuments, userInput, 3);
    console.log("Generated prompts:", prompts);

    return prompts;
  } catch (error) {
    console.error("Error in generateSuggestivePrompts:", error);
    return [];
  }
}

function extractPrompts(combinedText, userInput, limit) {
  const questionRegex =
    /(?:What|How|Where|When|Why|Which|Can|Do|Is|Are|Should)[^\.?!]*\?/g;
  let matches = combinedText.match(questionRegex) || [];

  matches = [...new Set(matches)].map((question) => {
    if (!question.trim().endsWith("?")) {
      question += "?";
    }
    return question.trim();
  });

  matches.sort((a, b) => a.length - b.length);

  return matches.slice(0, limit);
}
