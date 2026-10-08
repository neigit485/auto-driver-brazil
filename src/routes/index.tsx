import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { avaliar } from "@/lib/avaliar.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Examinador CNH – Enquadramento de Infrações" },
      { name: "description", content: "Enquadre infrações do exame prático da CNH com artigo, peso e descrição, por texto ou voz." },
      { property: "og:title", content: "Examinador CNH – Enquadramento de Infrações" },
      { property: "og:description", content: "Artigo do CTB, peso e descrição para o exame de direção, por texto ou áudio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Item = { id: string; situacao: string; resposta: string; data: string };
const KEY = "historico-exame-v1";

function falar(t: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t.replace(/---/g, ". Próxima infração. "));
  u.lang = "pt-BR";
  window.speechSynthesis.speak(u);
}

function terceiraLinha(resposta: string) {
  const blocos = resposta.split(/\n\s*---\s*\n/);
  return blocos
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean)[2] ?? "")
    .filter(Boolean)
    .join("\n");
}

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="btn-ghost"
      disabled={!texto}
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? "Copiado ✓" : "Copiar 3ª linha"}
    </button>
  );
}

function Resposta({ texto }: { texto: string }) {
  return (
    <div className="space-y-3">
      {texto.split(/\n\s*---\s*\n/).map((b, i) => {
        const ls = b.split("\n").map((l) => l.trim()).filter(Boolean);
        return (
          <div key={i} className="ficha">
            {ls.map((l, j) => (
              <p key={j} className={j === 0 ? "ficha-peso" : j === 2 ? "ficha-linha3" : "ficha-texto"}>{l}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Index() {
  const run = useServerFn(avaliar);
  const [modo, setModo] = useState<"texto" | "audio">("texto");
  const [situacao, setSituacao] = useState("");
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [hist, setHist] = useState<Item[]>([]);
  const recRef = useRef<any>(null);

  useEffect(() => {
    try { setHist(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);

  const salvar = (h: Item[]) => {
    const v = h.slice(0, 7);
    setHist(v);
    localStorage.setItem(KEY, JSON.stringify(v));
  };

  const gravar = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErro("Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge."); return; }
    if (gravando) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "pt-BR"; r.continuous = true; r.interimResults = true;
    const base = situacao ? situacao + " " : "";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setSituacao(base + t);
    };
    r.onend = () => setGravando(false);
    r.onerror = () => setGravando(false);
    recRef.current = r; r.start(); setGravando(true); setErro("");
  };

  const enviar = async () => {
    if (situacao.trim().length < 3 || carregando) return;
    recRef.current?.stop();
    setCarregando(true); setErro(""); setResposta("");
    try {
      const r = await run({ data: { situacao: situacao.trim() } });
      if (!r.ok) { setErro(r.error); return; }
      setResposta(r.resposta);
      salvar([{ id: crypto.randomUUID(), situacao: situacao.trim(), resposta: r.resposta, data: new Date().toLocaleString("pt-BR") }, ...hist]);
    } catch { setErro("Não foi possível avaliar agora. Tente novamente."); }
    finally { setCarregando(false); }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="eyebrow">DETRAN-MT · MBEDV · CTB</p>
          <h1 className="titulo">Enquadramento de infrações</h1>
          <p className="text-muted-foreground mt-2">Descreva a situação do exame prático e receba artigo, peso e descrição.</p>
        </header>

        <section className="painel space-y-4">
          <div className="seg">
            <button className={modo === "texto" ? "seg-on" : "seg-off"} onClick={() => setModo("texto")}>✍️ Escrita</button>
            <button className={modo === "audio" ? "seg-on" : "seg-off"} onClick={() => setModo("audio")}>🎙️ Áudio</button>
          </div>
          <textarea
            className="campo"
            rows={4}
            value={situacao}
            readOnly={modo === "audio" && gravando}
            onChange={(e) => setSituacao(e.target.value)}
            placeholder={modo === "audio" ? "Toque em Gravar e fale a situação…" : "Ex.: Você deveria ter indicado a seta antes de parar o veículo."}
          />
          <div className="flex flex-wrap gap-2">
            {modo === "audio" && (
              <button className={gravando ? "btn-rec" : "btn-ghost"} onClick={gravar}>
                {gravando ? "⏹ Parar gravação" : "● Gravar"}
              </button>
            )}
            <button className="btn-main" onClick={enviar} disabled={carregando || situacao.trim().length < 3}>
              {carregando ? "Avaliando…" : "Avaliar infração"}
            </button>
            {situacao && <button className="btn-ghost" onClick={() => setSituacao("")}>Limpar</button>}
          </div>
          {erro && <p className="erro">{erro}</p>}
        </section>

        {resposta && (
          <section className="painel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="subtitulo">Resposta</h2>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => falar(resposta)}>🔊 Ouvir</button>
                <Copiar texto={terceiraLinha(resposta)} />
              </div>
            </div>
            <Resposta texto={resposta} />
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="subtitulo">Histórico <span className="text-muted-foreground text-sm">(últimas 7)</span></h2>
            {hist.length > 0 && <button className="btn-ghost" onClick={() => salvar([])}>Apagar</button>}
          </div>
          {hist.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma avaliação ainda.</p>}
          {hist.map((h) => (
            <article key={h.id} className="painel space-y-3">
              <p className="text-xs text-muted-foreground">{h.data}</p>
              <p><strong>Situação:</strong> {h.situacao}</p>
              <Resposta texto={h.resposta} />
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => falar(h.resposta)}>🔊 Ouvir</button>
                <Copiar texto={terceiraLinha(h.resposta)} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
