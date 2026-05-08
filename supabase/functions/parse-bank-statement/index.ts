// Parse a bank statement PDF and extract incomes/expenses using Lovable AI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CategoryHint { id: string; name: string; icon: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { pdfBase64, svgContent, categories } = await req.json() as {
      pdfBase64?: string;
      svgContent?: string;
      categories: CategoryHint[];
    };
    if (!pdfBase64 && !svgContent) throw new Error("pdfBase64 or svgContent is required");

    const catList = (categories ?? []).map(c => `- ${c.id} :: ${c.icon} ${c.name}`).join("\n");

    const systemPrompt = `You are Mony, a financial assistant. The user uploads a monthly bank statement (PDF or SVG).
Extract every transaction. Classify each as either an "expense" (money out) or "income" (money in).
For expenses, suggest the best matching category id from this user's categories:
${catList}

If none fits well, set categoryId to null. Detect the user's main salary deposit (largest recurring income that looks like payroll/salary) and return its amount as detectedSalary. Use ISO 8601 dates (YYYY-MM-DD). Amounts must be positive numbers.`;

    const tools = [{
      type: "function",
      function: {
        name: "submit_statement",
        description: "Return all extracted incomes and expenses from the statement.",
        parameters: {
          type: "object",
          properties: {
            detectedSalary: { type: ["number", "null"], description: "Detected monthly salary amount, if any." },
            statementMonth: { type: ["string", "null"], description: "Month covered by the statement in YYYY-MM format." },
            incomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  description: { type: "string" },
                  type: { type: "string", description: "e.g. salary, refund, transfer, other" },
                  date: { type: "string", description: "ISO date" },
                },
                required: ["amount", "description", "type", "date"],
                additionalProperties: false,
              },
            },
            expenses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  description: { type: "string" },
                  date: { type: "string" },
                  categoryId: { type: ["string", "null"] },
                  categoryGuess: { type: "string", description: "Friendly category name suggestion" },
                },
                required: ["amount", "description", "date", "categoryId", "categoryGuess"],
                additionalProperties: false,
              },
            },
          },
          required: ["detectedSalary", "statementMonth", "incomes", "expenses"],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          pdfBase64
            ? {
                role: "user",
                content: [
                  { type: "text", text: "Extract all transactions from this monthly bank statement." },
                  { type: "file", file: { filename: "statement.pdf", file_data: `data:application/pdf;base64,${pdfBase64}` } },
                ],
              }
            : {
                role: "user",
                content: `Extract all transactions from this monthly bank statement provided as SVG markup. Read the visible text content (including tables) and ignore styling.\n\n<svg-statement>\n${svgContent}\n</svg-statement>`,
              },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_statement" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI parsing failed", details: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-bank-statement error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
