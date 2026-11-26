import { NextRequest, NextResponse } from 'next/server';
import { isValidShareCode } from '@/features/forms/lib/shareLink';
import { publicOrigin } from '@/utils/requestOrigin';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const origin = publicOrigin(request);
    const apiOrigin = request.nextUrl.origin;
    const unavailable = new URL('/s/unavailable', origin);
    const { code } = await params;

    if (!isValidShareCode(code)) return NextResponse.redirect(unavailable);

    try {
        const response = await fetch(
            new URL(
                `/api/v1/forms/share/${encodeURIComponent(code)}`,
                apiOrigin
            ),
            { cache: 'no-store' }
        );

        if (!response.ok) return NextResponse.redirect(unavailable);

        const payload = (await response.json()) as {
            data?: { formId?: string };
        };
        const formId = payload.data?.formId;

        if (!formId || !/^[0-9a-fA-F]{24}$/.test(formId)) {
            return NextResponse.redirect(unavailable);
        }

        return NextResponse.redirect(new URL(`/forms/v/${formId}`, origin));
    } catch {
        return NextResponse.redirect(unavailable);
    }
}
