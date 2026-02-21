import { createRequestHandler } from "react-router";
import { handleNhlApi } from "./nhl-api";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	fetch(request, env, ctx) {
		const url = new URL(request.url);
		
		// Route NHL API requests to the API handler
		if (url.pathname.startsWith("/nhl/")) {
			return handleNhlApi(request, env);
		}
		
		// All other requests go to React Router
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
