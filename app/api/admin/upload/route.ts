import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { ApiError, requireUser } from '@/lib/portal/apiAuth';
import { writableResources } from '@/lib/portal/permissions';

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Uploads one image for the website to the house's Cloudinary account and
 * returns its address. Only people who can edit some part of the website may
 * upload; the key and secret never leave the server.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!writableResources(user.role).length) throw new ApiError(403, 'Your role cannot upload images.');

    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret) throw new ApiError(503, 'Image uploads are not set up on the server.');

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) throw new ApiError(400, 'Choose an image to upload.');
    if (!file.type.startsWith('image/')) throw new ApiError(400, 'That file is not an image. Choose a JPG, PNG or WebP.');
    if (file.size > MAX_BYTES) throw new ApiError(400, 'That image is over 8 MB. Choose a smaller one.');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'kaziranga-site';
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');

    const body = new FormData();
    body.append('file', file);
    body.append('api_key', key);
    body.append('timestamp', String(timestamp));
    body.append('folder', folder);
    body.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body });
    const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
    if (!res.ok || !data.secure_url) throw new ApiError(502, data.error?.message || 'Cloudinary did not accept the image. Try again.');

    return NextResponse.json({ url: data.secure_url });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed.' }, { status });
  }
}
