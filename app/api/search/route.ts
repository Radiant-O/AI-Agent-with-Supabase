import { supabaseClient } from "@/lib/supabaseService";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const { args } = await req.json();
    const query = args?.query;

    if (!query) {
        return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    console.log("Building embedding");
    console.log(query);

    //Create Embeding
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });

    console.log(embeddingResponse);

    const embedding = embeddingResponse.data[0].embedding;

    console.log(embedding);

    console.log("Finished building embedding");

    //Search Supabase
    console.log("Similarity threshold:", 0.35);
    const { data, error } = await supabaseClient.rpc("search_properties", {
        query_embedding: embedding,
        similarity_threshold: 0.35,
        match_count: 3,
    });

    console.log("Number of results:", data?.length);
console.log("First result similarity:", data?.[0]?.similarity);
console.log("Last result similarity:", data?.[data?.length-1]?.similarity);
    console.log("Data:", data);
    console.log("Error:", error);

    if (data) {
        return NextResponse.json({ data });
    }

    return NextResponse.json({ error: error?.message }, { status: 500 });
}