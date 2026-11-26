/* Treino rápido: classificação de frases (RF × RNF, papéis Scrum, testes, arquiteturas, modelos) */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const SETS = [
    {
      nome: "RF × RNF", ops: ["Funcional", "Não funcional"],
      itens: [
        ["O sistema deve permitir login com usuário e senha.", 0, "Descreve O QUE o sistema faz."],
        ["As senhas devem ser armazenadas criptografadas.", 1, "Segurança: COMO o sistema protege os dados."],
        ["O sistema deve cadastrar, editar e excluir clientes.", 0, "CRUD é funcionalidade."],
        ["A página principal deve carregar em até 1 segundo.", 1, "Desempenho."],
        ["O sistema deve permitir pagamento com cartão de crédito.", 0, "Funcionalidade de negócio."],
        ["O sistema deve ficar disponível 99,9% do tempo.", 1, "Confiabilidade/disponibilidade."],
        ["O usuário deve poder pesquisar produtos por filtro.", 0, "Funcionalidade de busca."],
        ["O sistema deve suportar 1.000 usuários simultâneos.", 1, "Escalabilidade."],
        ["O sistema deve exibir o histórico de pedidos do cliente.", 0, "Funcionalidade."],
        ["O app deve funcionar nas versões recentes de Android e iOS.", 1, "Portabilidade."],
        ["As mensagens de erro devem ser claras para usuários iniciantes.", 1, "Usabilidade."],
        ["O bibliotecário deve registrar empréstimos e devoluções.", 0, "Funcionalidade (exemplo do trabalho)."],
        ["Não pode haver perda de dados em caso de queda de energia.", 1, "Confiabilidade."],
        ["O sistema deve calcular multa por atraso na devolução.", 0, "Regra de negócio = funcionalidade."],
        ["Uma transação deve ser processada em menos de 3 segundos.", 1, "Desempenho."],
        ["Somente usuários autorizados podem ver dados sensíveis.", 1, "Segurança (restrição de acesso)."]
      ]
    },
    {
      nome: "Papéis do Scrum", ops: ["Product Owner", "Scrum Master", "Equipe de desenvolvimento"],
      itens: [
        ["Prioriza os itens do backlog do produto.", 0, "O PO gerencia e prioriza o backlog do produto."],
        ["Remove obstáculos que atrapalham a equipe.", 1, "Função clássica do facilitador."],
        ["Define a meta do sprint.", 0, "A meta do sprint é definida pelo PO."],
        ["É o único que pode encerrar ou estender um sprint.", 0, "Pegadinha frequente: é o PO, não o SM."],
        ["Conduz a reunião diária (daily).", 1, "O Scrum Master conduz a daily."],
        ["Define como fazer o trabalho e quando o incremento está pronto.", 2, "A equipe é auto-organizada."],
        ["Lidera a retrospectiva do sprint.", 1, "O SM lidera a retrospectiva."],
        ["Não pode adicionar tarefas ao sprint sem cancelá-lo ou reiniciá-lo.", 2, "Restrição da equipe de desenvolvimento."],
        ["Ajuda o PO a gerenciar o backlog e orienta a equipe no Scrum.", 1, "Papel de apoio do SM."],
        ["Grupo de 3 a 6 pessoas que constrói o incremento.", 2, "Tamanho típico da equipe."]
      ]
    },
    {
      nome: "Tipos de teste", ops: ["Caixa-branca", "Caixa-preta", "Unitário", "Integração", "Regressão", "Smoke test"],
      itens: [
        ["Avalia a estrutura interna e os caminhos lógicos do código.", 0, "Caixa-branca olha por dentro."],
        ["QA testa a interface com base nos requisitos, sem ver o código.", 1, "Caixa-preta: só entradas e saídas."],
        ["Testa uma função ou classe isolada, de forma rápida e automatizada.", 2, "Teste unitário."],
        ["Verifica se o módulo de pedidos funciona junto com o de pagamentos.", 3, "Integração entre módulos."],
        ["Após uma correção, confirma que o que já funcionava continua funcionando.", 4, "Regressão."],
        ["Checagem rápida logo após o deploy para ver se o sistema está de pé.", 5, "Smoke test = estabilidade básica."],
        ["Mede a cobertura de código dos testes.", 0, "Cobertura é métrica estrutural (caixa-branca)."],
        ["Testa Calculadora.Somar(2, 3) com [Fact] no xUnit.", 2, "Unitário."]
      ]
    },
    {
      nome: "Arquiteturas", ops: ["MVC", "MVVM", "Hexagonal", "Clean"],
      itens: [
        ["O Controller recebe a requisição e coordena Model e View.", 0, "MVC."],
        ["A View se atualiza sozinha via data binding com o ViewModel.", 1, "MVVM."],
        ["O domínio expõe ports e o mundo externo se liga por adapters.", 2, "Hexagonal (Ports and Adapters)."],
        ["Entities, Use Cases, Interface Adapters e Frameworks & Drivers.", 3, "Camadas da Clean Architecture."],
        ["Dependency Rule: dependências só apontam para dentro.", 3, "Regra central da Clean."],
        ["Comum em Rails, Laravel e Django em páginas renderizadas no servidor.", 0, "MVC web tradicional."],
        ["Desvantagem típica: God Controllers.", 0, "Controllers inchados no MVC."],
        ["Usada em WPF, SwiftUI, Android ViewModel e Angular.", 1, "MVVM."],
        ["Trocar o banco de dados sem afetar o núcleo graças a interfaces.", 2, "Hexagonal (também vale para Clean, mas a ideia de ports/adapters é Hexagonal)."],
        ["Criada por Robert C. Martin (Uncle Bob).", 3, "Clean Architecture."]
      ]
    },
    {
      nome: "Modelos de ciclo de vida", ops: ["Cascata", "Modelo V", "Incremental", "Espiral", "Prototipagem"],
      itens: [
        ["Cada fase só começa após a conclusão da anterior; requisitos estáveis.", 0, "Cascata."],
        ["Cada fase de desenvolvimento tem um teste correspondente (V&V).", 1, "Modelo V."],
        ["O produto é entregue em partes, cada uma acrescentando funcionalidade.", 2, "Incremental."],
        ["Antes de cada fase é feita uma análise de riscos.", 3, "Espiral."],
        ["O cliente experimenta um modelo operacional antes da especificação.", 4, "Prototipagem rápida."],
        ["A dimensão radial representa o custo acumulado.", 3, "Espiral."],
        ["Ponto fraco: o cliente só vê o produto funcionando no final.", 0, "Validação tardia do cascata."],
        ["Ideal quando os requisitos são incertos ou o cliente não sabe o que quer.", 4, "Prototipagem."]
      ]
    }
  ];

  let set = 0, fila = [], pos = 0, acertos = 0, feitas = 0;

  function chips() {
    $("#tr-sets").innerHTML = SETS.map((s, i) => `<button type="button" data-i="${i}" class="${i === set ? "active" : ""}">${esc(s.nome)}</button>`).join("");
    $("#tr-sets").querySelectorAll("button").forEach(b => b.addEventListener("click", () => start(+b.dataset.i)));
  }
  function start(i) {
    set = i; fila = shuffle(SETS[i].itens); pos = 0; acertos = 0; feitas = 0;
    chips(); show();
  }
  function show() {
    const s = SETS[set];
    if (pos >= fila.length) {
      $("#tr-pos").textContent = "Fim do conjunto";
      $("#tr-q").textContent = `Você acertou ${acertos} de ${feitas}.`;
      $("#tr-opts").innerHTML = "";
      $("#tr-explic").innerHTML = "";
      const nx = $("#tr-next"); nx.textContent = "Recomeçar"; nx.classList.remove("hidden");
      return;
    }
    const it = fila[pos];
    $("#tr-pos").textContent = `${s.nome} · ${pos + 1} / ${fila.length}`;
    $("#tr-score").textContent = `Acertos: ${acertos}/${feitas}`;
    $("#tr-q").textContent = it[0];
    $("#tr-explic").innerHTML = "";
    $("#tr-next").classList.add("hidden");
    $("#tr-next").textContent = "Próxima →";
    $("#tr-opts").innerHTML = s.ops.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span>${esc(o)}</span></button>`).join("");
    $("#tr-opts").querySelectorAll("button").forEach(b => b.addEventListener("click", () => answer(+b.dataset.k)));
  }
  function answer(k) {
    const it = fila[pos], ok = k === it[1];
    feitas++; if (ok) acertos++;
    $("#tr-opts").querySelectorAll("button").forEach((b, j) => {
      b.disabled = true;
      if (j === it[1]) b.classList.add("correct"); else if (j === k) b.classList.add("wrong");
    });
    $("#tr-explic").innerHTML = `<div class="explic ${ok ? "" : "bad"}"><b>${ok ? "✓ Certo!" : "✗ Resposta: " + esc(SETS[set].ops[it[1]])}</b> ${esc(it[2])}</div>`;
    $("#tr-score").textContent = `Acertos: ${acertos}/${feitas}`;
    $("#tr-next").classList.remove("hidden");
  }
  $("#tr-next").addEventListener("click", () => { if (pos >= fila.length) start(set); else { pos++; show(); } });
  start(0);
})();
