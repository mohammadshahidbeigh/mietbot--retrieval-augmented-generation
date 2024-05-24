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
//     "eyJh";
//   const sbUrl = "https:supabase.co";
//   const openAIApiKey = "sk";

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
