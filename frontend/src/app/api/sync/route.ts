import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use the full API URL from the environment variable

export async function POST(req: NextRequest) {
    try {
        const body = await req.json(); // Parse the request body

        // Use the dynamic API_URL for the request
        const response = await fetch(`${API_URL}/msg_sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body), // Send the body as JSON to the Quart backend
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Parse the JSON response from the Quart API
        return NextResponse.json(data); // Return the response back to the client

    } catch (error) {
        console.error('Error sending POST request to /msg:', error);
        return NextResponse.json({ error: 'Failed to send POST request' }, { status: 500 });
    }
}
