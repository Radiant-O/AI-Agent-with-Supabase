import { supabaseClient } from "@/lib/supabaseService";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PropertyType } from "@/properties";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const data = await req.json();
    const properties = Array.isArray(data) ? data as PropertyType[] : [data as PropertyType];

    const results = [];
    const errors = [];

    for (const property of properties) {
        try {
            // Type validation
            if (!isValidProperty(property)) {
                throw new Error('Invalid property data format');
            }

            const embeddingInput = Object.entries(property)
                .filter(([key]) => key !== "image")
                .map(([key, value]) => `${key}: ${value}`)
                .join(" | ");

            console.log("Embedding Input:", embeddingInput);

            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: embeddingInput,
            });

            const embedding = embeddingResponse.data[0].embedding;

            const { error } = await supabaseClient
                .from("properties")
                .insert({
                    ...property,
                    embedding
                })

            if (error) {
                errors.push({ property, error });
            } 
        } catch (error) {
            errors.push({ property, error });
        }
    }

    return NextResponse.json({
        success: errors.length === 0,
        message: errors.length === 0 ? 'Properties uploaded successfully' : 'Some properties failed to upload',
        errors: errors.length > 0 ? errors : null
    });
}

// Type guard function to validate property data
function isValidProperty(property: any): property is PropertyType {
    // All fields are optional, just check if it's an object
    return typeof property === 'object' && property !== null;
}