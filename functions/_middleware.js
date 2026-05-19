export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname === 'chineseopfietspad.pages.dev') {
    return Response.redirect(
      `https://chinezenopfietspad.nl${url.pathname}${url.search}`,
      301
    );
  }
  return next();
};
