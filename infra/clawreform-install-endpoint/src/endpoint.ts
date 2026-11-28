/**
 * Install endpoint for clawREFORM by aegntic.ai.
 *
 * Serves the install scripts from the clawreform repository at one pinned commit:
 *
 *   GET /             -> scripts/install.sh
 *   GET /install      -> scripts/install.sh
 *   GET /install.sh   -> scripts/install.sh
 *   GET /install.ps1  -> scripts/install.ps1
 *
 * Users pipe these scripts into a shell. The endpoint therefore fails closed.
 * It serves a script only when that script is the clawREFORM installer. When
 * the pinned commit holds a different script, or GitHub does not answer, it
 * serves the last script that passed the check, or it returns 503.
 *
 * `createHandler` takes its dependencies as arguments, so that tests can pass
 * stubs. `src/index.ts` wires the real ones.
 */

export interface EndpointEnv {
	/** Full commit hash of the commit that holds the install scripts. */
	readonly INSTALL_REF: string;
}

/** Stores the scripts that passed the check. */
export interface ScriptStore {
	match(request: Request): Promise<Response | undefined>;
	put(request: Request, response: Response): Promise<void>;
}

export interface EndpointDependencies {
	/** Downloads one script. */
	readonly fetchScript: (url: string) => Promise<Response>;
	/** Returns the current time in milliseconds. */
	readonly now: () => number;
	readonly store: ScriptStore;
}

const REPOSITORY = "aegntic/clawreform";
const UPSTREAM_ORIGIN = "https://raw.githubusercontent.com";
const MAX_SCRIPT_BYTES = 128 * 1024;
/** A stored script is used without contacting GitHub for this long. */
const FRESH_FOR_MS = 5 * 60 * 1000;
/** A stored script stays available as a fallback for this long. */
const STORE_FOR_SECONDS = 24 * 60 * 60;
/** A client may cache a script for this long. */
const CLIENT_CACHE_SECONDS = 60;
const COMMIT_HASH = /^[0-9a-f]{40}$/;

interface ScriptSpec {
	/** Path of the script in the repository. */
	readonly file: string;
	/** Text that the clawREFORM installer contains. */
	readonly required: readonly string[];
	/** Text that the installer of a different product contains. */
	readonly forbidden: readonly string[];
}

const SHELL: ScriptSpec = {
	file: "scripts/install.sh",
	required: ["aegntic/clawreform", "clawreform-$PLATFORM.tar.gz", ".clawreform/bin"],
	forbidden: ["RightNow-AI/openfang", "openfang-$PLATFORM", "openfang.sh"],
};

const POWERSHELL: ScriptSpec = {
	file: "scripts/install.ps1",
	required: ['"aegntic/clawreform"', "clawreform-${target}.zip", "clawreform.exe"],
	forbidden: ["RightNow-AI/openfang", "openfang-${target}", "openfang.sh"],
};

const ROUTES: Readonly<Record<string, ScriptSpec>> = {
	"/": SHELL,
	"/install": SHELL,
	"/install.sh": SHELL,
	"/install.ps1": POWERSHELL,
};

const RELEASES = `https://github.com/${REPOSITORY}/releases`;

type ScriptResult =
	| {
			readonly ok: true;
			readonly script: string;
			readonly source: "github" | "cache" | "stale";
	  }
	| { readonly ok: false; readonly body: string };

export function isClawreformInstaller(script: string, spec: ScriptSpec): boolean {
	const hasAllRequired = spec.required.every((marker) => script.includes(marker));
	const hasNoForbidden = spec.forbidden.every((marker) => !script.includes(marker));
	return hasAllRequired && hasNoForbidden;
}

export function upstreamUrl(commit: string, spec: ScriptSpec): string {
	return `${UPSTREAM_ORIGIN}/${REPOSITORY}/${commit}/${spec.file}`;
}

function textResponse(
	request: Request,
	status: number,
	body: string,
	headers: Record<string, string> = {},
): Response {
	return new Response(request.method === "HEAD" ? null : body, {
		status,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
			"Content-Security-Policy": "default-src 'none'",
			"X-Frame-Options": "DENY",
			...headers,
		},
	});
}

const unavailable = (reason: string): string =>
	`clawREFORM installer: not served. ${reason} Download from ${RELEASES}.\n`;

async function loadScript(
	deps: EndpointDependencies,
	upstream: string,
	spec: ScriptSpec,
): Promise<ScriptResult> {
	// Only scripts that passed the check are stored under this key.
	const key = new Request(upstream, { method: "GET" });
	const stored = await deps.store.match(key);
	const fallback = stored === undefined ? null : await stored.text();
	if (stored !== undefined && fallback !== null) {
		const storedAt = Number(stored.headers.get("x-stored-at"));
		if (deps.now() - storedAt < FRESH_FOR_MS) {
			return { ok: true, script: fallback, source: "cache" };
		}
	}

	try {
		const upstreamResponse = await deps.fetchScript(upstream);
		if (!upstreamResponse.ok) {
			throw new Error(`GitHub answered ${upstreamResponse.status}`);
		}
		const script = await upstreamResponse.text();
		if (script.length > MAX_SCRIPT_BYTES) {
			throw new Error("The script is larger than the size limit");
		}
		if (!isClawreformInstaller(script, spec)) {
			if (fallback !== null) {
				return { ok: true, script: fallback, source: "stale" };
			}
			return {
				ok: false,
				body: unavailable("The script at the pinned commit did not pass the integrity check."),
			};
		}

		await deps.store.put(
			key,
			new Response(script, {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Cache-Control": `max-age=${STORE_FOR_SECONDS}`,
					"X-Stored-At": String(deps.now()),
				},
			}),
		);
		return { ok: true, script, source: "github" };
	} catch {
		if (fallback !== null) {
			return { ok: true, script: fallback, source: "stale" };
		}
		return { ok: false, body: unavailable("GitHub did not answer.") };
	}
}

export interface EndpointHandler {
	fetch(request: Request, env: EndpointEnv): Promise<Response>;
}

export function createEndpointHandler(deps: EndpointDependencies): EndpointHandler {
	return {
		async fetch(request, env): Promise<Response> {
			if (request.method !== "GET" && request.method !== "HEAD") {
				return textResponse(request, 405, "Method not allowed. Use GET.\n", {
					Allow: "GET, HEAD",
					"Cache-Control": "no-store",
				});
			}

			const { pathname } = new URL(request.url);
			const spec = ROUTES[pathname];
			if (!spec) {
				return textResponse(request, 404, "Not found. Use / or /install.ps1.\n", {
					"Cache-Control": "no-store",
				});
			}

			// A full commit hash cannot change. A branch name can.
			const commit = String(env.INSTALL_REF ?? "").trim();
			if (!COMMIT_HASH.test(commit)) {
				return textResponse(request, 503, unavailable("INSTALL_REF must be a full commit hash."), {
					"Cache-Control": "no-store",
				});
			}

			const result = await loadScript(deps, upstreamUrl(commit, spec), spec);
			if (!result.ok) {
				return textResponse(request, 503, result.body, { "Cache-Control": "no-store" });
			}

			return textResponse(request, 200, result.script, {
				"Cache-Control": `public, max-age=${CLIENT_CACHE_SECONDS}`,
				"X-Installer-Commit": commit,
				"X-Installer-Source": result.source,
			});
		},
	};
}
