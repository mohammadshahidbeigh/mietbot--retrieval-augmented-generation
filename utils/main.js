// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { createClient } from "@supabase/supabase-js";
// import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";

// // @supabase/supabase-js
// try {
//   const result = await fetch("/store.txt");
//   const text = await result.text();
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 100,
//     separators: ["\n\n", "\n", " ", ""], // default setting
//   });

//   const output = await splitter.createDocuments([text]);

//   const sbApiKey =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmx3Y2Nsb2FkYXNrbXl1YWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE0NDc1MjQsImV4cCI6MjAyNzAyMzUyNH0.k__tl5k0CtaTThERC7srzBU_NINTXqMWg6LzvKKHa-4";
//   const sbUrl = "https://wablwccloadaskmyuajy.supabase.co";
//   const openAIApiKey = "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";

//   const client = createClient(sbUrl, sbApiKey);

//   await SupabaseVectorStore.fromDocuments(
//     output,
//     new OpenAIEmbeddings({ openAIApiKey }),
//     {
//       client,
//       tableName: "documents",
//     }
//   );
// } catch (err) {
//   console.log(err);
// }
