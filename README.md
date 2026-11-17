# Atividade 4 – Mutation Tests com Stryker

Projeto da prova 01 (testes unitários com Jest) estendido com **testes de mutação** usando o [Stryker Mutator](https://stryker-mutator.io/).

## Ideia

Testes unitários dizem se o código *passa* nos casos de teste. Testes de mutação dizem se os testes *são capazes de detectar erros*: o Stryker cria cópias do código com pequenas alterações (mutantes), por exemplo trocar `>` por `>=`, `+` por `-`, ou remover um `return`, e roda a suíte para cada uma. Se a suíte continua passando, o mutante **sobreviveu**, ou seja, há um comportamento que nenhum teste verifica.

- **Mutante morto (killed):** algum teste falhou com a alteração. Bom sinal.
- **Mutante sobrevivente (survived):** nenhum teste falhou. Indica lacuna nos testes.
- **Mutation score** = mutantes mortos / mutantes válidos.

## Como executar

Pré-requisito: Node.js >= 20.

```bash
npm install
npm run test        # testes unitários (Jest)
npm run coverage    # testes com cobertura
npm run mutation    # testes de mutação (Stryker)
```

O relatório HTML fica em `reports/mutation/mutation.html`.

## Configuração do Stryker

Arquivo `stryker.config.mjs`:

- `testRunner: "jest"`: usa o Jest já existente no projeto.
- `mutate`: apenas `src/**/*.js`.
- `coverageAnalysis: "off"` e `concurrency: 2`: evitam estouro de memória no Windows (com `perTest` e concorrência padrão o processo filho travava por falta de memória).
- Reporters: `clear-text` (no terminal), `progress`, `html` e `json`.

## Resultados

| Momento | Testes | Mutantes mortos | Sobreviventes | Mutation score |
|---|---|---|---|---|
| Prova 01 (testes originais) | 148 | 575 | 145 | **79,86%** |
| Após testes de mutação | 194 | 698 | 22 | **96,94%** |

Os testes novos estão em `test/mutation-killers.test.js` e foram escritos a partir dos mutantes sobreviventes do primeiro relatório. Eles cobrem:

- **Fronteiras de comparação:** `>` vs `>=`, `<` vs `<=`, valores exatamente no limite (ex.: `sacar` com saldo + limite exato, `truncar` com tamanho igual ao texto).
- **Mensagens de erro exatas:** `toThrow("...")` em vez de apenas verificar que lança erro.
- **Retornos de estado vazio:** médias sem leituras retornando `0`, `ultimaTemperatura` retornando `null`.
- **Validações de entrada:** NaN, Infinity, decimais, valores negativos.

### Sobreviventes restantes

Os 22 mutantes que restaram são, em sua maioria:

- **Equivalentes:** não mudam o comportamento observável. Ex.: `dirigir(0)` com `>= 0` ou `toUpperCase` em uma comparação de palíndromo, que é simétrica a maiúsculas/minúsculas.
- **Literais arbitrárias:** o Stryker troca strings por textos como `"Stryker was here!"`, que nenhum teste de lógica deveria verificar.

Esses casos foram deixados de fora de propósito, porque cobri-los teria custo alto sem ganho de qualidade.

## Estrutura do projeto

<ul>
    <li><code>src/</code>: código-fonte (classes e funções testadas)</li>
    <li><code>test/</code>: testes unitários originais e <code>mutation-killers.test.js</code></li>
    <li><code>stryker.config.mjs</code>: configuração do Stryker</li>
    <li><code>.github/workflows/</code>: pipeline de CI com build e testes</li>
</ul>

## Autor

Pedro Afonso
