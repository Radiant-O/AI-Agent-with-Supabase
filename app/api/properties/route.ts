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

            const { data: insertedData, error } = await supabaseClient
                .from("properties")
                .insert({
                    ...property,
                    embedding
                })
                .select();

            if (error) {
                errors.push({ property, error });
            } else {
                results.push(insertedData);
            }
        } catch (error) {
            errors.push({ property, error });
        }
    }

    return NextResponse.json({
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : null
    });
}

// Type guard function to validate property data
function isValidProperty(property: any): property is PropertyType {
    const requiredFields = ['title', 'address', 'location', 'house_type', 'price'];
    return requiredFields.every(field => field in property);
}