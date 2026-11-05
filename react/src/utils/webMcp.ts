/**
 * WebMCP Tool Registration (Chrome WebMCP / navigator.modelContext)
 * Specification: https://webmachinelearning.github.io/webmcp/
 */

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<unknown> | unknown;
}

interface ModelContextNavigator {
  modelContext?: {
    registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
  };
}

export function registerWebMcpTools(): void {
  if (typeof window === "undefined") return;

  const nav = navigator as unknown as ModelContextNavigator;
  if (!nav.modelContext || typeof nav.modelContext.registerTool !== "function") {
    return;
  }

  try {
    nav.modelContext.registerTool({
      name: "get_taxi_rates",
      description: "Get base per-kilometer rates for vehicles in Agra (Sedan, Ertiga, Innova Crysta, Tempo Traveller, Urbania).",
      inputSchema: {
        type: "object",
        properties: {},
      },
      execute: () => {
        return {
          sedan: "₹10/km",
          ertiga: "₹14/km",
          innova_crysta: "₹18/km",
          tempo_traveller: "₹25/km",
          force_urbania: "₹34/km",
          phone: "+91 97628 17598",
        };
      },
    });

    nav.modelContext.registerTool({
      name: "search_tour_packages",
      description: "Search available sightseeing and outstation tour packages in Agra.",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "City or monument name (e.g. Mathura, Taj Mahal, Delhi)" },
        },
      },
      execute: (input: unknown) => {
        const dest = (input as { destination?: string } | undefined)?.destination;
        return {
          packages: [
            { name: "Agra Same Day Sightseeing Tour", duration: "1 Day", startingPrice: "₹1,900" },
            { name: "Same Day Agra to Mathura Vrindavan Tour", duration: "1 Day", startingPrice: "₹2,800" },
            { name: "Delhi to Agra Same Day Tour", duration: "1 Day", startingPrice: "₹3,499" },
          ],
          filteredFor: dest || "all",
        };
      },
    });
  } catch (err) {
    console.warn("[WebMCP] Registration note:", err);
  }
}
