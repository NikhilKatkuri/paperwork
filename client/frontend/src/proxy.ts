import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CookiesConfigs = {
  refreshToken: "refreshToken",
};

async function proxy(req: NextRequest) {
  const cookieStore = await cookies();

  if (
    cookieStore.has(CookiesConfigs.refreshToken) &&
    req.nextUrl.pathname !== "/user"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/user";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default proxy;
