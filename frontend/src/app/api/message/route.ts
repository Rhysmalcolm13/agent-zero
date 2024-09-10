import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use the full API URL

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const response = await fetch(`${API_URL}/msg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),  // Pass the request body to Flask
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in POST request to Flask:', error);
        return NextResponse.json({ error: 'Failed to send POST request' }, { status: 500 });
    }
}
