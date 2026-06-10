import { importEvents } from "./events/importer";
import { importDutyPharmacies } from "./pharmacies/importer";
import { handleRequest } from "./api";

function errorResponse(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { code, message } }, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error(JSON.stringify({ message: "events_api_error", error: String(error) }));
      return errorResponse("internal_error", "Unexpected server error.", 500);
    }
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    const controller = _controller as ScheduledController;
    ctx.waitUntil(
      Promise.all([
        importDutyPharmacies(env).then((summary) => {
          console.log(JSON.stringify({ message: "duty_pharmacy_import_complete", ...summary }));
        }),
        controller.cron === "15 4 * * *"
          ? importEvents(env).then((summary) => {
              console.log(JSON.stringify({ message: "events_import_complete", ...summary }));
            })
          : Promise.resolve(),
      ]),
    );
  },
} satisfies ExportedHandler<Env>;
