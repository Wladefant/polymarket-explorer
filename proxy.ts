import { NextRequest, NextResponse } from "next/server";

import { getAuthBaseUrl } from "@/lib/env";

const GATED_PREFIXES = ["/account"];

function isGatedRoute(pathname: string): boolean {
	return GATED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
	const cookie = request.headers.get("cookie");
	if (!cookie) return false;

	try {
		const response = await fetch(`${getAuthBaseUrl()}/api/auth/get-session?disableCookieCache=true`, {
			method: "GET",
			headers: { cookie },
			cache: "no-store",
		});

		if (!response.ok) return false;

		const payload: unknown = await response.json();
		if (!payload || typeof payload !== "object") return false;
		const { session, user } = payload as { session?: unknown; user?: unknown };
		return session != null && user != null;
	} catch {
		return false;
	}
}

export async function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (!isGatedRoute(pathname)) {
		return NextResponse.next();
	}

	const isAuthenticated = await hasValidSession(request);
	if (!isAuthenticated) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|opengraph-image|sitemap|robots.txt|manifest.webmanifest).*)",
	],
};
