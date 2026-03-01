// src/pages/api/pendaftaran/list.ts
import type { APIRoute } from 'astro';
import { getAllUsers } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
    try {
        const result = await getAllUsers();

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Gagal mengambil data pendaftaran',
            error: error.message,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
