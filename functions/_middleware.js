// Run for every path so the old hostname redirects pages, assets and APIs alike.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'podium-air-website.pages.dev') {
    url.hostname = 'podiumair.pages.dev';
    return Response.redirect(url.toString(), 301);
  }
  const response = await context.next();
  if (/^\/testers(?:\.html)?\/?$/.test(url.pathname) || url.pathname === '/testers-builds.json') {
    const hiddenResponse = new Response(response.body, response);
    hiddenResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    hiddenResponse.headers.set('Cache-Control', 'no-store');
    return hiddenResponse;
  }
  return response;
}
