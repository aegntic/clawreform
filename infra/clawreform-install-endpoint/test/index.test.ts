import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vite-plus/test";
import {
	createEndpointHandler,
	type EndpointDependencies,
	type EndpointEnv,
	type EndpointHandler,
	type ScriptStore,
} from "../src/endpoint.ts";
import { INSTALL_COMMIT } from "../src/pin.ts";

const HOST = "https://get.clawreform.com";
const RAW = "https://raw.githubusercontent.com";
const COMMIT = INSTALL_COMMIT;
const START = 1_700_000_000_000;
const ENV: EndpointEnv = { INSTALL_REF: COMMIT };
const SH_URL = `${RAW}/aegntic/clawreform/${COMMIT}/scripts/install.sh`;
const PS1_URL = `${RAW}/aegntic/clawreform/${COMMIT}/scripts/install.ps1`;

const CLAWREFORM_SH = [
	"#!/usr/bin/env bash",
	'REPO="${CLAWREFORM_REPO:-aegntic/clawreform}"',
	'INSTALL_DIR="${CLAWREFORM_INSTALL_DIR:-$HOME/.clawreform/bin}"',
	'URL="https://github.com/$REPO/releases/download/$VERSION/clawreform-$PLATFORM.tar.gz"',
	"",
].join("\n");

const OTHER_PRODUCT_SH = [
	"#!/usr/bin/env bash",
	'REPO="RightNow-AI/openfang"',
	'INSTALL_DIR="$HOME/.openfang/bin"',
	'URL="https://github.com/$REPO/releases/download/$VERSION/openfang-$PLATFORM.tar.gz"',
	"",
].join("\n");

const CLAWREFORM_PS1 = [
	'$Repo = if ($env:CLAWREFORM_REPO) { $env:CLAWREFORM_REPO } else { "aegntic/clawreform" }',
	'$archive = "clawreform-${target}.zip"',
	'Copy-Item -Path $exePath -Destination (Join-Path $InstallDir "clawreform.exe") -Force',
	"",
].join("\n");

/** An in-memory replacement for the Cloudflare cache. */
class MemoryStore implements ScriptStore {
	private readonly entries = new Map<string, Response>();

	async match(request: Request): Promise<Response | undefined> {
		return this.entries.get(request.url)?.clone();
	}

	async put(request: Request, response: Response): Promise<void> {
		this.entries.set(request.url, response.clone());
	}
}

interface UpstreamResponse {
	readonly status: number;
	readonly body: string;
}

interface Harness {
	readonly handler: EndpointHandler;
	readonly store: MemoryStore;
	/** The URLs that the handler requested from GitHub, in order. */
	readonly requests: string[];
	setClock(milliseconds: number): void;
	get(path: string, init?: RequestInit): Promise<Response>;
}

/** Builds a handler whose GitHub answers come from a queue of scripted responses. */
function harness(upstream: UpstreamResponse[]): Harness {
	const requests: string[] = [];
	const store = new MemoryStore();
	let clock = START;
	const deps: EndpointDependencies = {
		fetchScript: async (url) => {
			requests.push(url);
			const next = upstream.shift();
			if (next === undefined) {
				throw new Error("The test did not plan this request to GitHub.");
			}
			return new Response(next.body, { status: next.status });
		},
		now: () => clock,
		store,
	};
	const handler = createEndpointHandler(deps);
	return {
		handler,
		store,
		requests,
		setClock: (milliseconds) => {
			clock = milliseconds;
		},
		get: (path, init) => handler.fetch(new Request(`${HOST}${path}`, init), ENV),
	};
}

describe("install endpoint", () => {
	it("serves the shell installer at /", async () => {
		const h = harness([{ status: 200, body: CLAWREFORM_SH }]);

		const response = await h.get("/");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("x-installer-source")).toBe("github");
		expect(response.headers.get("x-installer-commit")).toBe(COMMIT);
		expect(await response.text()).toBe(CLAWREFORM_SH);
		expect(h.requests).toEqual([SH_URL]);
	});

	it("serves the same shell installer at /install and /install.sh", async () => {
		const good = { status: 200, body: CLAWREFORM_SH };
		const h = harness([good, good]);

		for (const path of ["/install", "/install.sh"]) {
			const response = await h.get(path);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe(CLAWREFORM_SH);
		}
	});

	it("serves the PowerShell installer at /install.ps1", async () => {
		const h = harness([{ status: 200, body: CLAWREFORM_PS1 }]);

		const response = await h.get("/install.ps1");

		expect(response.status).toBe(200);
		expect(await response.text()).toBe(CLAWREFORM_PS1);
		expect(h.requests).toEqual([PS1_URL]);
	});

	it("does not serve a script that is the installer of a different product", async () => {
		const h = harness([{ status: 200, body: OTHER_PRODUCT_SH }]);

		const response = await h.get("/");

		expect(response.status).toBe(503);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await response.text()).toContain("did not pass the integrity check");
		expect(await h.store.match(new Request(SH_URL))).toBeUndefined();
	});

	it("returns 503 when GitHub answers with an error", async () => {
		const h = harness([{ status: 503, body: "unavailable" }]);

		const response = await h.get("/");

		expect(response.status).toBe(503);
		expect(await response.text()).toContain("GitHub did not answer");
	});

	it("returns 503 when INSTALL_REF is not a full commit hash", async () => {
		const h = harness([]);

		const response = await h.handler.fetch(new Request(`${HOST}/`), { INSTALL_REF: "main" });

		expect(response.status).toBe(503);
		expect(await response.text()).toContain("full commit hash");
		expect(h.requests).toEqual([]);
	});

	it("returns 404 for a path that has no script", async () => {
		const h = harness([]);

		const response = await h.get("/nothing");

		expect(response.status).toBe(404);
		expect(h.requests).toEqual([]);
	});

	it("does not accept a method other than GET and HEAD", async () => {
		const h = harness([]);

		const response = await h.get("/", { method: "POST", body: "x" });

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("GET, HEAD");
		expect(h.requests).toEqual([]);
	});

	it("answers HEAD with the headers and no body", async () => {
		const h = harness([{ status: 200, body: CLAWREFORM_SH }]);

		const response = await h.get("/", { method: "HEAD" });

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("");
	});

	it("uses the stored script and does not contact GitHub again within five minutes", async () => {
		const h = harness([{ status: 200, body: CLAWREFORM_SH }]);
		await h.get("/");

		h.setClock(START + 4 * 60 * 1000);
		const second = await h.get("/");

		expect(second.status).toBe(200);
		expect(second.headers.get("x-installer-source")).toBe("cache");
		expect(h.requests).toHaveLength(1);
	});

	it("serves the stored script when GitHub later returns a different product's script", async () => {
		const h = harness([
			{ status: 200, body: CLAWREFORM_SH },
			{ status: 200, body: OTHER_PRODUCT_SH },
		]);
		await h.get("/");

		h.setClock(START + 6 * 60 * 1000);
		const second = await h.get("/");

		expect(second.status).toBe(200);
		expect(second.headers.get("x-installer-source")).toBe("stale");
		expect(await second.text()).toBe(CLAWREFORM_SH);
	});
});

describe("the Worker that is deployed", () => {
	it("answers a path without a script with 404", async () => {
		const response = await SELF.fetch(`${HOST}/nothing`);

		expect(response.status).toBe(404);
	});
});
