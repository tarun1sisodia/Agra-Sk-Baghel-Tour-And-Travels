type ReviewContext = {
  request: Request;
  env: {
    ASSETS: {
      fetch(request: Request): Promise<Response>;
    };
  };
};

/**
 * Customer review invitations are tokenized dynamic URLs, while the customer
 * site otherwise keeps real 404 semantics for unknown marketing pages.
 * Serve the built review shell only for this explicit route family.
 */
export async function onRequest(context: ReviewContext): Promise<Response> {
  const shellUrl = new URL(context.request.url);
  shellUrl.pathname = "/review/index.html";
  shellUrl.search = "";
  return context.env.ASSETS.fetch(new Request(shellUrl, context.request));
}
