import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const openAIApiKey = "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";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey,
});
const sbApiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmx3Y2Nsb2FkYXNrbXl1YWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE0NDc1MjQsImV4cCI6MjAyNzAyMzUyNH0.k__tl5k0CtaTThERC7srzBU_NINTXqMWg6LzvKKHa-4";
const sbUrl = "https://wablwccloadaskmyuajy.supabase.co";
const client = createClient(sbUrl, sbApiKey);

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: "documents",
  queryName: "match_documents",
});

const retriever = vectorStore.asRetriever();

export { retriever };
