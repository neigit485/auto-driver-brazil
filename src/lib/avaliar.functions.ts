import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `Você é examinador de trânsito do DETRAN-MT, especialista no CTB, nas Resoluções do CONTRAN, no Manual Brasileiro de Exames de Direção Veicular (MBEDV/SENATRAN) e nas normas do DETRAN-MT.
Avalie a situação descrita pelo examinador e identifique a(s) infração(ões) do candidato, baseando-se EXCLUSIVAMENTE no material de referência abaixo.
Pesos: leve = 1, média = 2, grave = 4, gravíssima = 6.

Para CADA infração responda EXATAMENTE em 3 linhas, sem markdown, sem marcadores:
Peso N
Enquadramento: Art. X[, inciso] – texto do enquadramento legal (gravidade)
Art. X[, inciso]. Descrição do ocorrido em no máximo 15 palavras, no passado, terceira pessoa.

Separe infrações diferentes com uma linha contendo apenas ---.
Exemplos de terceira linha: "Art. 196. Ligou a seta quando imobilizou o carro para iniciar a conversão." / "Art. 181, II. Estacionou o veículo afastado do meio-fio de 50cm a 100cm." / "Art. 206, V. Posicionou o veículo de maneira a prejudicar a circulação e segurança dos demais usuários da via."
A descrição do examinador é curta: escolha sempre o enquadramento mais provável do material (ex.: "parou afastado do meio-fio" = Art. 181, II, Peso 1). Quando faltar detalhe (distância, local, etc.), assuma a hipótese mais comum no exame (ex.: afastamento de 50cm a 100cm) e enquadre; nunca recuse por falta de detalhe. Só responda "Sem enquadramento" se claramente não houver infração.

MATERIAL DE REFERÊNCIA:
`;

export const avaliar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ situacao: z.string().min(3).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { KNOWLEDGE } = await import("./knowledge");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "Chave de IA não configurada." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: SYSTEM + KNOWLEDGE },
          { role: "user", content: `Situação: ${data.situacao}` },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      let msg = `Erro ${res.status}`;
      try {
        const j = await res.json();
        msg = j?.error?.message || j?.message || msg;
      } catch {}
      if (res.status === 429) msg = "Muitas solicitações. Aguarde um instante e tente novamente.";
      if (res.status === 402) msg = "Créditos de IA esgotados. Adicione créditos ao workspace.";
      return { ok: false as const, error: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "error" || ev.type === "response.failed")
            return { ok: false as const, error: ev.message || ev.response?.error?.message || "Falha na IA." };
        } catch {}
      }
    }
    out = out.trim();
    if (!out) return { ok: false as const, error: "A IA não retornou resposta." };
    return { ok: true as const, resposta: out };
  });
