import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * The commit that holds the install scripts that get.clawreform.com serves.
 * Use a full commit hash. To serve a new version of the scripts, change this
 * hash and run `cf deploy`.
 */
const INSTALL_COMMIT = "19ab4da752b351b626b61630066fb54397ec4f96";

export default defineConfig({
	worker: {
		name: "clawreform-install-endpoint",
		compatibilityDate: "2026-11-23",
		entrypoint,
		// The Worker runs only on its custom domain.
		workersDev: false,
		domains: ["get.clawreform.com"],
		env: {
			INSTALL_REF: bindings.text(INSTALL_COMMIT),
		},
	},
});
