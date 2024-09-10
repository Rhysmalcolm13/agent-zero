import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { context, log_from } = await req.json();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/poll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context, log_from }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in POST request to Flask:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export const config = {
    api: {
        bodyParser: false,
    },
};
