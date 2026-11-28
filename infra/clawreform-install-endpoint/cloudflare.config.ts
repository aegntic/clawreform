import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };
import { INSTALL_COMMIT } from "./src/pin.ts";

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
