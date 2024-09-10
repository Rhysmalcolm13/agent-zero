import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching GET response:', error);
        return NextResponse.json({ error: 'Failed to fetch GET response' }, { status: 500 });
    }
}
