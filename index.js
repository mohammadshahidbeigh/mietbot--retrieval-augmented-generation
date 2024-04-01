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

document.addEventListener("submit", (e) => {
  e.preventDefault();
  progressConversation();
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
  const question = userInput.value;
  userInput.value = "";

  // add human message
  const newHumanSpeechBubble = document.createElement("div");
  newHumanSpeechBubble.classList.add("speech", "speech-human");
  chatbotConversation.appendChild(newHumanSpeechBubble);
  newHumanSpeechBubble.textContent = question;
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
  const response = await chain.invoke({
    question: question,
    conv_history: formatConvHistory(convHistory),
  });
  convHistory.push(question);
  convHistory.push(response);

  // add AI message
  const newAiSpeechBubble = document.createElement("div");
  newAiSpeechBubble.classList.add("speech", "speech-ai");
  chatbotConversation.appendChild(newAiSpeechBubble);
  newAiSpeechBubble.textContent = response;
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
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
