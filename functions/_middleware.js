// Run for every path so the old hostname redirects pages, assets and APIs alike.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'podium-air-website.pages.dev') {
    url.hostname = 'podiumair.pages.dev';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
