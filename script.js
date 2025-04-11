// Modelo de dados
let dados = {
    oficinas: [],
    educadores: [],
    turmas: [],
    agendamentos: []
};

// Variáveis globais
let currentCalendarDate = new Date(); // For the main Agendamentos calendar
let dashboardCalendarDate = new Date(); // For the Dashboard calendar
let currentEditId = null;
let currentEditType = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do localStorage
    carregarDados();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar forms
    setupForms();
    
    // Configurar eventos de UI
    setupUIEvents();
    
    // Renderizar listas e calendários
    renderizarTudo();
    
    // Atualizar o dashboard (contadores)
    atualizarDashboard();
});

// Função para carregar dados do localStorage
function carregarDados() {
    const dadosSalvos = localStorage.getItem('gerenciadorOficinasData');
    if (dadosSalvos) {
        try {
            dados = JSON.parse(dadosSalvos);
            // Garantir que os arrays existam se o save estiver corrompido
            dados.oficinas = dados.oficinas || [];
            dados.educadores = dados.educadores || [];
            dados.turmas = dados.turmas || [];
            dados.agendamentos = dados.agendamentos || [];
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            mostrarNotificacao("Erro ao carregar dados salvos", "error");
            // Resetar para estado vazio em caso de erro grave de parse
             dados = { oficinas: [], educadores: [], turmas: [], agendamentos: [] };
        }
    } else {
        // Dados de exemplo para facilitar testes (se não houver dados salvos)
        dados = {
            oficinas: [
                { id: gerarId(), nome: "Música", cargaHoraria: 20, descricao: "Aulas de teoria musical e prática instrumental" },
                { id: gerarId(), nome: "Teatro", cargaHoraria: 15, descricao: "Expressão corporal e artes cênicas" },
                { id: gerarId(), nome: "Pintura", cargaHoraria: 10, descricao: "Técnicas de pintura em tela" }
            ],
            educadores: [
                { id: gerarId(), nome: "Ana Silva", email: "ana.silva@exemplo.com", telefone: "(11) 98765-4321" },
                { id: gerarId(), nome: "Pedro Santos", email: "pedro.santos@exemplo.com", telefone: "(11) 91234-5678" }
            ],
            turmas: [
                { id: gerarId(), nome: "Turma A", periodo: "Manhã", observacoes: "Crianças de 7 a 10 anos" },
                { id: gerarId(), nome: "Turma B", periodo: "Tarde", observacoes: "Adolescentes de 11 a 14 anos" }
            ],
            agendamentos: [
                { 
                    id: gerarId(), 
                    oficinaId: 1, // Assumindo que os IDs gerados para oficinas de exemplo começam em 1 ou similar
                    educadorId: 1, // Assumindo que os IDs gerados para educadores de exemplo começam em 1 ou similar
                    turmaId: 1, // Assumindo que os IDs gerados para turmas de exemplo começam em 1 ou similar
                    data: new Date().toISOString().split('T')[0], 
                    horaInicio: "09:00", 
                    horaFim: "11:00", 
                    observacoes: "Primeira aula do semestre" 
                }
            ]
        };
        // Atribuir IDs consistentes aos dados de exemplo se necessário para o agendamento de exemplo funcionar
        if (dados.oficinas.length > 0) dados.oficinas[0].id = 1;
        if (dados.educadores.length > 0) dados.educadores[0].id = 1;
        if (dados.turmas.length > 0) dados.turmas[0].id = 1;
        if (dados.agendamentos.length > 0) {
             dados.agendamentos[0].oficinaId = dados.oficinas[0]?.id || gerarId();
             dados.agendamentos[0].educadorId = dados.educadores[0]?.id || gerarId();
             dados.agendamentos[0].turmaId = dados.turmas[0]?.id || gerarId();
        }

        salvarDados();
    }
}

// Funções para gerenciar a navegação
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            
            // Esconder todas as seções
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Mostrar a seção selecionada
            const targetElement = document.getElementById(target);
            if (targetElement) {
                 targetElement.classList.remove('hidden');
            }
            
            // Atualizar estilos dos botões
            document.querySelectorAll('.nav-button').forEach(btn => {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('bg-gray-300', 'text-gray-800');
            });
            
            button.classList.remove('bg-gray-300', 'text-gray-800');
            button.classList.add('bg-indigo-600', 'text-white');

            // Re-renderizar calendário do dashboard se ele for selecionado
            if (target === 'dashboard') {
                renderizarDashboardCalendario();
            }
        });
    });
}

// Configurar formulários
function setupForms() {
    // Form de Oficina
    document.getElementById('form-oficina')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('oficina-nome').value;
        const cargaHoraria = parseFloat(document.getElementById('oficina-carga').value);
        const descricao = document.getElementById('oficina-descricao').value;
        
        if (!nome || !cargaHoraria || isNaN(cargaHoraria) || cargaHoraria <= 0) {
            mostrarNotificacao("Preencha nome e carga horária válida (> 0)", "error");
            return;
        }
        
        adicionarOficina(nome, cargaHoraria, descricao);
        e.target.reset();
    });
    
    // Form de Educador
    document.getElementById('form-educador')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('educador-nome').value;
        const email = document.getElementById('educador-email').value;
        const telefone = document.getElementById('educador-telefone').value;
        
        if (!nome) {
            mostrarNotificacao("Preencha o nome do educador", "error");
            return;
        }
        
        adicionarEducador(nome, email, telefone);
        e.target.reset();
    });
    
    // Form de Turma
    document.getElementById('form-turma')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('turma-nome').value;
        const periodo = document.getElementById('turma-periodo').value;
        const observacoes = document.getElementById('turma-observacoes').value;
        
        if (!nome) {
            mostrarNotificacao("Preencha o nome da turma", "error");
            return;
        }
        
        adicionarTurma(nome, periodo, observacoes);
        e.target.reset();
    });
    
    // Form de Agendamento
    document.getElementById('form-agendamento')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const oficinaId = document.getElementById('agendamento-oficina').value;
        const educadorId = document.getElementById('agendamento-educador').value;
        const turmaId = document.getElementById('agendamento-turma').value;
        const horaInicio = document.getElementById('agendamento-inicio').value;
        const horaFim = document.getElementById('agendamento-fim').value;
        const observacoes = document.getElementById('agendamento-observacoes').value;

        // Coletar todas as datas
        const dateInputs = document.querySelectorAll('#agendamento-datas-container input[name="agendamento-data[]"]');
        const datas = Array.from(dateInputs).map(input => input.value).filter(date => date); // Filtra datas vazias

        if (!oficinaId || !educadorId || !turmaId || datas.length === 0 || !horaInicio || !horaFim) {
            mostrarNotificacao("Preencha todos os campos obrigatórios, incluindo pelo menos uma data", "error");
            return;
        }

        // Verificar se o horário de fim é posterior ao início
        if (horaInicio >= horaFim) {
            mostrarNotificacao("O horário de término deve ser posterior ao horário de início", "error");
            return;
        }

        // Verificar conflitos para cada data
        let conflitoEncontrado = false;
        let datasComConflito = [];
        for (const data of datas) {
            if (verificarConflitosAgendamento(educadorId, data, horaInicio, horaFim)) {
                 datasComConflito.push(data);
                conflitoEncontrado = true;
            }
        }

        if (conflitoEncontrado) {
             mostrarNotificacao(`Conflito de horário para o educador nas datas: ${datasComConflito.join(', ')}`, "error");
            return;
        }

        adicionarAgendamento(oficinaId, educadorId, turmaId, datas, horaInicio, horaFim, observacoes);
        
        // Resetar o formulário, mantendo apenas o primeiro campo de data
        e.target.reset();
        const datasContainer = document.getElementById('agendamento-datas-container');
        if (datasContainer) {
            while (datasContainer.children.length > 1) {
                datasContainer.removeChild(datasContainer.lastChild);
            }
            const firstRemoveButton = datasContainer.querySelector('.remove-date-button');
             if(firstRemoveButton) firstRemoveButton.classList.add('hidden'); // Esconder botão de remover do primeiro
        }
    });
}

// Configurar eventos de UI
function setupUIEvents() {
    // Alternar visualização de agendamentos (Lista/Calendário)
    document.getElementById('view-list')?.addEventListener('click', () => {
        document.getElementById('list-view')?.classList.remove('hidden');
        document.getElementById('calendar-view')?.classList.add('hidden');
        document.getElementById('view-list')?.classList.add('bg-indigo-600', 'text-white');
        document.getElementById('view-list')?.classList.remove('bg-gray-300', 'text-gray-800');
        document.getElementById('view-calendar')?.classList.add('bg-gray-300', 'text-gray-800');
        document.getElementById('view-calendar')?.classList.remove('bg-indigo-600', 'text-white');
    });
    
    document.getElementById('view-calendar')?.addEventListener('click', () => {
        document.getElementById('list-view')?.classList.add('hidden');
        document.getElementById('calendar-view')?.classList.remove('hidden');
        document.getElementById('view-calendar')?.classList.add('bg-indigo-600', 'text-white');
        document.getElementById('view-calendar')?.classList.remove('bg-gray-300', 'text-gray-800');
        document.getElementById('view-list')?.classList.add('bg-gray-300', 'text-gray-800');
        document.getElementById('view-list')?.classList.remove('bg-indigo-600', 'text-white');
        renderizarCalendario(); // Renderiza o calendário principal ao mudar para a view
    });
    
    // Navegação do calendário (Agendamentos)
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderizarCalendario();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderizarCalendario();
    });

    // Navegação do calendário (Dashboard)
    document.getElementById('dashboard-prev-month')?.addEventListener('click', () => {
        dashboardCalendarDate.setMonth(dashboardCalendarDate.getMonth() - 1);
        renderizarDashboardCalendario();
    });
    
    document.getElementById('dashboard-next-month')?.addEventListener('click', () => {
        dashboardCalendarDate.setMonth(dashboardCalendarDate.getMonth() + 1);
        renderizarDashboardCalendario();
    });

    // Filtros de agendamentos
    ['filtro-oficina', 'filtro-educador', 'filtro-turma', 'filtro-periodo'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            renderizarAgendamentos();
        });
    });
    
    // Relatórios
    document.getElementById('gerar-relatorio-educador')?.addEventListener('click', gerarRelatorioEducador);
    document.getElementById('gerar-relatorio-oficinas')?.addEventListener('click', gerarRelatorioOficinas);
    document.getElementById('gerar-relatorio-turma')?.addEventListener('click', gerarRelatorioTurma);
    
    // Configurações
    document.getElementById('exportar-dados')?.addEventListener('click', exportarDados);
    document.getElementById('importar-dados')?.addEventListener('click', importarDados);
    document.getElementById('limpar-dados')?.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita!")) {
            limparDados();
        }
    });
    
    // Fechar modal
    document.getElementById('fechar-modal')?.addEventListener('click', fecharModal);
    
    // Google integrations (placeholder)
    document.getElementById('conectar-google')?.addEventListener('click', () => {
        mostrarNotificacao("Integração com Google não implementada nesta versão", "info");
    });

    // Adicionar/Remover Datas no formulário de Agendamento
    const datasContainer = document.getElementById('agendamento-datas-container');
    const addDateButton = document.getElementById('add-date-button');

    if (datasContainer && addDateButton) {
        addDateButton.addEventListener('click', () => {
            const firstDateDiv = datasContainer.children[0];
            if (!firstDateDiv) return; // Safety check

            const newDateDiv = firstDateDiv.cloneNode(true);
            newDateDiv.querySelector('input[type="date"]').value = ''; // Limpar valor
            const removeButton = newDateDiv.querySelector('.remove-date-button');
            
            if (removeButton) {
                removeButton.classList.remove('hidden'); // Mostrar botão de remover
                removeButton.addEventListener('click', () => {
                    newDateDiv.remove();
                    // Esconder botão de remover do primeiro se só sobrar um
                    if (datasContainer.children.length === 1) {
                        const firstRemoveBtn = datasContainer.querySelector('.remove-date-button');
                         if(firstRemoveBtn) firstRemoveBtn.classList.add('hidden');
                    }
                });
            }
            datasContainer.appendChild(newDateDiv);
            
            // Mostrar botão de remover do primeiro se houver mais de um
            if (datasContainer.children.length > 1) {
                 const firstRemoveBtn = datasContainer.querySelector('.remove-date-button');
                 if(firstRemoveBtn) firstRemoveBtn.classList.remove('hidden');
            }
        });

        // Adicionar listener para o botão de remover do primeiro item (inicialmente escondido)
        const firstRemoveButton = datasContainer.querySelector('.remove-date-button');
        if (firstRemoveButton) {
            firstRemoveButton.addEventListener('click', () => {
                if (datasContainer.children.length > 1) { // Só remove se houver mais de um
                    datasContainer.children[0].remove();
                     // Esconder botão de remover do novo primeiro item se só sobrar um
                    if (datasContainer.children.length === 1) {
                        const newFirstRemoveBtn = datasContainer.querySelector('.remove-date-button');
                         if(newFirstRemoveBtn) newFirstRemoveBtn.classList.add('hidden');
                    }
                }
            });
        }
    }
}

// Funções para gerenciar oficinas
function adicionarOficina(nome, cargaHoraria, descricao = "") {
    const novaOficina = {
        id: gerarId(),
        nome,
        cargaHoraria,
        descricao
    };
    
    dados.oficinas.push(novaOficina);
    salvarDados();
    renderizarOficinas();
    atualizarSelectsOficinas();
    mostrarNotificacao("Oficina adicionada com sucesso");
    atualizarDashboard();
}

function editarOficina(id, nome, cargaHoraria, descricao) {
    const index = dados.oficinas.findIndex(o => o.id === id);
    if (index !== -1) {
        dados.oficinas[index] = { id, nome, cargaHoraria, descricao };
        salvarDados();
        renderizarOficinas();
        atualizarSelectsOficinas();
        mostrarNotificacao("Oficina atualizada com sucesso");
        // Atualizar agendamentos se necessário (nome da oficina pode aparecer em listas/calendários)
        renderizarAgendamentos();
        renderizarCalendario();
        renderizarDashboardCalendario();
        atualizarProximosAgendamentos();
    }
}

function excluirOficina(id) {
    // Verificar se existe algum agendamento usando esta oficina
    const temAgendamentos = dados.agendamentos.some(a => a.oficinaId === id);
    
    if (temAgendamentos) {
        mostrarNotificacao("Não é possível excluir uma oficina com agendamentos. Remova os agendamentos primeiro.", "error");
        return;
    }
    
    dados.oficinas = dados.oficinas.filter(o => o.id !== id);
    salvarDados();
    renderizarOficinas();
    atualizarSelectsOficinas();
    mostrarNotificacao("Oficina excluída com sucesso");
    atualizarDashboard();
}

function renderizarOficinas() {
    const listaOficinas = document.getElementById('lista-oficinas');
    if (!listaOficinas) return;
    
    if (dados.oficinas.length === 0) {
        listaOficinas.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-gray-500 text-sm" colspan="4">Nenhuma oficina cadastrada</td>
            </tr>
        `;
        return;
    }
    
    listaOficinas.innerHTML = dados.oficinas.map(oficina => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${oficina.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap">${oficina.cargaHoraria} horas</td>
            <td class="px-6 py-4 whitespace-normal">${oficina.descricao || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="abrirEdicaoOficina(${oficina.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900" onclick="confirmarExclusao('oficina', ${oficina.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function atualizarSelectsOficinas() {
    const selects = ['agendamento-oficina', 'filtro-oficina'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value; // Salvar valor atual se existir
        const placeholder = select.querySelector('option[value=""]'); // Manter placeholder
        
        select.innerHTML = ''; // Limpar opções existentes
        if (placeholder) select.appendChild(placeholder); // Readicionar placeholder

        dados.oficinas.forEach(oficina => {
            const option = document.createElement('option');
            option.value = oficina.id;
            option.textContent = `${oficina.nome} (${oficina.cargaHoraria}h)`;
            select.appendChild(option);
        });

        // Restaurar valor selecionado se ainda existir
        if (dados.oficinas.some(o => o.id.toString() === currentValue)) {
             select.value = currentValue;
        }
    });
}

function abrirEdicaoOficina(id) {
    const oficina = dados.oficinas.find(o => o.id === id);
    if (!oficina) return;
    
    currentEditId = id;
    currentEditType = 'oficina';
    
    const modalTitulo = document.getElementById('modal-titulo');
    const modalConteudo = document.getElementById('modal-conteudo');
    if (!modalTitulo || !modalConteudo) return;

    modalTitulo.textContent = 'Editar Oficina';
    modalConteudo.innerHTML = `
        <form id="form-editar-oficina" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Nome da Oficina</label>
                <input type="text" id="edit-oficina-nome" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${oficina.nome}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Carga Horária (horas)</label>
                <input type="number" id="edit-oficina-carga" min="1" step="0.5" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${oficina.cargaHoraria}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                <textarea id="edit-oficina-descricao" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" rows="2">${oficina.descricao || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="cancelar-edicao" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar Alterações</button>
            </div>
        </form>
    `;
    
    document.getElementById('cancelar-edicao')?.addEventListener('click', fecharModal);
    document.getElementById('form-editar-oficina')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('edit-oficina-nome').value;
        const cargaHoraria = parseFloat(document.getElementById('edit-oficina-carga').value);
        const descricao = document.getElementById('edit-oficina-descricao').value;
        
        if (!nome || !cargaHoraria || isNaN(cargaHoraria) || cargaHoraria <= 0) {
            mostrarNotificacao("Preencha nome e carga horária válida (> 0)", "error");
            return;
        }
        
        editarOficina(currentEditId, nome, cargaHoraria, descricao);
        fecharModal();
    });
    
    abrirModal();
}

// Funções para gerenciar educadores
function adicionarEducador(nome, email, telefone = "") {
    const novoEducador = {
        id: gerarId(),
        nome,
        email,
        telefone
    };
    
    dados.educadores.push(novoEducador);
    salvarDados();
    renderizarEducadores();
    atualizarSelectsEducadores();
    mostrarNotificacao("Educador adicionado com sucesso");
    atualizarDashboard();
}

function editarEducador(id, nome, email, telefone) {
    const index = dados.educadores.findIndex(e => e.id === id);
    if (index !== -1) {
        dados.educadores[index] = { id, nome, email, telefone };
        salvarDados();
        renderizarEducadores();
        atualizarSelectsEducadores();
        mostrarNotificacao("Educador atualizado com sucesso");
         // Atualizar agendamentos se necessário (nome do educador pode aparecer em listas/calendários)
        renderizarAgendamentos();
        renderizarCalendario();
        renderizarDashboardCalendario();
        atualizarProximosAgendamentos();
    }
}

function excluirEducador(id) {
    // Verificar se existe algum agendamento usando este educador
    const temAgendamentos = dados.agendamentos.some(a => a.educadorId === id);
    
    if (temAgendamentos) {
        mostrarNotificacao("Não é possível excluir um educador com agendamentos. Remova os agendamentos primeiro.", "error");
        return;
    }
    
    dados.educadores = dados.educadores.filter(e => e.id !== id);
    salvarDados();
    renderizarEducadores();
    atualizarSelectsEducadores();
    mostrarNotificacao("Educador excluído com sucesso");
    atualizarDashboard();
}

function renderizarEducadores() {
    const listaEducadores = document.getElementById('lista-educadores');
     if (!listaEducadores) return;

    if (dados.educadores.length === 0) {
        listaEducadores.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-gray-500 text-sm" colspan="4">Nenhum educador cadastrado</td>
            </tr>
        `;
        return;
    }
    
    listaEducadores.innerHTML = dados.educadores.map(educador => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${educador.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap">${educador.email || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">${educador.telefone || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="abrirEdicaoEducador(${educador.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900" onclick="confirmarExclusao('educador', ${educador.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function atualizarSelectsEducadores() {
    const selects = ['agendamento-educador', 'filtro-educador'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
         if (!select) return;

        const currentValue = select.value; // Salvar valor atual
        const placeholder = select.querySelector('option[value=""]'); // Manter placeholder

        select.innerHTML = ''; // Limpar opções
        if (placeholder) select.appendChild(placeholder); // Readicionar placeholder
        
        dados.educadores.forEach(educador => {
             const option = document.createElement('option');
            option.value = educador.id;
            option.textContent = educador.nome;
            select.appendChild(option);
        });

         // Restaurar valor selecionado se ainda existir
        if (dados.educadores.some(e => e.id.toString() === currentValue)) {
             select.value = currentValue;
        }
    });
}

function abrirEdicaoEducador(id) {
    const educador = dados.educadores.find(e => e.id === id);
    if (!educador) return;
    
    currentEditId = id;
    currentEditType = 'educador';
    
    const modalTitulo = document.getElementById('modal-titulo');
    const modalConteudo = document.getElementById('modal-conteudo');
    if (!modalTitulo || !modalConteudo) return;

    modalTitulo.textContent = 'Editar Educador';
    modalConteudo.innerHTML = `
        <form id="form-editar-educador" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Nome do Educador</label>
                <input type="text" id="edit-educador-nome" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${educador.nome}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="edit-educador-email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" value="${educador.email || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Telefone</label>
                <input type="tel" id="edit-educador-telefone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" value="${educador.telefone || ''}">
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="cancelar-edicao" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar Alterações</button>
            </div>
        </form>
    `;
    
    document.getElementById('cancelar-edicao')?.addEventListener('click', fecharModal);
    document.getElementById('form-editar-educador')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('edit-educador-nome').value;
        const email = document.getElementById('edit-educador-email').value;
        const telefone = document.getElementById('edit-educador-telefone').value;
        
        if (!nome) {
            mostrarNotificacao("Preencha o nome do educador", "error");
            return;
        }
        
        editarEducador(currentEditId, nome, email, telefone);
        fecharModal();
    });
    
    abrirModal();
}

// Funções para gerenciar turmas
function adicionarTurma(nome, periodo, observacoes = "") {
    const novaTurma = {
        id: gerarId(),
        nome,
        periodo,
        observacoes
    };
    
    dados.turmas.push(novaTurma);
    salvarDados();
    renderizarTurmas();
    atualizarSelectsTurmas();
    mostrarNotificacao("Turma adicionada com sucesso");
}

function editarTurma(id, nome, periodo, observacoes) {
    const index = dados.turmas.findIndex(t => t.id === id);
    if (index !== -1) {
        dados.turmas[index] = { id, nome, periodo, observacoes };
        salvarDados();
        renderizarTurmas();
        atualizarSelectsTurmas();
        mostrarNotificacao("Turma atualizada com sucesso");
         // Atualizar agendamentos se necessário (nome da turma pode aparecer em listas/calendários)
        renderizarAgendamentos();
        renderizarCalendario();
        renderizarDashboardCalendario();
        atualizarProximosAgendamentos();
    }
}

function excluirTurma(id) {
    // Verificar se existe algum agendamento usando esta turma
    const temAgendamentos = dados.agendamentos.some(a => a.turmaId === id);
    
    if (temAgendamentos) {
        mostrarNotificacao("Não é possível excluir uma turma com agendamentos. Remova os agendamentos primeiro.", "error");
        return;
    }
    
    dados.turmas = dados.turmas.filter(t => t.id !== id);
    salvarDados();
    renderizarTurmas();
    atualizarSelectsTurmas();
    mostrarNotificacao("Turma excluída com sucesso");
}

function renderizarTurmas() {
    const listaTurmas = document.getElementById('lista-turmas');
     if (!listaTurmas) return;

    if (dados.turmas.length === 0) {
        listaTurmas.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-gray-500 text-sm" colspan="4">Nenhuma turma cadastrada</td>
            </tr>
        `;
        return;
    }
    
    listaTurmas.innerHTML = dados.turmas.map(turma => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${turma.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap">${turma.periodo || "-"}</td>
            <td class="px-6 py-4 whitespace-normal">${turma.observacoes || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="abrirEdicaoTurma(${turma.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900" onclick="confirmarExclusao('turma', ${turma.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function atualizarSelectsTurmas() {
    const selects = ['agendamento-turma', 'filtro-turma', 'relatorio-turma'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
         if (!select) return;

        const currentValue = select.value; // Salvar valor atual
        const placeholder = select.querySelector('option[value=""]'); // Manter placeholder

        select.innerHTML = ''; // Limpar opções
        if (placeholder) select.appendChild(placeholder); // Readicionar placeholder
        
        dados.turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma.id;
            option.textContent = `${turma.nome} ${turma.periodo ? `(${turma.periodo})` : ''}`;
            select.appendChild(option);
        });

         // Restaurar valor selecionado se ainda existir
        if (dados.turmas.some(t => t.id.toString() === currentValue)) {
             select.value = currentValue;
        }
    });
}

function abrirEdicaoTurma(id) {
    const turma = dados.turmas.find(t => t.id === id);
    if (!turma) return;
    
    currentEditId = id;
    currentEditType = 'turma';
    
    const modalTitulo = document.getElementById('modal-titulo');
    const modalConteudo = document.getElementById('modal-conteudo');
    if (!modalTitulo || !modalConteudo) return;

    modalTitulo.textContent = 'Editar Turma';
    modalConteudo.innerHTML = `
        <form id="form-editar-turma" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Nome da Turma</label>
                <input type="text" id="edit-turma-nome" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${turma.nome}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Período</label>
                <input type="text" id="edit-turma-periodo" placeholder="Ex: Manhã, Tarde, 2023.1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" value="${turma.periodo || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Observações</label>
                <textarea id="edit-turma-observacoes" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" rows="2">${turma.observacoes || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="cancelar-edicao" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar Alterações</button>
            </div>
        </form>
    `;
    
    document.getElementById('cancelar-edicao')?.addEventListener('click', fecharModal);
    document.getElementById('form-editar-turma')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('edit-turma-nome').value;
        const periodo = document.getElementById('edit-turma-periodo').value;
        const observacoes = document.getElementById('edit-turma-observacoes').value;
        
        if (!nome) {
            mostrarNotificacao("Preencha o nome da turma", "error");
            return;
        }
        
        editarTurma(currentEditId, nome, periodo, observacoes);
        fecharModal();
    });
    
    abrirModal();
}

// Funções para gerenciar agendamentos
function adicionarAgendamento(oficinaId, educadorId, turmaId, datas, horaInicio, horaFim, observacoes = "") {
    let count = 0;
    datas.forEach(data => {
        // Verifica se a data não está vazia antes de criar o agendamento
        if (data) {
            const novoAgendamento = {
                id: gerarId(), // Gerar ID único para cada instância
                oficinaId: parseInt(oficinaId),
                educadorId: parseInt(educadorId),
                turmaId: parseInt(turmaId),
                data,
                horaInicio,
                horaFim,
                observacoes
            };
            dados.agendamentos.push(novoAgendamento);
            count++;
        }
    });

    if (count > 0) {
        salvarDados();
        renderizarAgendamentos();
        renderizarCalendario(); // Atualiza o calendário principal
        mostrarNotificacao(`${count} agendamento(s) adicionado(s) com sucesso`);
        atualizarDashboard();
        atualizarProximosAgendamentos(); // Atualiza a lista de próximos agendamentos
        renderizarDashboardCalendario(); // Update dashboard calendar
    } else {
        mostrarNotificacao("Nenhuma data válida foi fornecida.", "error");
    }
}

// Nota: A função de edição (editarAgendamento) e o modal de edição (abrirEdicaoAgendamento)
// ainda operam em um único agendamento por vez.
function editarAgendamento(id, oficinaId, educadorId, turmaId, data, horaInicio, horaFim, observacoes) {
    // Verificar conflitos (excluindo o agendamento atual)
    if (verificarConflitosAgendamento(educadorId, data, horaInicio, horaFim, id)) {
        mostrarNotificacao("Conflito de horário: este educador já possui um agendamento neste horário", "error");
        return false;
    }

    const index = dados.agendamentos.findIndex(a => a.id === id);
    if (index !== -1) {
        dados.agendamentos[index] = {
            id,
            oficinaId: parseInt(oficinaId),
            educadorId: parseInt(educadorId),
            turmaId: parseInt(turmaId),
            data,
            horaInicio,
            horaFim,
            observacoes
        };
        salvarDados();
        renderizarAgendamentos();
        renderizarCalendario();
        mostrarNotificacao("Agendamento atualizado com sucesso");
        atualizarProximosAgendamentos();
        renderizarDashboardCalendario(); // Update dashboard calendar
        return true;
    }
    return false; // Retorna false se o agendamento não foi encontrado
}

function excluirAgendamento(id) {
    dados.agendamentos = dados.agendamentos.filter(a => a.id !== id);
    salvarDados();
    renderizarAgendamentos();
    renderizarCalendario();
    mostrarNotificacao("Agendamento excluído com sucesso");
    atualizarDashboard();
    atualizarProximosAgendamentos();
    renderizarDashboardCalendario(); // Update dashboard calendar
}

function verificarConflitosAgendamento(educadorId, data, horaInicio, horaFim, excludeId = null) {
    const educadorIdNum = parseInt(educadorId);
    return dados.agendamentos.some(a => {
        if (a.id === excludeId) return false;  // Ignorar o agendamento atual (caso esteja editando)
        if (a.educadorId !== educadorIdNum) return false;
        if (a.data !== data) return false;
        
        // Verificar se há sobreposição de horários
        return (
            (horaInicio >= a.horaInicio && horaInicio < a.horaFim) || // Novo começa durante o existente
            (horaFim > a.horaInicio && horaFim <= a.horaFim) || // Novo termina durante o existente
            (horaInicio <= a.horaInicio && horaFim >= a.horaFim) // Novo engloba o existente
        );
    });
}

function renderizarAgendamentos() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
     if (!listaAgendamentos) return;

    // Filtrar agendamentos
    const filtroOficina = document.getElementById('filtro-oficina')?.value;
    const filtroEducador = document.getElementById('filtro-educador')?.value;
    const filtroTurma = document.getElementById('filtro-turma')?.value;
    const filtroPeriodo = document.getElementById('filtro-periodo')?.value;
    
    let agendamentosFiltrados = dados.agendamentos;
    
    if (filtroOficina) {
        agendamentosFiltrados = agendamentosFiltrados.filter(a => a.oficinaId === parseInt(filtroOficina));
    }
    
    if (filtroEducador) {
        agendamentosFiltrados = agendamentosFiltrados.filter(a => a.educadorId === parseInt(filtroEducador));
    }
    
    if (filtroTurma) {
        agendamentosFiltrados = agendamentosFiltrados.filter(a => a.turmaId === parseInt(filtroTurma));
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (filtroPeriodo === 'futuro') {
        agendamentosFiltrados = agendamentosFiltrados.filter(a => new Date(a.data + 'T00:00:00') >= hoje); // Ajuste para comparar datas corretamente
    } else if (filtroPeriodo === 'passado') {
        agendamentosFiltrados = agendamentosFiltrados.filter(a => new Date(a.data + 'T00:00:00') < hoje); // Ajuste para comparar datas corretamente
    } else if (filtroPeriodo === 'semana') {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999); // Incluir todo o último dia
        
        agendamentosFiltrados = agendamentosFiltrados.filter(a => {
            const dataAgendamento = new Date(a.data + 'T00:00:00');
            return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
        });
    } else if (filtroPeriodo === 'mes') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
         fimMes.setHours(23, 59, 59, 999); // Incluir todo o último dia
        
        agendamentosFiltrados = agendamentosFiltrados.filter(a => {
            const dataAgendamento = new Date(a.data + 'T00:00:00');
            return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
        });
    }
    
    // Ordenar por data e hora
    agendamentosFiltrados.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + a.horaInicio);
        const dateB = new Date(b.data + 'T' + b.horaInicio);
        return dateA - dateB;
    });
    
    if (agendamentosFiltrados.length === 0) {
        listaAgendamentos.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-gray-500 text-sm" colspan="6">Nenhum agendamento encontrado</td>
            </tr>
        `;
        return;
    }
    
    listaAgendamentos.innerHTML = agendamentosFiltrados.map(agendamento => {
        const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "Desconhecida" };
        const educador = dados.educadores.find(e => e.id === agendamento.educadorId) || { nome: "Desconhecido" };
        const turma = dados.turmas.find(t => t.id === agendamento.turmaId) || { nome: "Desconhecida" };
        
        // Formatar data
        const dataAg = new Date(agendamento.data + 'T00:00:00'); // Usar T00:00:00 para evitar problemas de fuso horário na formatação
        const dataFormatada = dataAg.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Especificar UTC para consistência
        
        // Verificar se é um agendamento passado
        const classeData = dataAg < hoje ? 'text-gray-400' : '';
        
        return `
            <tr class="${classeData}">
                <td class="px-6 py-4 whitespace-nowrap">${dataFormatada}</td>
                <td class="px-6 py-4 whitespace-nowrap">${agendamento.horaInicio} - ${agendamento.horaFim}</td>
                <td class="px-6 py-4 whitespace-nowrap">${oficina.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${educador.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${turma.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="abrirEdicaoAgendamento(${agendamento.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="confirmarExclusao('agendamento', ${agendamento.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirEdicaoAgendamento(id) {
    const agendamento = dados.agendamentos.find(a => a.id === id);
    if (!agendamento) return;
    
    currentEditId = id;
    currentEditType = 'agendamento';
    
    const modalTitulo = document.getElementById('modal-titulo');
    const modalConteudo = document.getElementById('modal-conteudo');
     if (!modalTitulo || !modalConteudo) return;

    modalTitulo.textContent = 'Editar Agendamento';
    modalConteudo.innerHTML = `
        <form id="form-editar-agendamento" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Oficina</label>
                    <select id="edit-agendamento-oficina" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required>
                        ${dados.oficinas.map(oficina => 
                            `<option value="${oficina.id}" ${oficina.id === agendamento.oficinaId ? 'selected' : ''}>${oficina.nome} (${oficina.cargaHoraria}h)</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Educador</label>
                    <select id="edit-agendamento-educador" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required>
                        ${dados.educadores.map(educador => 
                            `<option value="${educador.id}" ${educador.id === agendamento.educadorId ? 'selected' : ''}>${educador.nome}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Turma</label>
                <select id="edit-agendamento-turma" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required>
                    ${dados.turmas.map(turma => 
                        `<option value="${turma.id}" ${turma.id === agendamento.turmaId ? 'selected' : ''}>${turma.nome} ${turma.periodo ? `(${turma.periodo})` : ''}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Data</label>
                    <input type="date" id="edit-agendamento-data" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${agendamento.data}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Horário de Início</label>
                    <input type="time" id="edit-agendamento-inicio" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${agendamento.horaInicio}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Horário de Término</label>
                    <input type="time" id="edit-agendamento-fim" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" required value="${agendamento.horaFim}">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Observações</label>
                <textarea id="edit-agendamento-observacoes" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border p-2" rows="2">${agendamento.observacoes || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="cancelar-edicao" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar Alterações</button>
            </div>
        </form>
    `;
    
    document.getElementById('cancelar-edicao')?.addEventListener('click', fecharModal);
    document.getElementById('form-editar-agendamento')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const oficinaId = document.getElementById('edit-agendamento-oficina').value;
        const educadorId = document.getElementById('edit-agendamento-educador').value;
        const turmaId = document.getElementById('edit-agendamento-turma').value;
        const data = document.getElementById('edit-agendamento-data').value;
        const horaInicio = document.getElementById('edit-agendamento-inicio').value;
        const horaFim = document.getElementById('edit-agendamento-fim').value;
        const observacoes = document.getElementById('edit-agendamento-observacoes').value;
        
        if (!oficinaId || !educadorId || !turmaId || !data || !horaInicio || !horaFim) {
            mostrarNotificacao("Preencha todos os campos obrigatórios", "error");
            return;
        }
        
        // Verificar se o horário de fim é posterior ao início
        if (horaInicio >= horaFim) {
            mostrarNotificacao("O horário de término deve ser posterior ao horário de início", "error");
            return;
        }
        
        const sucesso = editarAgendamento(currentEditId, oficinaId, educadorId, turmaId, data, horaInicio, horaFim, observacoes);
        if (sucesso) {
            fecharModal();
        }
    });
    
    abrirModal();
}

// Renderiza o calendário principal na seção Agendamentos
function renderizarCalendario() {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarDays = document.getElementById('calendar-days');
     if (!calendarTitle || !calendarDays) return;

    // Definir título do calendário
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Calcular primeiro e último dia do mês
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    
    // Calcular dia da semana do primeiro dia do mês (0 = Domingo, 6 = Sábado)
    const firstDayWeekday = firstDay.getDay();
    
    // Preparar array com os dias do mês
    let calendarHTML = '';
    
    // Dias do mês anterior (placeholders)
    for (let i = 0; i < firstDayWeekday; i++) {
        calendarHTML += `<div class="p-2 bg-gray-100 min-h-[100px] text-gray-400 border"></div>`;
    }
    
    // Dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Filtrar agendamentos deste dia
        const agendamentosDoDia = dados.agendamentos.filter(a => a.data === dateString);
        
        // Verificar se é hoje
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const todayClass = isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white';
        
        calendarHTML += `
            <div class="p-2 ${todayClass} min-h-[100px] border relative">
                <div class="text-right font-bold ${isToday ? 'text-indigo-600' : ''}">${day}</div>
                <div class="text-xs mt-1 max-h-[80px] overflow-y-auto">
                    ${agendamentosDoDia.map(agendamento => {
                        const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "?" };
                        const educador = dados.educadores.find(e => e.id === agendamento.educadorId) || { nome: "?" };
                        
                        return `
                            <div class="bg-indigo-100 p-1 mb-1 rounded text-indigo-800 cursor-pointer" onclick="abrirEdicaoAgendamento(${agendamento.id})">
                                <div class="font-bold">${agendamento.horaInicio} - ${oficina.nome}</div>
                                <div>${educador.nome}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Preencher dias restantes da última semana (placeholders)
    const totalCells = firstDayWeekday + lastDay.getDate();
    const remainingCells = (7 - (totalCells % 7)) % 7; // Calcula quantos placeholders faltam
    for (let i = 0; i < remainingCells; i++) {
        calendarHTML += `<div class="p-2 bg-gray-100 min-h-[100px] text-gray-400 border"></div>`;
    }
    
    calendarDays.innerHTML = calendarHTML;
}

// Funções para relatórios
function gerarRelatorioEducador() {
    const periodo = document.getElementById('relatorio-periodo')?.value || 'todos';
    const resultado = document.getElementById('relatorio-educador-result');
     if (!resultado) return;

    // Filtrar agendamentos pelo período
    let agendamentosFiltrados = filtrarAgendamentosPorPeriodo(periodo);
    
    // Calcular horas por educador
    const horasPorEducador = [];
    
    dados.educadores.forEach(educador => {
        const agendamentosEducador = agendamentosFiltrados.filter(a => a.educadorId === educador.id);
        
        if (agendamentosEducador.length > 0) {
            let totalMinutos = 0;
            let oficinasMinistradas = new Set();
            let ultimosAgendamentos = [];
            
            // Ordenar agendamentos do educador por data para pegar os últimos
            agendamentosEducador.sort((a, b) => new Date(b.data + 'T' + b.horaInicio) - new Date(a.data + 'T' + a.horaInicio));

            agendamentosEducador.forEach(agendamento => {
                // Calcular duração em minutos
                const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
                const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
                if (inicio >= fim) return; // Ignorar horários inválidos
                const duracao = (fim - inicio) / (1000 * 60);
                
                totalMinutos += duracao;
                oficinasMinistradas.add(agendamento.oficinaId);
                
                // Guardar os últimos 3 agendamentos
                if (ultimosAgendamentos.length < 3) {
                    const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "?" };
                    const dataAg = new Date(agendamento.data + 'T00:00:00');
                    
                    ultimosAgendamentos.push({
                        data: dataAg.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                        oficina: oficina.nome,
                        horario: `${agendamento.horaInicio} - ${agendamento.horaFim}`
                    });
                }
            });
            
            // Não precisa re-ordenar aqui, já foi ordenado antes do loop
            
            horasPorEducador.push({
                educador: educador.nome,
                horas: (totalMinutos / 60).toFixed(1),
                totalAgendamentos: agendamentosEducador.length,
                oficinasMinistradas: oficinasMinistradas.size,
                ultimosAgendamentos
            });
        }
    });
    
    // Ordenar por horas (decrescente)
    horasPorEducador.sort((a, b) => parseFloat(b.horas) - parseFloat(a.horas));
    
    if (horasPorEducador.length === 0) {
        resultado.innerHTML = '<p class="text-gray-500">Nenhum dado encontrado para o período selecionado</p>';
        return;
    }
    
    // Gerar HTML
    let html = '<div class="space-y-4">';
    
    horasPorEducador.forEach(item => {
        html += `
            <div class="border-b pb-4">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg">${item.educador}</h4>
                    <span class="text-2xl font-bold text-indigo-700">${item.horas}h</span>
                </div>
                <div class="flex text-sm text-gray-600 mt-1">
                    <div class="mr-4"><i class="far fa-calendar-check mr-1"></i> ${item.totalAgendamentos} agendamentos</div>
                    <div><i class="fas fa-chalkboard-teacher mr-1"></i> ${item.oficinasMinistradas} oficinas diferentes</div>
                </div>
                ${item.ultimosAgendamentos.length > 0 ? `
                <div class="mt-2">
                    <p class="text-sm font-medium text-gray-700">Últimos agendamentos:</p>
                    <ul class="text-sm text-gray-600 mt-1 list-disc pl-5">
                        ${item.ultimosAgendamentos.map(a => 
                            `<li>${a.data} - ${a.oficina} (${a.horario})</li>`
                        ).join('')}
                    </ul>
                </div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    resultado.innerHTML = html;
}

function gerarRelatorioOficinas() {
    const periodo = document.getElementById('relatorio-periodo-oficinas')?.value || 'todos';
    const resultado = document.getElementById('relatorio-oficinas-result');
     if (!resultado) return;

    // Filtrar agendamentos pelo período
    let agendamentosFiltrados = filtrarAgendamentosPorPeriodo(periodo);
    
    // Calcular estatísticas por oficina
    const estatisticasPorOficina = [];
    
    dados.oficinas.forEach(oficina => {
        const agendamentosOficina = agendamentosFiltrados.filter(a => a.oficinaId === oficina.id);
        
        if (agendamentosOficina.length > 0) {
            let totalMinutos = 0;
            let educadoresUnicos = new Set();
            let turmasUnicas = new Set();
            
            agendamentosOficina.forEach(agendamento => {
                // Calcular duração em minutos
                const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
                const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
                 if (inicio >= fim) return; // Ignorar horários inválidos
                const duracao = (fim - inicio) / (1000 * 60);
                
                totalMinutos += duracao;
                educadoresUnicos.add(agendamento.educadorId);
                turmasUnicas.add(agendamento.turmaId);
            });
            
            estatisticasPorOficina.push({
                oficina: oficina.nome,
                cargaHoraria: oficina.cargaHoraria,
                totalAgendamentos: agendamentosOficina.length,
                horasMinistradas: (totalMinutos / 60).toFixed(1),
                educadores: educadoresUnicos.size,
                turmas: turmasUnicas.size
            });
        }
    });
    
    // Ordenar por número de agendamentos (decrescente)
    estatisticasPorOficina.sort((a, b) => b.totalAgendamentos - a.totalAgendamentos);
    
    if (estatisticasPorOficina.length === 0) {
        resultado.innerHTML = '<p class="text-gray-500">Nenhum dado encontrado para o período selecionado</p>';
        return;
    }
    
    // Gerar HTML
    let html = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Oficina</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Carga Horária</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agendamentos</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas Ministradas</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Educadores</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Turmas</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
    `;
    
    estatisticasPorOficina.forEach(item => {
        html += `
            <tr>
                <td class="px-4 py-2 whitespace-nowrap font-medium">${item.oficina}</td>
                <td class="px-4 py-2 whitespace-nowrap">${item.cargaHoraria}h</td>
                <td class="px-4 py-2 whitespace-nowrap">${item.totalAgendamentos}</td>
                <td class="px-4 py-2 whitespace-nowrap">${item.horasMinistradas}h</td>
                <td class="px-4 py-2 whitespace-nowrap">${item.educadores}</td>
                <td class="px-4 py-2 whitespace-nowrap">${item.turmas}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    resultado.innerHTML = html;
}

function gerarRelatorioTurma() {
    const turmaId = document.getElementById('relatorio-turma')?.value;
    const periodo = document.getElementById('relatorio-periodo-turma')?.value || 'todos';
    const resultado = document.getElementById('relatorio-turma-result');
     if (!resultado) return;

    if (!turmaId) {
        resultado.innerHTML = '<p class="text-gray-500">Selecione uma turma para gerar o relatório</p>';
        return;
    }
    
    // Filtrar agendamentos pelo período e turma
    let agendamentosFiltrados = filtrarAgendamentosPorPeriodo(periodo);
    agendamentosFiltrados = agendamentosFiltrados.filter(a => a.turmaId === parseInt(turmaId));
    
    // Ordenar por data
    agendamentosFiltrados.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + a.horaInicio);
        const dateB = new Date(b.data + 'T' + b.horaInicio);
        return dateA - dateB;
    });
    
    if (agendamentosFiltrados.length === 0) {
        resultado.innerHTML = '<p class="text-gray-500">Nenhum agendamento encontrado para esta turma no período selecionado</p>';
        return;
    }
    
    const turma = dados.turmas.find(t => t.id === parseInt(turmaId)) || { nome: "Desconhecida" };
    
    // Calcular estatísticas
    let totalMinutos = 0;
    const oficinasPorDia = {};
    const oficinasUnicas = new Set();
    const educadoresUnicos = new Set();
    
    agendamentosFiltrados.forEach(agendamento => {
        // Calcular duração em minutos
        const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
        const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
         if (inicio >= fim) return; // Ignorar horários inválidos
        const duracao = (fim - inicio) / (1000 * 60);
        
        totalMinutos += duracao;
        oficinasUnicas.add(agendamento.oficinaId);
        educadoresUnicos.add(agendamento.educadorId);
        
        // Agrupar por dia
        if (!oficinasPorDia[agendamento.data]) {
            oficinasPorDia[agendamento.data] = [];
        }
        
        oficinasPorDia[agendamento.data].push(agendamento);
    });
    
    // Gerar HTML
    let html = `
        <div class="bg-indigo-50 p-3 rounded-lg mb-4">
            <h4 class="font-bold text-lg">${turma.nome}</h4>
            <div class="text-sm text-gray-600 mt-1">
                <div class="grid grid-cols-2 gap-2">
                    <div><i class="fas fa-clock mr-1"></i> Total de horas: <span class="font-bold">${(totalMinutos / 60).toFixed(1)}h</span></div>
                    <div><i class="fas fa-chalkboard mr-1"></i> Oficinas diferentes: <span class="font-bold">${oficinasUnicas.size}</span></div>
                    <div><i class="fas fa-user-tie mr-1"></i> Educadores diferentes: <span class="font-bold">${educadoresUnicos.size}</span></div>
                    <div><i class="far fa-calendar-alt mr-1"></i> Dias com oficinas: <span class="font-bold">${Object.keys(oficinasPorDia).length}</span></div>
                </div>
            </div>
        </div>
        
        <h4 class="font-bold text-md mb-2">Cronograma de oficinas:</h4>
        <div class="space-y-4">
    `;
    
    // Listar agendamentos por dia
    Object.keys(oficinasPorDia).sort().forEach(data => {
        const agendamentosDia = oficinasPorDia[data];
        const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
        
        html += `
            <div class="border-b pb-3">
                <h5 class="font-bold capitalize">${dataFormatada}</h5>
                <ul class="mt-2 space-y-2">
        `;
        
        agendamentosDia.forEach(agendamento => {
            const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "Desconhecida" };
            const educador = dados.educadores.find(e => e.id === agendamento.educadorId) || { nome: "Desconhecido" };
            
            html += `
                <li class="flex items-center">
                    <div class="bg-indigo-100 text-indigo-800 py-1 px-2 rounded text-sm w-[90px] text-center">
                        ${agendamento.horaInicio} - ${agendamento.horaFim}
                    </div>
                    <div class="ml-3">
                        <div class="font-medium">${oficina.nome}</div>
                        <div class="text-sm text-gray-600">Educador: ${educador.nome}</div>
                    </div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    });
    
    html += '</div>';
    resultado.innerHTML = html;
}

function filtrarAgendamentosPorPeriodo(periodo) {
    let agendamentosFiltrados = [...dados.agendamentos];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (periodo === 'semana') {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
         inicioSemana.setHours(0, 0, 0, 0);
        
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
         fimSemana.setHours(23, 59, 59, 999);
        
        agendamentosFiltrados = agendamentosFiltrados.filter(a => {
            const dataAgendamento = new Date(a.data + 'T00:00:00');
            return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
        });
    } else if (periodo === 'mes') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
         fimMes.setHours(23, 59, 59, 999);
        
        agendamentosFiltrados = agendamentosFiltrados.filter(a => {
            const dataAgendamento = new Date(a.data + 'T00:00:00');
            return dataAgendamento >= inicioMes && dataAgendamento <= fimMes;
        });
    }
    
    return agendamentosFiltrados;
}

// Funções para configurações
function exportarDados() {
    try {
        const dadosJSON = JSON.stringify(dados, null, 2);
        const blob = new Blob([dadosJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gerenciador-oficinas-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); // Necessário para Firefox
        a.click();
        document.body.removeChild(a); // Limpar
        
        URL.revokeObjectURL(url);
        mostrarNotificacao("Dados exportados com sucesso");
    } catch (error) {
         mostrarNotificacao("Erro ao exportar dados", "error");
         console.error("Erro na exportação:", error);
    }
}

function importarDados() {
    const fileInput = document.getElementById('importar-arquivo');
     if (!fileInput) return;
    const file = fileInput.files[0];
    
    if (!file) {
        mostrarNotificacao("Selecione um arquivo para importar", "error");
        return;
    }
    
    if (file.type !== 'application/json') {
        mostrarNotificacao("O arquivo deve ser do tipo JSON", "error");
        return;
    }
    
    if (!confirm("A importação substituirá todos os dados atuais. Deseja continuar?")) {
        fileInput.value = ''; // Limpar seleção do arquivo
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Verificar se o arquivo tem a estrutura mínima esperada
            if (typeof importedData !== 'object' || importedData === null || 
                !Array.isArray(importedData.oficinas) || 
                !Array.isArray(importedData.educadores) || 
                !Array.isArray(importedData.turmas) || 
                !Array.isArray(importedData.agendamentos)) {
                throw new Error("Estrutura de dados inválida no arquivo JSON");
            }
            
            dados = importedData;
            salvarDados();
            renderizarTudo(); // Renderiza tudo, incluindo o novo calendário
            mostrarNotificacao("Dados importados com sucesso");
            fileInput.value = ''; // Limpar seleção do arquivo
            atualizarDashboard(); // Atualiza contadores
        } catch (error) {
            mostrarNotificacao(`Erro ao importar dados: ${error.message}`, "error");
            console.error(error);
             fileInput.value = ''; // Limpar seleção do arquivo
        }
    };

     reader.onerror = function() {
         mostrarNotificacao("Erro ao ler o arquivo selecionado.", "error");
         fileInput.value = ''; // Limpar seleção do arquivo
     };
    
    reader.readAsText(file);
}

function limparDados() {
    dados = {
        oficinas: [],
        educadores: [],
        turmas: [],
        agendamentos: []
    };
    
    salvarDados();
    renderizarTudo(); // Renderiza tudo, incluindo o novo calendário
    mostrarNotificacao("Todos os dados foram removidos");
    atualizarDashboard(); // Atualiza contadores
}

// Funções utilitárias
function gerarId() {
    // Combina timestamp com um número aleatório para maior unicidade
    return Date.now() + Math.random().toString(36).substring(2, 7);
}

function salvarDados() {
    try {
        localStorage.setItem('gerenciadorOficinasData', JSON.stringify(dados));
    } catch (error) {
        console.error("Erro ao salvar dados no localStorage:", error);
        mostrarNotificacao("Erro ao salvar dados. Verifique o espaço de armazenamento.", "error");
    }
}

function renderizarTudo() {
    renderizarOficinas();
    renderizarEducadores();
    renderizarTurmas();
    renderizarAgendamentos();
    renderizarCalendario(); // Calendário principal
    renderizarDashboardCalendario(); // Calendário do dashboard
    atualizarSelectsOficinas();
    atualizarSelectsEducadores();
    atualizarSelectsTurmas();
    atualizarProximosAgendamentos();
}

function confirmarExclusao(tipo, id) {
    if (confirm(`Tem certeza que deseja excluir este(a) ${tipo}?`)) {
        switch (tipo) {
            case 'oficina':
                excluirOficina(id);
                break;
            case 'educador':
                excluirEducador(id);
                break;
            case 'turma':
                excluirTurma(id);
                break;
            case 'agendamento':
                excluirAgendamento(id);
                break;
        }
    }
}

function atualizarDashboard() {
    document.getElementById('dashboard-oficinas').textContent = dados.oficinas.length;
    document.getElementById('dashboard-educadores').textContent = dados.educadores.length;
    document.getElementById('dashboard-agendamentos').textContent = dados.agendamentos.length;
}

function atualizarProximosAgendamentos() {
    const proximosAgendamentosTbody = document.getElementById('proximos-agendamentos');
     if (!proximosAgendamentosTbody) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Filtrar próximos agendamentos (de hoje em diante)
    const agendamentosFuturos = dados.agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data + 'T00:00:00'); // Comparar datas corretamente
        return dataAgendamento >= hoje;
    });
    
    // Ordenar por data e hora
    agendamentosFuturos.sort((a, b) => {
        const dateA = new Date(a.data + 'T' + a.horaInicio);
        const dateB = new Date(b.data + 'T' + b.horaInicio);
        return dateA - dateB;
    });
    
    // Limitar a 5 próximos agendamentos
    const agendamentosRecentes = agendamentosFuturos.slice(0, 5);
    
    if (agendamentosRecentes.length === 0) {
        proximosAgendamentosTbody.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-gray-500 text-sm" colspan="5">Nenhum agendamento próximo</td>
            </tr>
        `;
        return;
    }
    
    proximosAgendamentosTbody.innerHTML = agendamentosRecentes.map(agendamento => {
        const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "Desconhecida" };
        const educador = dados.educadores.find(e => e.id === agendamento.educadorId) || { nome: "Desconhecido" };
        const turma = dados.turmas.find(t => t.id === agendamento.turmaId) || { nome: "Desconhecida" };
        
        // Formatar data
        const dataAg = new Date(agendamento.data + 'T00:00:00');
        const dataFormatada = dataAg.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        // Destacar se for hoje
        const isHoje = dataAg.toDateString() === hoje.toDateString();
        const classeData = isHoje ? 'font-bold text-indigo-700' : '';
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap ${classeData}">${dataFormatada} ${isHoje ? '(Hoje)' : ''}</td>
                <td class="px-6 py-4 whitespace-nowrap">${oficina.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${educador.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${turma.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${agendamento.horaInicio} - ${agendamento.horaFim}</td>
            </tr>
        `;
    }).join('');
}

// Funções para manipulação de modal
function abrirModal() {
    const modal = document.getElementById('modal-edicao');
    if (modal) modal.classList.remove('hidden');
}

function fecharModal() {
     const modal = document.getElementById('modal-edicao');
    if (modal) modal.classList.add('hidden');
    currentEditId = null;
    currentEditType = null;
    // Limpar conteúdo do modal para evitar mostrar dados antigos brevemente
    const modalConteudo = document.getElementById('modal-conteudo');
    if (modalConteudo) modalConteudo.innerHTML = ''; 
}

// Funções para notificação (Snackbar)
function mostrarNotificacao(mensagem, tipo = 'success') {
    const snackbar = document.getElementById('snackbar');
    const mensagemElement = document.getElementById('snackbar-mensagem');
    if (!snackbar || !mensagemElement) return; // Safety check

    mensagemElement.textContent = mensagem;
    
    // Resetar classes de cor
    snackbar.classList.remove('bg-gray-800', 'bg-indigo-600', 'bg-red-600');

    // Definir cor com base no tipo
    if (tipo === 'error') {
        snackbar.classList.add('bg-red-600');
    } else if (tipo === 'info') {
        snackbar.classList.add('bg-indigo-600');
    } else { // success (default)
        snackbar.classList.add('bg-gray-800');
    }
    
    // Mostrar snackbar
    snackbar.classList.remove('translate-y-20', 'opacity-0');
    
    // Esconder após 3 segundos
    // Limpar timeout anterior se houver
    if (snackbar.timeoutId) {
        clearTimeout(snackbar.timeoutId);
    }
    snackbar.timeoutId = setTimeout(() => {
        snackbar.classList.add('translate-y-20', 'opacity-0');
        snackbar.timeoutId = null; // Limpar referência ao timeout
    }, 3000);
}

// Função para renderizar o calendário do Dashboard
function renderizarDashboardCalendario() {
    const calendarTitle = document.getElementById('dashboard-calendar-title');
    const calendarDays = document.getElementById('dashboard-calendar-days');
    
    // Verificar se os elementos existem (importante, pois o dashboard pode não estar sempre visível)
    if (!calendarTitle || !calendarDays) {
        return; 
    }

    // Definir título do calendário
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    calendarTitle.textContent = `${monthNames[dashboardCalendarDate.getMonth()]} ${dashboardCalendarDate.getFullYear()}`;
    
    // Calcular primeiro e último dia do mês
    const firstDay = new Date(dashboardCalendarDate.getFullYear(), dashboardCalendarDate.getMonth(), 1);
    const lastDay = new Date(dashboardCalendarDate.getFullYear(), dashboardCalendarDate.getMonth() + 1, 0);
    
    // Calcular dia da semana do primeiro dia do mês (0 = Domingo, 6 = Sábado)
    const firstDayWeekday = firstDay.getDay();
    
    // Preparar array com os dias do mês
    let calendarHTML = '';
    
    // Dias do mês anterior (placeholders)
    for (let i = 0; i < firstDayWeekday; i++) {
        calendarHTML += `<div class="p-1 bg-gray-50 min-h-[60px] text-gray-300 border text-xs"></div>`;
    }
    
    // Dias do mês atual
    const today = new Date(); // Obter data de hoje para comparação
    today.setHours(0,0,0,0); // Zerar horas para comparar apenas a data

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(dashboardCalendarDate.getFullYear(), dashboardCalendarDate.getMonth(), day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Filtrar agendamentos deste dia
        const agendamentosDoDia = dados.agendamentos.filter(a => a.data === dateString);
        
        // Verificar se é hoje
        const isToday = currentDate.toDateString() === today.toDateString();
        const todayClass = isToday ? 'bg-indigo-50 border-indigo-300' : 'bg-white'; // Borda mais forte para hoje
        
        calendarHTML += `
            <div class="p-1 ${todayClass} min-h-[60px] border relative text-xs">
                <div class="text-right font-semibold ${isToday ? 'text-indigo-600' : ''}">${day}</div>
                <div class="mt-1 max-h-[40px] overflow-y-auto">
                    ${agendamentosDoDia.map(agendamento => {
                        const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId) || { nome: "?" };
                        // Miniatura do agendamento
                        return `
                            <div class="bg-indigo-100 p-0.5 mb-0.5 rounded text-indigo-700 text-[10px] leading-tight cursor-pointer truncate" title="${agendamento.horaInicio} - ${oficina.nome}" onclick="abrirEdicaoAgendamento(${agendamento.id})">
                                ${agendamento.horaInicio} ${oficina.nome}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Preencher dias restantes da última semana (placeholders)
    const totalCells = firstDayWeekday + lastDay.getDate();
    const remainingCells = (7 - (totalCells % 7)) % 7; // Calcula quantos placeholders faltam
    for (let i = 0; i < remainingCells; i++) {
        calendarHTML += `<div class="p-1 bg-gray-50 min-h-[60px] text-gray-300 border text-xs"></div>`;
    }
    
    calendarDays.innerHTML = calendarHTML;
}
