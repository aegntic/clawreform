import { createEndpointHandler, type EndpointEnv } from "./endpoint.ts";

const UPSTREAM_TIMEOUT_MS = 8_000;

export default createEndpointHandler({
	fetchScript: (url) =>
		fetch(url, {
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
			headers: { Accept: "text/plain" },
		}),
	now: () => Date.now(),
	store: caches.default,
}) satisfies ExportedHandler<EndpointEnv>;
