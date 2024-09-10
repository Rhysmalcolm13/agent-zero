import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use the full API URL from the environment variable

export async function POST(req: NextRequest) {
    try {
        const body = await req.json(); // Get the request body from the client
        const { context } = body; // Extract the context from the request body

        // Use the API_URL from the environment variable
        const response = await fetch(`${API_URL}/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context }), // Send the context as JSON
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Parse the JSON response from Flask
        return NextResponse.json(data); // Return the response back to the client

    } catch (error) {
        console.error('Error sending POST request to /remove:', error);
        return NextResponse.json({ error: 'Failed to send POST request' }, { status: 500 });
    }
}
