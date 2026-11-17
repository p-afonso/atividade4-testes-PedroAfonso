// Testes criados a partir dos mutantes sobreviventes reportados pelo Stryker.
// Cada bloco cobre um comportamento de fronteira, mensagem de erro ou retorno
// que antes não era verificado.

const Banco = require("../src/banco");
const ContaBancaria = require("../src/contaBancaria");
const DispositivoWearable = require("../src/dispositivoWearable");
const HubIoT = require("../src/hubIoT");
const TextoUtils = require("../src/textoUtils");
const Utilitarios = require("../src/utilitarios");

describe("Banco - fronteiras e estado inicial", () => {
  test("sacar aceita exatamente o saldo disponível", () => {
    const banco = new Banco("Itaú", 100);
    expect(banco.sacar(100)).toBe(0);
  });

  test("histórico começa vazio", () => {
    expect(new Banco("Nubank").obterHistorico()).toEqual([]);
  });
});

describe("ContaBancaria - fronteiras e validações", () => {
  const criarConta = (overrides = {}) =>
    new ContaBancaria({
      id: 1,
      titular: "Ana",
      saldo: 100,
      limite: 50,
      status: "ativa",
      ...overrides,
    });

  test("estaAtiva é falso para conta bloqueada", () => {
    const conta = criarConta({ status: "bloqueada" });
    expect(conta.estaAtiva()).toBe(false);
  });

  test("sacar aceita valor igual ao saldo + limite", () => {
    const conta = criarConta();
    expect(conta.sacar(150)).toBe(true);
    expect(conta.obterSaldo()).toBe(-50);
  });

  test("podeSacar rejeita zero e negativos e aceita o limite exato", () => {
    const conta = criarConta();
    expect(conta.podeSacar(0)).toBe(false);
    expect(conta.podeSacar(-1)).toBe(false);
    expect(conta.podeSacar(150)).toBe(true);
    expect(conta.podeSacar(151)).toBe(false);
  });

  test("ajustarLimite aceita zero", () => {
    const conta = criarConta();
    expect(conta.ajustarLimite(0)).toBe(true);
    expect(conta.obterLimite()).toBe(0);
  });

  test("saldoNegativo é falso quando o saldo é zero", () => {
    expect(criarConta({ saldo: 0 }).saldoNegativo()).toBe(false);
    expect(criarConta({ saldo: -1 }).saldoNegativo()).toBe(true);
  });

  test("validarConta reprova cada campo inválido individualmente", () => {
    expect(criarConta().validarConta()).toBe(true);
    expect(criarConta({ id: undefined }).validarConta()).toBe(false);
    expect(criarConta({ titular: "" }).validarConta()).toBe(false);
    expect(criarConta({ saldo: "100" }).validarConta()).toBe(false);
    expect(criarConta({ limite: -1 }).validarConta()).toBe(false);
    expect(criarConta({ status: "inválida" }).validarConta()).toBe(false);
  });
});

describe("DispositivoWearable - validações e fronteiras", () => {
  test("bateria é limitada entre 0 e 100 no construtor", () => {
    expect(new DispositivoWearable("A", 150).obterNivelBateria()).toBe(100);
    expect(new DispositivoWearable("A", -5).obterNivelBateria()).toBe(0);
  });

  test("registrarBatimento rejeita zero e aceita valores positivos", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.registrarBatimento(0)).toThrow("Batimento inválido");
    expect(w.registrarBatimento(1)).toBe(1);
  });

  test("registrarOxigenacao aceita 0 e 100 e rejeita fora do intervalo", () => {
    const w = new DispositivoWearable("A");
    expect(w.registrarOxigenacao(0)).toBe(1);
    expect(w.registrarOxigenacao(100)).toBe(2);
    expect(() => w.registrarOxigenacao(-1)).toThrow("Oxigenação inválida");
    expect(() => w.registrarOxigenacao(101)).toThrow("Oxigenação inválida");
  });

  test("registrarPassos rejeita decimais e negativos com mensagem exata", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.registrarPassos(1.5)).toThrow("Quantidade de passos inválida");
    expect(() => w.registrarPassos(-1)).toThrow("Quantidade de passos inválida");
    expect(w.registrarPassos(0)).toBe(0);
  });

  test("definirMetaPassos rejeita zero, negativos e decimais", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.definirMetaPassos(0)).toThrow("Meta inválida");
    expect(() => w.definirMetaPassos(-1)).toThrow("Meta inválida");
    expect(() => w.definirMetaPassos(1.5)).toThrow("Meta inválida");
  });

  test("progressoMetaPassos não passa de 100", () => {
    const w = new DispositivoWearable("A");
    w.definirMetaPassos(10);
    w.registrarPassos(50);
    expect(w.progressoMetaPassos()).toBe(100);
  });

  test("registrarSono aceita 0 e 24 e rejeita fora do intervalo", () => {
    const w = new DispositivoWearable("A");
    expect(w.registrarSono(0)).toBe(1);
    expect(w.registrarSono(24)).toBe(2);
    expect(() => w.registrarSono(-1)).toThrow("Duração de sono inválida");
    expect(() => w.registrarSono(25)).toThrow("Duração de sono inválida");
  });

  test("registrarTemperatura rejeita NaN e Infinity", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.registrarTemperatura(NaN)).toThrow("Temperatura inválida");
    expect(() => w.registrarTemperatura(Infinity)).toThrow("Temperatura inválida");
  });

  test("médias e última temperatura vazias retornam valores padrão", () => {
    const w = new DispositivoWearable("A");
    expect(w.mediaBatimentos()).toBe(0);
    expect(w.mediaOxigenacao()).toBe(0);
    expect(w.ultimaTemperatura()).toBeNull();
  });

  test("adicionarAlerta rejeita mensagem vazia e listarAlertas devolve cópia", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.adicionarAlerta("")).toThrow("Mensagem inválida");
    w.adicionarAlerta("Bateria baixa");
    w.listarAlertas().push("externo");
    expect(w.listarAlertas()).toEqual(["Bateria baixa"]);
  });

  test("sincronizar falha quando desconectado", () => {
    const w = new DispositivoWearable("A");
    expect(() => w.sincronizar()).toThrow("Wearable desconectado");
  });

  test("carregarBateria rejeita carga zero ou negativa", () => {
    const w = new DispositivoWearable("A", 50);
    expect(() => w.carregarBateria(0)).toThrow("Carga inválida");
    expect(() => w.carregarBateria(-5)).toThrow("Carga inválida");
  });
});

describe("HubIoT - validações, mensagens e fronteiras", () => {
  let hub;

  beforeEach(() => {
    hub = new HubIoT("Casa");
    hub.adicionarDispositivo("d1", "Lâmpada", "iluminação");
  });

  test("adicionarDispositivo exige id, nome e tipo", () => {
    expect(() => hub.adicionarDispositivo("", "x", "y")).toThrow("Dados do dispositivo inválidos");
    expect(() => hub.adicionarDispositivo("x", "", "y")).toThrow("Dados do dispositivo inválidos");
    expect(() => hub.adicionarDispositivo("x", "y", "")).toThrow("Dados do dispositivo inválidos");
  });

  test("adicionarDispositivo rejeita id duplicado", () => {
    expect(() => hub.adicionarDispositivo("d1", "Outra", "x")).toThrow("Dispositivo já cadastrado");
  });

  test("removerDispositivo retorna false para id inexistente", () => {
    expect(hub.removerDispositivo("nao-existe")).toBe(false);
  });

  test("operações em dispositivo inexistente lançam a mensagem exata", () => {
    const msg = "Dispositivo não encontrado";
    expect(() => hub.obterDispositivo("x")).toThrow(msg);
    expect(() => hub.conectarDispositivo("x")).toThrow(msg);
    expect(() => hub.desconectarDispositivo("x")).toThrow(msg);
    expect(() => hub.estaOnline("x")).toThrow(msg);
    expect(() => hub.ligar("x")).toThrow(msg);
    expect(() => hub.desligar("x")).toThrow(msg);
    expect(() => hub.alternarEstado("x")).toThrow(msg);
    expect(() => hub.registrarLeitura("x", 1)).toThrow(msg);
    expect(() => hub.ultimaLeitura("x")).toThrow(msg);
    expect(() => hub.mediaLeituras("x")).toThrow(msg);
    expect(() => hub.definirLimite("x", 1)).toThrow(msg);
    expect(() => hub.verificarAlerta("x")).toThrow(msg);
    expect(() => hub.atualizarConsumo("x", 1)).toThrow(msg);
  });

  test("ligar, alternarEstado e registrarLeitura exigem dispositivo online", () => {
    expect(() => hub.ligar("d1")).toThrow("Dispositivo offline");
    expect(() => hub.alternarEstado("d1")).toThrow("Dispositivo offline");
    expect(() => hub.registrarLeitura("d1", 1)).toThrow("Dispositivo offline");
  });

  test("desconectarDispositivo também desliga o aparelho", () => {
    hub.conectarDispositivo("d1");
    hub.ligar("d1");
    expect(hub.desconectarDispositivo("d1")).toBe(false);
    expect(hub.obterDispositivo("d1").ligado).toBe(false);
  });

  test("registrarLeitura rejeita valor não numérico", () => {
    hub.conectarDispositivo("d1");
    expect(() => hub.registrarLeitura("d1", NaN)).toThrow("Leitura inválida");
  });

  test("ultimaLeitura e mediaLeituras vazias retornam null e 0", () => {
    expect(hub.ultimaLeitura("d1")).toBeNull();
    expect(hub.mediaLeituras("d1")).toBe(0);
  });

  test("definirLimite rejeita valores não finitos", () => {
    expect(() => hub.definirLimite("d1", NaN)).toThrow("Limite inválido");
  });

  test("verificarAlerta: sem limite é falso; igual ao limite não dispara", () => {
    hub.conectarDispositivo("d1");
    hub.registrarLeitura("d1", 10);
    expect(hub.verificarAlerta("d1")).toBe(false);
    hub.definirLimite("d1", 10);
    expect(hub.verificarAlerta("d1")).toBe(false);
    hub.registrarLeitura("d1", 11);
    expect(hub.verificarAlerta("d1")).toBe(true);
  });

  test("verificarAlerta sem leituras é falso", () => {
    hub.definirLimite("d1", 5);
    expect(hub.verificarAlerta("d1")).toBe(false);
  });

  test("atualizarConsumo aceita zero e rejeita negativo ou não numérico", () => {
    expect(hub.atualizarConsumo("d1", 0)).toBe(0);
    expect(() => hub.atualizarConsumo("d1", -1)).toThrow("Consumo inválido");
    expect(() => hub.atualizarConsumo("d1", NaN)).toThrow("Consumo inválido");
  });

  test("criarAutomacao valida nome, dispositivo e ação", () => {
    expect(() => hub.criarAutomacao("", "d1", "ligar")).toThrow("Automação inválida");
    expect(() => hub.criarAutomacao("noite", "x", "ligar")).toThrow("Dispositivo não encontrado");
    expect(() => hub.criarAutomacao("noite", "d1", "pausar")).toThrow("Ação inválida");
    hub.criarAutomacao("noite", "d1", "ligar");
    expect(() => hub.criarAutomacao("noite", "d1", "ligar")).toThrow("Automação inválida");
  });

  test("executarAutomacao falha para nome inexistente e executa 'desligar'", () => {
    expect(() => hub.executarAutomacao("nada")).toThrow("Automação não encontrada");
    hub.conectarDispositivo("d1");
    hub.ligar("d1");
    hub.criarAutomacao("sair", "d1", "desligar");
    hub.executarAutomacao("sair");
    expect(hub.obterDispositivo("d1").ligado).toBe(false);
  });
});

describe("TextoUtils - fronteiras e mensagens", () => {
  const t = new TextoUtils();

  test("capitalizar preserva espaços duplos", () => {
    expect(t.capitalizar("ola  mundo")).toBe("Ola  Mundo");
  });

  test("contarOcorrencias retorna 0 para substring vazia e conta sobreposições corretamente", () => {
    expect(t.contarOcorrencias("abc", "")).toBe(0);
    expect(t.contarOcorrencias("banana", "na")).toBe(2);
    expect(t.contarOcorrencias("aaa", "a")).toBe(3);
  });

  test("paraSlug converte para minúsculas", () => {
    expect(t.paraSlug("MUNDO")).toBe("mundo");
  });

  test("removerEspacosExtras colapsa qualquer sequência de espaços e tabs", () => {
    expect(t.removerEspacosExtras("a \t  b")).toBe("a b");
  });

  test("truncar aceita tamanho zero e texto no limite exato", () => {
    expect(t.truncar("abc", 0)).toBe("...");
    expect(t.truncar("abc", 3)).toBe("abc");
  });

  test("truncar rejeita tamanho negativo com mensagem exata", () => {
    expect(() => t.truncar("abc", -1)).toThrow("O tamanho não pode ser negativo");
  });

  test("somenteLetras rejeita texto com números no início ou no meio", () => {
    expect(t.somenteLetras("123abc")).toBe(false);
    expect(t.somenteLetras("ab1c")).toBe(false);
    expect(t.somenteLetras("Ação")).toBe(true);
  });

  test("substituirTudo rejeita alvo vazio com mensagem exata", () => {
    expect(() => t.substituirTudo("abc", "", "x")).toThrow("O alvo não pode ser vazio");
  });
});

describe("Utilitarios - casos de fronteira", () => {
  const util = new Utilitarios();

  test("gerarNumeroAleatorio multiplica o random pelo máximo", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    expect(util.gerarNumeroAleatorio(10)).toBe(5);
    Math.random.mockRestore();
  });

  test("ehNumero rejeita NaN e strings numéricas", () => {
    expect(util.ehNumero(NaN)).toBe(false);
    expect(util.ehNumero("1")).toBe(false);
    expect(util.ehNumero(0)).toBe(true);
  });

  test("ehPalindromo mantém caracteres não-alfanuméricos no critério", () => {
    expect(util.ehPalindromo("a!a")).toBe(true);
    expect(util.ehPalindromo("A man, a plan, a canal: Panama")).toBe(true);
  });
});

describe("Banco - juros", () => {
  test("juros de zero não alteram o saldo", () => {
    const banco = new Banco("Caixa", 200);
    expect(banco.aplicarJuros(0)).toBe(200);
  });
});
