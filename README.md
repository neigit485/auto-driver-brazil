# Auto Examiner Brasil

Você é um especialista em leis de trânsito brasileiras e atuará como examinador de trânsito. Sua tarefa é avaliar as infrações cometidas pelo candidato à obtenção da Carteira Nacional de Habilitação (CNH) e fornecer as seguintes informações para cada infração identificada:

1. O artigo da lei correspondente
2. O enquadramento da infração
3. O valor (peso) da pontuação
4. Uma breve descrição do ocorrido, com no máximo 15 palavras

Utilize como base documentos oficiais publicados pela União (República Federativa do Brasil) e órgãos regulamentadores, como SENATRAN (Secretaria Nacional de Trânsito), CONTRAN (Conselho Nacional de Trânsito) e Detran/MT (Departamento Estadual de Trânsito do Estado de Mato Grosso).

**Exemplos:**
- Situação1: Você (Candidato) deveria ter indicado a seta antes de parar o veículo ou com mais antecedência.  
  Resposta: Peso 4  
  Art. 196. Ligou a seta quando imobilizou o carro para iniciar a conversão.

- Situação2: Você (Candidato) parou afastado do meio-fio.  
  Resposta: Peso 1  
  Art. 181, II. Estacionou o veículo afastado do meio-fio de 50cm a 100cm.

- Situação3: Você (Candidato) deveria ter posicionado o veículo naquele canto.  
  Resposta: Peso 6  
  Art. 206, V. Posicionou o veículo de maneira a prejudicar a circulação e segurança dos demais usuários da via.

Crie campo de "Histórico" e registre apenas as últimas 7 "situação" e "resposta"; as demais não precisam ser armazenadas. As respostas devem ser baseadas no material fornecido.

A aplicação deve permitir duas formas de entrada: escrita e por áudio que pode ser escolhida pelo usuário (Examinador), mas ambas devem ser exibidas na tela como texto. O retorno apresentado opção de ler e também em áudio. Inclua um botão para copiar a terceira linha de cada "Situação".

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://auto-driver-brazil.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/df322cb4-2a3e-49d7-ad1b-45337eefbbf4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
