// Aplicação principal do Sistema Acadêmico
class App {
    constructor() {
        this.storage = new StorageManager();
        this.sistema = new SistemaAcademico();
        this.perfilAtual = this.obterPerfilAtual();
        this.moduloAtual = null;
        this.init();
    }

    init() {
        this.carregarDados();
        this.configurarEventos();
        this.configurarNavegacaoPorPerfil();
        this.carregarSelects();
        this.mostrarPrimeiroModuloPermitido();
    }

    obterPerfilAtual() {
        const perfil = localStorage.getItem('perfil_usuario') || sessionStorage.getItem('perfil_usuario');
        return perfil || null;
    }

    configurarNavegacaoPorPerfil() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        
        nav.innerHTML = '';
        const perfil = this.perfilAtual;
        
        if (perfil === 'admin') {
            // Admin: Apenas telas de cadastro
            this.criarBotaoNav(nav, 'disciplinas', 'Disciplinas');
            this.criarBotaoNav(nav, 'professores', 'Professores');
            this.criarBotaoNav(nav, 'turmas', 'Turmas');
            this.criarBotaoNav(nav, 'alunos', 'Alunos');
        } else if (perfil === 'professor') {
            // Professor: Apenas telas de gerenciamento acadêmico
            this.criarBotaoNav(nav, 'notas', 'Notas');
            this.criarBotaoNav(nav, 'frequencia', 'Frequência');
            this.criarBotaoNav(nav, 'relatorios', 'Relatórios');
            this.criarBotaoNav(nav, 'consulta-professor', 'Consultar Aluno'); 
        } else if (perfil === 'aluno') {
            // Aluno: Apenas consulta de notas
            this.criarBotaoNav(nav, 'consulta-notas-aluno', 'Minhas Notas');
        }
        
        // Botão de logout para todos
        const logoutBtn = document.createElement("button");
        logoutBtn.textContent = "Sair";
        logoutBtn.className = "btn btn-secondary";
        logoutBtn.style.marginLeft = "16px";
        logoutBtn.type = "button";
        logoutBtn.onclick = () => {
            this.logout();
        };
        nav.appendChild(logoutBtn);
    }

    criarBotaoNav(nav, modulo, texto) {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = texto;
        btn.dataset.module = modulo;
        btn.addEventListener('click', () => {
            this.mostrarModulo(modulo);
        });
        nav.appendChild(btn);
    }

    mostrarPrimeiroModuloPermitido() {
        const perfil = this.perfilAtual;
        let primeiroModulo = null;
        
        if (perfil === 'admin') {
            primeiroModulo = 'disciplinas';
        } else if (perfil === 'professor') {
            primeiroModulo = 'notas';
        } else if (perfil === 'aluno') {
            primeiroModulo = 'consulta-notas-aluno';
        }
        
        if (primeiroModulo) {
            this.mostrarModulo(primeiroModulo);
        }
    }

    logout() {
        localStorage.removeItem('perfil_usuario');
        localStorage.removeItem('usuario_atual');
        sessionStorage.removeItem('perfil_usuario');
        sessionStorage.removeItem('usuario_atual');
        sessionStorage.removeItem('sessao_admin_logada');
        localStorage.removeItem('sessao_admin_logada');
        window.location.reload();
    }

    // Carregar dados do storage para o sistema
    carregarDados() {
        const dados = this.storage.carregarDados();
        
        // Carregar alunos - recriar instâncias da classe Aluno
        this.sistema.alunos = (dados.alunos || []).map(alunoData => {
            const aluno = new Aluno(
                alunoData.nome,
                alunoData.matricula,
                alunoData.cpf,
                alunoData.dataNascimento,
                alunoData.contato,
                alunoData.turmaId
            );
            // Restaurar propriedades adicionais
            aluno.id = alunoData.id;
            aluno.notas = alunoData.notas || [];
            aluno.frequencias = alunoData.frequencias || [];
            return aluno;
        });
        
        // Carregar professores - recriar instâncias da classe Professor
        this.sistema.professores = (dados.professores || []).map(professorData => {
            const professor = new Professor(
                professorData.nome,
                professorData.matricula,
                professorData.cpf,
                professorData.areaAtuacao,
                professorData.contato,
                professorData.disciplinas || []
            );
            professor.id = professorData.id;
            return professor;
        });
        
        // Carregar turmas - recriar instâncias da classe Turma
        this.sistema.turmas = (dados.turmas || []).map(turmaData => {
            const turma = new Turma(
                turmaData.nome,
                turmaData.disciplinaId,
                turmaData.professorId,
                turmaData.turno,
                turmaData.ano,
                turmaData.semestre
            );
            turma.id = turmaData.id;
            turma.alunos = turmaData.alunos || [];
            return turma;
        });
        
        // Carregar disciplinas - recriar instâncias da classe Disciplina
        this.sistema.disciplinas = (dados.disciplinas || []).map(disciplinaData => {
            const disciplina = new Disciplina(
                disciplinaData.nome,
                disciplinaData.codigo
            );
            disciplina.id = disciplinaData.id;
            return disciplina;
        });
        
        // Frequências agora são carregadas dentro do aluno
    }

    // Configurar eventos da interface
    configurarEventos() {
        // Formulário de cadastro de alunos
        document.getElementById('form-aluno').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarAluno();
        });

        // Formulário de cadastro de professores
        document.getElementById('form-professor').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarProfessor();
        });

        // Formulário de cadastro de turmas
        document.getElementById('form-turma').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarTurma();
        });

        // Botão para carregar alunos da turma
        const btnCarregarAlunos = document.getElementById('btn-carregar-alunos');
        if (btnCarregarAlunos) {
            btnCarregarAlunos.addEventListener('click', () => {
                this.carregarAlunosParaLancamento();
            });
        }

        // Formulário de lançamento de notas em lote
        const formNotasTurma = document.getElementById('form-notas-turma');
        if (formNotasTurma) {
            formNotasTurma.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarNotasTurma();
            });
        }

        // Formulário de frequência
        document.getElementById('form-frequencia').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarFrequencia();
        });

        // Formulário de cadastro de disciplinas
        document.getElementById('form-disciplina').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarDisciplina();
        });

        // Gerar relatório
        const gerarRelatorioBtn = document.getElementById('gerar-relatorio');
        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', () => {
                this.gerarRelatorio();
            });
        }
        
        const filtroTurmaConsulta = document.getElementById('filtro-turma-consulta-professor');
        if (filtroTurmaConsulta) {
            filtroTurmaConsulta.addEventListener('change', () => {
                this.carregarAlunosParaConsultaProfessor();
            });
        }
        
        const filtroAlunoConsulta = document.getElementById('filtro-aluno-consulta-professor');
        if (filtroAlunoConsulta) {
            filtroAlunoConsulta.addEventListener('change', () => {
                this.carregarNotasParaProfessor();
            });
        }
    }

    // Mostrar módulo específico
    mostrarModulo(modulo) {
        // Esconder todos os módulos
        document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('active');
        });

        // Remover classe active de todos os botões
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar módulo selecionado
        const moduloEl = document.getElementById(modulo);
        if (moduloEl) {
            moduloEl.classList.add('active');
        }
        
        // Ativar botão correspondente
        const btnModulo = document.querySelector(`[data-module="${modulo}"]`);
        if (btnModulo) {
            btnModulo.classList.add('active');
        }

        this.moduloAtual = modulo;

        // Atualizar conteúdo específico do módulo
        switch (modulo) {
            case 'alunos':
                this.atualizarListaAlunos();
                this.carregarSelectTurmas(); // Carregar turmas para o dropdown
                break;
            case 'professores':
                this.atualizarListaProfessores();
                this.carregarSelectDisciplinas(); // Carregar disciplinas para o dropdown
                break;
            case 'turmas':
                this.atualizarListaTurmas();
                this.carregarSelectDisciplinas();
                this.carregarSelectProfessores();
                break;
            case 'notas':
                this.carregarSelectTurmas();
                this.carregarSelectDisciplinas();
                document.getElementById('lista-alunos-notas').innerHTML = '';
                document.getElementById('container-lancamento-notas').style.display = 'none';
                break;
            case 'frequencia':
                this.carregarSelectAlunos();
                this.carregarSelectDisciplinas();
                this.atualizarListaFrequencia();
                break;
            case 'relatorios':
                this.carregarFiltrosRelatorio();
                document.getElementById('relatorio-resultado').innerHTML = '';
                break;
            case 'disciplinas':
                this.atualizarListaDisciplinas();
                break;
            case 'consulta-notas-aluno':
                this.carregarNotasAluno();
                break;
            case 'consulta-professor':
                this.carregarFiltrosConsultaProfessor();
                break;
        }
    }

    // Carregar alunos para lançamento de notas
    carregarAlunosParaLancamento() {
        const turmaId = document.getElementById('turma-nota').value;
        const disciplinaId = document.getElementById('disciplina-nota').value;
        
        if (!turmaId || !disciplinaId) {
            alert('Selecione a turma e a disciplina!');
            return;
        }
        
        const alunos = this.sistema.alunos.filter(a => a.turmaId === turmaId);
        const container = document.getElementById('lista-alunos-notas');
        const containerLancamento = document.getElementById('container-lancamento-notas');
        
        if (!container || !containerLancamento) return;
        
        container.innerHTML = '';
        containerLancamento.style.display = 'block';
        
        alunos.forEach(aluno => {
            const alunoDiv = document.createElement('div');
            alunoDiv.className = 'list-item';
            
            alunoDiv.innerHTML = `
                <h4>${aluno.nome} - Mat: ${aluno.matricula}</h4>
                <div class="form-group">
                    <label>Nome da Avaliação:</label>
                    <input type="text" class="nome-avaliacao" data-aluno-id="${aluno.id}">
                </div>
                <div class="form-group">
                    <label>Peso:</label>
                    <input type="number" class="peso-avaliacao" data-aluno-id="${aluno.id}" min="0" max="1" step="0.1">
                </div>
                <div class="form-group">
                    <label>Nota:</label>
                    <input type="number" class="nota-avaliacao" data-aluno-id="${aluno.id}" min="0" max="10" step="0.1">
                </div>
            `;
            container.appendChild(alunoDiv);
        });
    }

    // Salvar notas da turma
    salvarNotasTurma() {
        const turmaId = document.getElementById('turma-nota').value;
        const disciplinaId = document.getElementById('disciplina-nota').value;
        const container = document.getElementById('lista-alunos-notas');
        
        if (!container) return;
        
        const inputs = container.querySelectorAll('.nome-avaliacao');
        let notasSalvas = 0;
        
        inputs.forEach(input => {
            const alunoId = input.dataset.alunoId;
            const nomeAvaliacao = input.value.trim();
            const pesoInput = container.querySelector(`.peso-avaliacao[data-aluno-id="${alunoId}"]`);
            const notaInput = container.querySelector(`.nota-avaliacao[data-aluno-id="${alunoId}"]`);
            
            // Só processa se os 3 campos estiverem preenchidos
            if (!nomeAvaliacao || !pesoInput.value || !notaInput.value) {
                return; // Pula este aluno
            }
            
            const peso = parseFloat(pesoInput.value);
            const nota = parseFloat(notaInput.value);
            
            // Validação extra
            if (isNaN(peso) || isNaN(nota) || peso <= 0 || nota < 0) {
                return; // Pula se os valores numéricos forem inválidos
            }
            
            const notaObj = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                disciplinaId,
                tipoAvaliacao: nomeAvaliacao,
                peso: peso,
                nota: nota,
                data: new Date().toISOString().split('T')[0]
            };
            
            const aluno = this.sistema.obterAluno(alunoId);
            if (aluno) {
                this.storage.adicionarNota(alunoId, notaObj);
                // Sincronizar a instância local
                aluno.adicionarNota(disciplinaId, nomeAvaliacao, peso, nota, notaObj.data);
                notasSalvas++;
            }
        });
        
        if (notasSalvas > 0) {
            alert(`${notasSalvas} nota(s) lançada(s) com sucesso!`);
            document.getElementById('container-lancamento-notas').style.display = 'none';
            document.getElementById('form-nota').reset();
        } else {
            alert('Nenhuma nota foi salva. Verifique se preencheu Nome, Peso e Nota corretamente.');
        }
    }

    // Carregar selects com dados
    carregarSelects() {
        this.carregarSelectTurmas();
        this.carregarSelectDisciplinas();
        this.carregarSelectProfessores();
        this.carregarSelectAlunos();
    }

    carregarSelectDisciplinas() {
        const selects = ['disciplina-turma', 'disciplina-nota', 'disciplina-frequencia', 'filtro-disciplina', 'disciplinas-professor'];
        const disciplinas = this.sistema.disciplinas; // Usar this.sistema
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const oldValue = select.value;
                if (selectId === 'disciplinas-professor') {
                    select.innerHTML = '<option value="">Selecione disciplinas</option>';
                } else {
                    select.innerHTML = '<option value="">Selecione uma disciplina</option>';
                }
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id;
                    option.textContent = disciplina.nome;
                    select.appendChild(option);
                });
                select.value = oldValue; // Tenta manter o valor selecionado
            }
        });
    }

    carregarSelectProfessores() {
        const selects = ['professor-turma', 'filtro-professor'];
        const professores = this.sistema.professores; // Usar this.sistema
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const oldValue = select.value;
                select.innerHTML = '<option value="">Selecione um professor</option>';
                professores.forEach(professor => {
                    const option = document.createElement('option');
                    option.value = professor.id;
                    option.textContent = professor.nome;
                    select.appendChild(option);
                });
                select.value = oldValue;
            }
        });
    }

    carregarSelectAlunos(targetSelectId, alunosData) {
        const selects = ['aluno-frequencia', 'filtro-aluno-consulta-professor'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const oldValue = select.value;
                const alunos = alunosData || this.sistema.alunos; // Usa lista filtrada se fornecida
                
                select.innerHTML = '<option value="">Selecione um aluno</option>';
                alunos.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id;
                    option.textContent = `${aluno.nome} (Mat: ${aluno.matricula})`;
                    select.appendChild(option);
                });
                select.value = oldValue;
            }
        });
    }

    carregarSelectTurmas() {
        const selects = ['turma-aluno', 'filtro-turma', 'turma-nota', 'filtro-turma-consulta-professor'];
        const turmas = this.sistema.turmas; // Usar this.sistema
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const oldValue = select.value;
                select.innerHTML = '<option value="">Selecione uma turma</option>';
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id;
                    option.textContent = turma.nome;
                    select.appendChild(option);
                });
                select.value = oldValue;
            }
        });
    }

    // Cadastrar aluno
    cadastrarAluno() {
        const nome = document.getElementById('nome-aluno').value;
        const matricula = document.getElementById('matricula-aluno').value;
        const cpf = document.getElementById('cpf-aluno').value;
        const nascimento = document.getElementById('nascimento-aluno').value;
        const contato = document.getElementById('contato-aluno').value;
        const turmaId = document.getElementById('turma-aluno').value;

        // Validar CPF
        const pessoa = new Pessoa(nome, matricula, cpf, contato);
        if (!pessoa.validarCPF(cpf)) {
            alert('CPF inválido!');
            return;
        }

        if (this.sistema.alunos.find(a => a.cpf === cpf)) {
            alert('CPF já cadastrado!');
            return;
        }
        if (this.sistema.alunos.find(a => a.matricula === matricula)) {
            alert('Matrícula já cadastrada!');
            return;
        }

        const aluno = new Aluno(nome, matricula, cpf, nascimento, contato, turmaId);
        
        if (this.storage.adicionarAluno(aluno)) {
            this.sistema.adicionarAluno(aluno);
            
            alert('Aluno cadastrado com sucesso!');
            document.getElementById('form-aluno').reset();
            this.atualizarListaAlunos();
            
            this.carregarSelectAlunos();
        } else {
            alert('Erro ao cadastrar aluno!');
        }
    }

    // Cadastrar professor
    cadastrarProfessor() {
        const nome = document.getElementById('nome-professor').value;
        const matricula = document.getElementById('matricula-professor').value;
        const cpf = document.getElementById('cpf-professor').value;
        const area = document.getElementById('area-professor').value;
        const contato = document.getElementById('contato-professor').value;
        const disciplinas = Array.from(document.getElementById('disciplinas-professor').selectedOptions)
            .map(option => option.value)
            .filter(value => value);

        // Validar CPF
        const pessoa = new Pessoa(nome, matricula, cpf, contato);
        if (!pessoa.validarCPF(cpf)) {
            alert('CPF inválido!');
            return;
        }

        if (this.sistema.professores.find(p => p.cpf === cpf)) {
            alert('CPF já cadastrado!');
            return;
        }
         if (this.sistema.professores.find(p => p.matricula === matricula)) {
            alert('Matrícula já cadastrada!');
            return;
        }

        const professor = new Professor(nome, matricula, cpf, area, contato, disciplinas);
        
        if (this.storage.adicionarProfessor(professor)) {
            this.sistema.adicionarProfessor(professor);
            
            alert('Professor cadastrado com sucesso!');
            document.getElementById('form-professor').reset();
            this.atualizarListaProfessores();
            
            this.carregarSelectProfessores();
        } else {
            alert('Erro ao cadastrar professor!');
        }
    }

    // Cadastrar turma
    cadastrarTurma() {
        const nome = document.getElementById('nome-turma').value;
        const disciplinaId = document.getElementById('disciplina-turma').value;
        const professorId = document.getElementById('professor-turma').value;
        const turno = document.getElementById('turno-turma').value;
        const ano = parseInt(document.getElementById('ano-turma').value);
        const semestre = parseInt(document.getElementById('semestre-turma').value);

        if (!nome || !disciplinaId || !professorId || !turno || !ano || !semestre) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        const professor = this.sistema.obterProfessor(professorId);
        if (!professor) {
            alert('Professor selecionado não encontrado!');
            return;
        }
        const disciplina = this.sistema.obterDisciplina(disciplinaId);
        if (!disciplina) {
            alert('Disciplina selecionada não encontrada!');
            return;
        }

        const turma = new Turma(nome, disciplinaId, professorId, turno, ano, semestre);
        
        if (this.storage.adicionarTurma(turma)) {
            this.sistema.adicionarTurma(turma);
            
            alert('Turma cadastrada com sucesso!');
            document.getElementById('form-turma').reset();
            this.atualizarListaTurmas();
            
            this.carregarSelectTurmas();
        } else {
            alert('Erro ao cadastrar turma!');
        }
    }

    // Registrar frequência
    registrarFrequencia() {
        const alunoId = document.getElementById('aluno-frequencia').value;
        const disciplinaId = document.getElementById('disciplina-frequencia').value;
        const data = document.getElementById('data-frequencia').value;
        const presente = document.getElementById('presenca-frequencia').value === 'presente';

        if (!alunoId || !disciplinaId || !data) {
            alert('Preencha todos os campos!');
            return;
        }

        const frequenciaObj = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            disciplinaId,
            data,
            presente
        };
        
        const aluno = this.sistema.obterAluno(alunoId);
        if(aluno) {
             aluno.adicionarFrequencia(disciplinaId, data, presente);
        }

        if (this.storage.adicionarFrequenciaAluno(alunoId, frequenciaObj)) {
            alert('Frequência registrada com sucesso!');
            document.getElementById('form-frequencia').reset();
            this.atualizarListaFrequencia();
        } else {
            alert('Erro ao registrar frequência! Aluno não encontrado.');
        }
    }

    // Atualizar lista de alunos
    atualizarListaAlunos() {
        const container = document.getElementById('lista-alunos');
        const alunos = this.sistema.alunos;
        
        container.innerHTML = '';
        
        alunos.forEach(aluno => {
            const turma = this.sistema.obterTurma(aluno.turmaId);
            const turmaNome = turma ? turma.nome : 'Sem turma';
            
            const alunoDiv = document.createElement('div');
            alunoDiv.className = 'list-item';
            alunoDiv.innerHTML = `
                <h4>${aluno.nome}</h4>
                <p><strong>Matrícula:</strong> ${aluno.matricula}</p>
                <p><strong>CPF:</strong> ${aluno.cpf}</p>
                <p><strong>Data de Nascimento:</strong> ${aluno.dataNascimento}</p>
                <p><strong>Contato:</strong> ${aluno.contato}</p>
                <p><strong>Turma:</strong> ${turmaNome}</p>
                <button class="btn btn-danger" data-id="${aluno.id}" style="padding: 5px 10px; margin-top: 10px;">Remover</button>
            `;
            container.appendChild(alunoDiv);
        });

        container.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removerAluno(e.target.dataset.id);
            });
        });
    }

    removerAluno(id) {
        if (!confirm('Tem certeza que deseja remover este aluno?')) return;

        if (this.storage.removerAluno(id)) {
            this.sistema.alunos = this.sistema.alunos.filter(a => a.id !== id);
            
            alert('Aluno removido com sucesso!');
            this.atualizarListaAlunos(); 
            this.carregarSelectAlunos(); 
        } else {
            alert('Erro ao remover aluno.');
        }
    }

    // Atualizar lista de professores
    atualizarListaProfessores() {
        const container = document.getElementById('lista-professores');
        const professores = this.sistema.professores;
        
        container.innerHTML = '';
        
        professores.forEach(professor => {
            const disciplinas = professor.disciplinas.map(id => {
                const disciplina = this.sistema.obterDisciplina(id);
                return disciplina ? disciplina.nome : 'N/A';
            }).join(', ');

            const professorDiv = document.createElement('div');
            professorDiv.className = 'list-item';
            professorDiv.innerHTML = `
                <h4>${professor.nome}</h4>
                <p><strong>Matrícula:</strong> ${professor.matricula}</p>
                <p><strong>CPF:</strong> ${professor.cpf}</p>
                <p><strong>Área de Atuação:</strong> ${professor.areaAtuacao}</p>
                <p><strong>Contato:</strong> ${professor.contato}</p>
                <p><strong>Disciplinas:</strong> ${disciplinas || 'Nenhuma disciplina'}</p>
                <button class="btn btn-danger" data-id="${professor.id}" style="padding: 5px 10px; margin-top: 10px;">Remover</button>
            `;
            container.appendChild(professorDiv);
        });

        container.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removerProfessor(e.target.dataset.id);
            });
        });
    }

    removerProfessor(id) {
        if (!confirm('Tem certeza que deseja remover este professor?')) return;

        if (this.storage.removerProfessor(id)) {
            this.sistema.professores = this.sistema.professores.filter(p => p.id !== id);
            
            alert('Professor removido com sucesso!');
            this.atualizarListaProfessores();
            this.carregarSelectProfessores();
        } else {
            alert('Erro ao remover professor.');
        }
    }

    // Atualizar lista de turmas
    atualizarListaTurmas() {
        const container = document.getElementById('lista-turmas');
        const turmas = this.sistema.turmas;
        
        container.innerHTML = '';
        
        turmas.forEach(turma => {
            const disciplina = this.sistema.obterDisciplina(turma.disciplinaId);
            const professor = this.sistema.obterProfessor(turma.professorId);
            const totalAlunos = this.sistema.alunos.filter(a => a.turmaId === turma.id).length;
            
            const turmaDiv = document.createElement('div');
            turmaDiv.className = 'list-item';
            turmaDiv.innerHTML = `
                <h4>${turma.nome}</h4>
                <p><strong>Disciplina:</strong> ${disciplina ? disciplina.nome : 'N/A'}</p>
                <p><strong>Professor:</strong> ${professor ? professor.nome : 'N/A'}</p>
                <p><strong>Turno:</strong> ${turma.turno}</p>
                <p><strong>Ano:</strong> ${turma.ano}</p>
                <p><strong>Semestre:</strong> ${turma.semestre}</p>
                <p><strong>Total de Alunos:</strong> ${totalAlunos}</p>
                <button class="btn btn-danger" data-id="${turma.id}" style="padding: 5px 10px; margin-top: 10px;">Remover</button>
            `;
            container.appendChild(turmaDiv);
        });

        container.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removerTurma(e.target.dataset.id);
            });
        });
    }

    removerTurma(id) {
        if (!confirm('Tem certeza que deseja remover esta turma?')) return;

        if (this.storage.removerTurma(id)) {
            this.sistema.turmas = this.sistema.turmas.filter(t => t.id !== id);
            
            alert('Turma removida com sucesso!');
            this.atualizarListaTurmas();
            this.carregarSelectTurmas();
        } else {
            alert('Erro ao remover turma.');
        }
    }

    // Atualizar lista de frequência
    atualizarListaFrequencia() {
        const container = document.getElementById('lista-frequencia');
        const alunos = this.sistema.alunos;
        const disciplinas = this.sistema.disciplinas;
        
        container.innerHTML = '';
        
        alunos.forEach(aluno => {
            if (aluno.frequencias && aluno.frequencias.length > 0) {
                aluno.frequencias.forEach(frequencia => {
                    const disciplina = disciplinas.find(d => d.id === frequencia.disciplinaId);
                    
                    const frequenciaDiv = document.createElement('div');
                    frequenciaDiv.className = 'list-item';
                    frequenciaDiv.innerHTML = `
                        <h4>${aluno ? aluno.nome : 'Aluno não encontrado'}</h4>
                        <p><strong>Disciplina:</strong> ${disciplina ? disciplina.nome : 'N/A'}</p>
                        <p><strong>Data:</strong> ${frequencia.data}</p>
                        <p><strong>Status:</strong> ${frequencia.presente ? 'Presente' : 'Ausente'}</p>
                    `;
                    container.appendChild(frequenciaDiv);
                });
            }
        });
    }

    // Carregar filtros do relatório
    carregarFiltrosRelatorio() {
        const temDados = this.sistema.alunos.length > 0 || this.sistema.professores.length > 0 || this.sistema.turmas.length > 0;
        
        if (!temDados) {
            const container = document.getElementById('relatorio-resultado');
            if (container) {
                container.innerHTML = '<div class="list-item"><p>Nenhum dado encontrado no sistema.</p></div>';
            }
        }
        
        // Carregar todos os selects
        this.carregarSelectDisciplinas();
        this.carregarSelectProfessores();
        this.carregarSelectTurmas();
    }

    // Gerar relatório
    gerarRelatorio() {
        const disciplinaSelect = document.getElementById('filtro-disciplina');
        const professorSelect = document.getElementById('filtro-professor');
        const turmaSelect = document.getElementById('filtro-turma');
        const container = document.getElementById('relatorio-resultado');
        
        if (!disciplinaSelect || !professorSelect || !turmaSelect || !container) {
            console.error('Elementos HTML não encontrados!');
            return;
        }
        
        const disciplinaId = disciplinaSelect.value;
        const professorId = professorSelect.value;
        const turmaId = turmaSelect.value;
        
        container.innerHTML = '';
        
        if (!disciplinaId && !professorId && !turmaId) {
            container.innerHTML = '<div class="list-item"><p>Selecione pelo menos um filtro para gerar o relatório.</p></div>';
            return;
        }
        
        let turmas = this.sistema.turmas;
        let disciplinas = this.sistema.disciplinas;
        let professores = this.sistema.professores;
        let alunos = this.sistema.alunos;
        
        if (turmaId) {
            turmas = turmas.filter(t => t.id === turmaId);
        }
        if (disciplinaId) {
            turmas = turmas.filter(t => t.disciplinaId === disciplinaId);
        }
        if (professorId) {
            turmas = turmas.filter(t => t.professorId === professorId);
        }
        
        if (turmas.length === 0) {
            container.innerHTML = '<div class="list-item"><p>Nenhuma turma encontrada com os filtros selecionados.</p></div>';
            return;
        }
        
        // Gerar relatório para cada turma
        turmas.forEach(turma => {
            const disciplina = disciplinas.find(d => d.id === turma.disciplinaId);
            const professor = professores.find(p => p.id === turma.professorId);
            
            const alunosTurma = alunos.filter(a => a.turmaId === turma.id);
            const alunosComNotas = alunosTurma.filter(a => a.notas && a.notas.some(n => n.disciplinaId === turma.disciplinaId));
            
            let mediaTurma = 0;
            let notaMaisAlta = 0;
            let notaMaisBaixa = 10;
            let aprovados = 0;
            let reprovados = 0;
            
            if (alunosComNotas.length > 0) {
                const medias = alunosComNotas.map(aluno => parseFloat(aluno.calcularMediaDisciplina(turma.disciplinaId)));
                const notas = alunosComNotas.flatMap(aluno => 
                    aluno.notas.filter(nota => nota.disciplinaId === turma.disciplinaId).map(nota => nota.nota)
                );
                
                mediaTurma = medias.reduce((a, b) => a + b, 0) / medias.length;
                notaMaisAlta = Math.max(...notas);
                notaMaisBaixa = Math.min(...notas);
                
                aprovados = alunosComNotas.filter(aluno => {
                    return aluno.verificarAprovacao(turma.disciplinaId);
                }).length;
                reprovados = alunosComNotas.length - aprovados;
            }
            
            const relatorioDiv = document.createElement('div');
            relatorioDiv.className = 'relatorio-item';
            relatorioDiv.innerHTML = `
                <h4>${turma.nome}</h4>
                <p><strong>Disciplina:</strong> ${disciplina ? disciplina.nome : 'N/A'}</p>
                <p><strong>Professor:</strong> ${professor ? professor.nome : 'N/A'}</p>
                <p><strong>Turno:</strong> ${turma.turno}</p>
                <p><strong>Ano/Semestre:</strong> ${turma.ano}/${turma.semestre}</p>
                <div class="stats">
                    <div class="stat-item">
                        <div class="label">Total de Alunos</div>
                        <div class="value">${alunosTurma.length}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Média da Turma</div>
                        <div class="value">${mediaTurma.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Nota Mais Alta</div>
                        <div class="value">${(notaMaisAlta || 0).toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Nota Mais Baixa</div>
                        <div class="value">${(notaMaisBaixa === 10 && alunosComNotas.length === 0 ? 0 : notaMaisBaixa).toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Aprovados</div>
                        <div class="value">${aprovados}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Reprovados</div>
                        <div class="value">${reprovados}</div>
                    </div>
                </div>
            `;
            container.appendChild(relatorioDiv);
        });
    }


    // Cadastrar disciplina (sem carga horária)
    cadastrarDisciplina() {
        const nome = document.getElementById('nome-disciplina').value;
        const codigo = document.getElementById('codigo-disciplina').value;

        // Verificar se código já existe
        if (this.sistema.disciplinas.find(d => d.codigo === codigo)) {
            alert('Código da disciplina já cadastrado!');
            return;
        }

        const disciplina = new Disciplina(nome, codigo); // Sem carga horária
        
        if (this.storage.adicionarDisciplina(disciplina)) {
            this.sistema.adicionarDisciplina(disciplina);
            
            alert('Disciplina cadastrada com sucesso!');
            document.getElementById('form-disciplina').reset();
            this.atualizarListaDisciplinas();
            
            this.carregarSelectDisciplinas();
        } else {
            alert('Erro ao cadastrar disciplina!');
        }
    }

    // Atualizar lista de disciplinas
    atualizarListaDisciplinas() {
        const container = document.getElementById('lista-disciplinas');
        const disciplinas = this.sistema.disciplinas; // Usar this.sistema
        
        container.innerHTML = '';
        
        disciplinas.forEach(disciplina => {
            const disciplinaDiv = document.createElement('div');
            disciplinaDiv.className = 'list-item';
            disciplinaDiv.innerHTML = `
                <h4>${disciplina.nome}</h4>
                <p><strong>Código:</strong> ${disciplina.codigo}</p>
                <button class="btn btn-danger" data-id="${disciplina.id}" style="padding: 5px 10px; margin-top: 10px;">Remover</button>
            `;
            container.appendChild(disciplinaDiv);
        });

        container.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removerDisciplina(e.target.dataset.id);
            });
        });
    }

    removerDisciplina(id) {
        if (!confirm('Tem certeza que deseja remover esta disciplina?')) return;

        if (this.storage.removerDisciplina(id)) {
            this.sistema.disciplinas = this.sistema.disciplinas.filter(d => d.id !== id);
            
            alert('Disciplina removida com sucesso!');
            this.atualizarListaDisciplinas();
            this.carregarSelectDisciplinas();
        } else {
            alert('Erro ao remover disciplina.');
        }
    }

    // Carregar notas do aluno logado
    carregarNotasAluno() {
        const aluno = this.obterAlunoAtual(); 
        
        const container = document.getElementById('lista-notas-aluno');
        if (!container) return;

        if (!aluno) {
            container.innerHTML = '<div class="list-item"><p>Nenhum aluno encontrado para exibir notas.</p></div>';
            return;
        }
        
        if (!aluno.notas || aluno.notas.length === 0) {
            container.innerHTML = '<div class="list-item"><p>Nenhuma nota encontrada.</p></div>';
            return;
        }
        
        container.innerHTML = '';
        const disciplinas = this.sistema.disciplinas;
        
        // Agrupar notas por disciplina
        const notasPorDisciplina = {};
        aluno.notas.forEach(nota => {
            if (!notasPorDisciplina[nota.disciplinaId]) {
                notasPorDisciplina[nota.disciplinaId] = [];
            }
            notasPorDisciplina[nota.disciplinaId].push(nota);
        });
        
        Object.keys(notasPorDisciplina).forEach(disciplinaId => {
            const disciplina = disciplinas.find(d => d.id === disciplinaId);
            const disciplinaNome = disciplina ? disciplina.nome : 'N/A';
            const notas = notasPorDisciplina[disciplinaId];
            
            const disciplinaDiv = document.createElement('div');
            disciplinaDiv.className = 'list-item';
            
            let notasHtml = '<ul>';
            notas.forEach(nota => {
                notasHtml += `<li>
                    <strong>${nota.tipoAvaliacao}</strong>
                    ${nota.peso ? ` (Peso: ${nota.peso})` : ''}
                    - Nota: ${nota.nota} - Data: ${nota.data}
                </li>`;
            });
            notasHtml += '</ul>';
            
            const media = parseFloat(aluno.calcularMediaDisciplina(disciplinaId));
            const frequencia = parseFloat(aluno.calcularFrequenciaDisciplina(disciplinaId));
            const aprovado = aluno.verificarAprovacao(disciplinaId);
            
            disciplinaDiv.innerHTML = `
                <h4>${disciplinaNome}</h4>
                ${notasHtml}
                <p><strong>Média:</strong> ${media.toFixed(2)}</p>
                <p><strong>Frequência:</strong> ${frequencia}%</p>
                <p><strong>Status:</strong> ${aprovado ? 'Aprovado' : 'Reprovado'}</p>
            `;
            container.appendChild(disciplinaDiv);
        });
    }

    obterAlunoAtual() {
        const cpfAtual = localStorage.getItem('usuario_atual') || sessionStorage.getItem('usuario_atual');
        if (!cpfAtual) return null;
        
        return this.sistema.alunos.find(a => a.cpf === cpfAtual) || null;
    }

    carregarFiltrosConsultaProfessor() {
        this.carregarSelectTurmas(); 
        // Limpa o select de alunos
        const selectAluno = document.getElementById('filtro-aluno-consulta-professor');
        if (selectAluno) {
            selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        }
        // Limpa a lista de notas
        const container = document.getElementById('lista-notas-consulta-professor');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    carregarAlunosParaConsultaProfessor() {
        const turmaId = document.getElementById('filtro-turma-consulta-professor').value;
        const selectAluno = document.getElementById('filtro-aluno-consulta-professor');
        if (!selectAluno) return;

        if (!turmaId) {
            selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
            return;
        }
        
        const alunosDaTurma = this.sistema.alunos.filter(a => a.turmaId === turmaId);
        this.carregarSelectAlunos('filtro-aluno-consulta-professor', alunosDaTurma);
    }
    
    carregarNotasParaProfessor() {
        const alunoId = document.getElementById('filtro-aluno-consulta-professor').value;
        const container = document.getElementById('lista-notas-consulta-professor');
        if (!container) return;
        
        if (!alunoId) {
            container.innerHTML = ''; // Limpa se nenhum aluno for selecionado
            return;
        }
        
        const aluno = this.sistema.obterAluno(alunoId);
        
        if (!aluno) {
            container.innerHTML = '<div class="list-item"><p>Aluno não encontrado.</p></div>';
            return;
        }
        
        if (!aluno.notas || aluno.notas.length === 0) {
            container.innerHTML = '<div class="list-item"><p>Nenhuma nota encontrada para este aluno.</p></div>';
            return;
        }
        
        container.innerHTML = '';
        const disciplinas = this.sistema.disciplinas;
        
        const notasPorDisciplina = {};
        aluno.notas.forEach(nota => {
            if (!notasPorDisciplina[nota.disciplinaId]) {
                notasPorDisciplina[nota.disciplinaId] = [];
            }
            notasPorDisciplina[nota.disciplinaId].push(nota);
        });
        
        Object.keys(notasPorDisciplina).forEach(disciplinaId => {
            const disciplina = disciplinas.find(d => d.id === disciplinaId);
            const disciplinaNome = disciplina ? disciplina.nome : 'N/A';
            const notas = notasPorDisciplina[disciplinaId];
            
            const disciplinaDiv = document.createElement('div');
            disciplinaDiv.className = 'list-item';
            
            let notasHtml = '<ul>';
            notas.forEach(nota => {
                notasHtml += `<li>
                    <strong>${nota.tipoAvaliacao}</strong>
                    ${nota.peso ? ` (Peso: ${nota.peso})` : ''}
                    - Nota: ${nota.nota} - Data: ${nota.data}
                </li>`;
            });
            notasHtml += '</ul>';
            
            const media = parseFloat(aluno.calcularMediaDisciplina(disciplinaId));
            const frequencia = parseFloat(aluno.calcularFrequenciaDisciplina(disciplinaId));
            const aprovado = aluno.verificarAprovacao(disciplinaId);
            
            disciplinaDiv.innerHTML = `
                <h4>${disciplinaNome}</h4>
                ${notasHtml}
                <p><strong>Média:</strong> ${media.toFixed(2)}</p>
                <p><strong>Frequência:</strong> ${frequencia}%</p>
                <p><strong>Status:</strong> ${aprovado ? 'Aprovado' : 'Reprovado'}</p>
            `;
            container.appendChild(disciplinaDiv);
        });
    }
}

// Sistema de Login com 3 Perfis
function estaAutenticado() {
    const perfil = localStorage.getItem('perfil_usuario') || sessionStorage.getItem('perfil_usuario');
    return perfil !== null;
}

function autenticarUsuario(tipo, usuario, senha, lembrar) {
    // Administrador
    if (tipo === 'admin' && usuario === 'admin' && senha === '1234') {
        salvarSessao('admin', usuario, lembrar);
        return true;
    }
    
    // Professor ou Aluno - autenticar por CPF
    if (tipo === 'professor' || tipo === 'aluno') {
        const storage = new StorageManager();
        if (tipo === 'professor') {
            const professores = storage.obterProfessores();
            // A senha '1234' é um fallback, idealmente viria do cadastro
            const professor = professores.find(p => p.cpf === usuario && (p.senha === senha || '1234' === senha));
            if (professor) {
                salvarSessao('professor', professor.cpf, lembrar);
                return true;
            }
        } else if (tipo === 'aluno') {
            const alunos = storage.obterAlunos();
            const aluno = alunos.find(a => a.cpf === usuario && (a.senha === senha || '1234' === senha));
            if (aluno) {
                salvarSessao('aluno', aluno.cpf, lembrar);
                return true;
            }
        }
    }
    
    return false;
}

function salvarSessao(perfil, usuario, lembrar) {
    if (lembrar) {
        localStorage.setItem('perfil_usuario', perfil);
        localStorage.setItem('usuario_atual', usuario);
        sessionStorage.removeItem('perfil_usuario');
        sessionStorage.removeItem('usuario_atual');
    } else {
        sessionStorage.setItem('perfil_usuario', perfil);
        sessionStorage.setItem('usuario_atual', usuario);
        localStorage.removeItem('perfil_usuario');
        localStorage.removeItem('usuario_atual');
    }
}

function aplicarEstadoAutenticacao(autenticado) {
    if (autenticado || estaAutenticado()) {
        document.body.classList.add("login-autenticado");
        document.body.classList.remove("login-nao-autenticado");
    } else {
        document.body.classList.remove("login-autenticado");
        document.body.classList.add("login-nao-autenticado");
    }
}

function inicializarApp() {
    if (!window.app) {
        window.app = new App();
    }
}

function destruirApp() {
    if (window.app) {
        if (window.app.sistema) {
            window.app.sistema = null;
        }
        window.app = null;
    }
}

window.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("login-form");
    const inputTipo = document.getElementById("login-tipo");
    const inputUser = document.getElementById("login-usuario");
    const inputPass = document.getElementById("login-senha");
    const inputLembrar = document.getElementById("lembrar-login");
    const erroArea = document.getElementById("login-erro");

    // Função para mostrar a tela de login
    function mostrarLogin() {
        aplicarEstadoAutenticacao(false);
        destruirApp();
        if (erroArea) { erroArea.textContent = ""; erroArea.style.display = "none"; }
        if (inputPass) inputPass.value = "";
        if (inputUser) inputUser.value = "";
        if (inputTipo) inputTipo.value = "";
    }

    // Função para prosseguir ao sistema
    function entrarSistema() {
        aplicarEstadoAutenticacao(true);
        setTimeout(() => {
            inicializarApp();
        }, 90);
    }

    // Inicialização padrão conforme sessão
    if (estaAutenticado()) {
        entrarSistema();
    } else {
        mostrarLogin();
    }

    // Handler submit login
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const tipo = inputTipo ? inputTipo.value : '';
            const user = inputUser.value.trim();
            const pass = inputPass.value;
            const lembrar = inputLembrar ? inputLembrar.checked : false;
            
            if (!tipo) {
                erroArea.textContent = "Selecione o tipo de usuário!";
                erroArea.style.display = "block";
                return;
            }
            
            if (autenticarUsuario(tipo, user, pass, lembrar)) {
                erroArea.textContent = "";
                erroArea.style.display = "none";
                entrarSistema();
            } else {
                erroArea.textContent = "Usuário/CPF ou senha inválidos!";
                erroArea.style.display = "block";
                if (inputPass) inputPass.value = "";
            }
        });
    }
});