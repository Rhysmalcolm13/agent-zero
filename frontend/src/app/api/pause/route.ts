import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use the full API URL from the environment variable

export async function POST(req: NextRequest) {
    try {
        const body = await req.json(); // Get the request body
        const { paused, context } = body; // Extract paused and context from the request body

        // Use the API_URL environment variable
        const response = await fetch(`${API_URL}/pause`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paused, context }),  // Pass the paused and context to the Flask backend
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();  // Process the response from the backend
        return NextResponse.json(data);  // Return the response as JSON

    } catch (error) {
        console.error('Error sending POST request to /pause:', error);
        return NextResponse.json({ error: 'Failed to send POST request' }, { status: 500 });
    }
}
