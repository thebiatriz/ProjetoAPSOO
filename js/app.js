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
            this.criarBotaoNav(nav, 'alunos', 'Alunos');
            this.criarBotaoNav(nav, 'professores', 'Professores');
            this.criarBotaoNav(nav, 'turmas', 'Turmas');
            this.criarBotaoNav(nav, 'disciplinas', 'Disciplinas');
        } else if (perfil === 'professor') {
            // Professor: Apenas telas de gerenciamento acadêmico
            this.criarBotaoNav(nav, 'notas', 'Notas');
            this.criarBotaoNav(nav, 'frequencia', 'Frequência');
            this.criarBotaoNav(nav, 'relatorios', 'Relatórios');
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
            primeiroModulo = 'alunos';
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
        
        // Carregar alunos - recriar instâncias da classe Aluno (sem matrícula)
        this.sistema.alunos = (dados.alunos || []).map(alunoData => {
            // Manter compatibilidade com dados antigos que podem ter matrícula
            const matricula = alunoData.matricula || '';
            const aluno = new Aluno(
                alunoData.nome,
                matricula,
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
        
        // Carregar professores - recriar instâncias da classe Professor (sem matrícula)
        this.sistema.professores = (dados.professores || []).map(professorData => {
            // Manter compatibilidade com dados antigos que podem ter matrícula
            const matricula = professorData.matricula || '';
            const professor = new Professor(
                professorData.nome,
                matricula,
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
        
        // Carregar disciplinas - recriar instâncias da classe Disciplina (sem carga horária)
        this.sistema.disciplinas = (dados.disciplinas || []).map(disciplinaData => {
            // Manter compatibilidade com dados antigos que podem ter carga horária
            const cargaHoraria = disciplinaData.cargaHoraria || 0;
            const disciplina = new Disciplina(
                disciplinaData.nome,
                disciplinaData.codigo,
                cargaHoraria,
                disciplinaData.descricao || ''
            );
            disciplina.id = disciplinaData.id;
            return disciplina;
        });
        
        // Carregar frequências
        this.sistema.frequencias = dados.frequencias || [];
    }

    // Configurar eventos da interface
    configurarEventos() {
        // Navegação entre módulos
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modulo = e.target.dataset.module;
                this.mostrarModulo(modulo);
            });
        });

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

        // Filtros de consulta de notas
        document.getElementById('filtro-aluno').addEventListener('change', () => {
            this.filtrarNotas();
        });

        document.getElementById('filtro-disciplina-nota').addEventListener('change', () => {
            this.filtrarNotas();
        });

        document.getElementById('filtro-turma-nota').addEventListener('change', () => {
            this.filtrarNotas();
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
                console.log('Botão gerar relatório clicado');
                this.gerarRelatorio();
            });
        } else {
            console.error('Botão gerar relatório não encontrado!');
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
                break;
            case 'professores':
                this.atualizarListaProfessores();
                break;
            case 'turmas':
                this.atualizarListaTurmas();
                // Garantir que os selects estão atualizados
                this.carregarSelectDisciplinas();
                this.carregarSelectProfessores();
                break;
            case 'notas':
                this.carregarSelectTurmas();
                this.carregarSelectDisciplinas();
                this.atualizarListaNotas();
                break;
            case 'frequencia':
                this.atualizarListaFrequencia();
                break;
            case 'relatorios':
                console.log('Navegando para módulo de relatórios');
                this.carregarFiltrosRelatorio();
                // Limpar resultado anterior
                const resultadoContainer = document.getElementById('relatorio-resultado');
                if (resultadoContainer) {
                    resultadoContainer.innerHTML = '';
                } else {
                    console.error('Container de resultado não encontrado!');
                }
                break;
            case 'disciplinas':
                this.atualizarListaDisciplinas();
                break;
            case 'consulta-notas-aluno':
                this.carregarNotasAluno();
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
        
        const alunos = this.storage.obterAlunos().filter(a => a.turmaId === turmaId);
        const container = document.getElementById('lista-alunos-notas');
        const containerLancamento = document.getElementById('container-lancamento-notas');
        
        if (!container || !containerLancamento) return;
        
        container.innerHTML = '';
        containerLancamento.style.display = 'block';
        
        alunos.forEach(aluno => {
            const alunoDiv = document.createElement('div');
            alunoDiv.className = 'list-item';
            alunoDiv.innerHTML = `
                <h4>${aluno.nome} - CPF: ${aluno.cpf}</h4>
                <div class="form-group">
                    <label>Nome da Avaliação:</label>
                    <input type="text" class="nome-avaliacao" data-aluno-id="${aluno.id}" required>
                </div>
                <div class="form-group">
                    <label>Peso:</label>
                    <input type="number" class="peso-avaliacao" data-aluno-id="${aluno.id}" min="0" max="1" step="0.1" required>
                </div>
                <div class="form-group">
                    <label>Nota:</label>
                    <input type="number" class="nota-avaliacao" data-aluno-id="${aluno.id}" min="0" max="10" step="0.1" required>
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
            
            if (!nomeAvaliacao || !pesoInput || !notaInput) return;
            
            const peso = parseFloat(pesoInput.value);
            const nota = parseFloat(notaInput.value);
            
            if (isNaN(peso) || isNaN(nota)) return;
            
            const notaObj = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                disciplinaId,
                tipoAvaliacao: nomeAvaliacao,
                peso: peso,
                nota: nota,
                data: new Date().toISOString().split('T')[0]
            };
            
            const aluno = this.storage.obterAluno(alunoId);
            if (aluno) {
                if (!aluno.notas) {
                    aluno.notas = [];
                }
                aluno.notas.push(notaObj);
                this.storage.adicionarNota(alunoId, notaObj);
                notasSalvas++;
            }
        });
        
        if (notasSalvas > 0) {
            alert(`${notasSalvas} nota(s) lançada(s) com sucesso!`);
            document.getElementById('container-lancamento-notas').style.display = 'none';
            this.atualizarListaNotas();
        } else {
            alert('Nenhuma nota foi salva. Verifique os dados preenchidos.');
        }
    }

    // Carregar selects com dados
    carregarSelects() {
        this.carregarSelectTurmas();
        this.carregarSelectDisciplinas();
        this.carregarSelectProfessores();
        this.carregarSelectAlunos();
        
        // Debug: verificar se os selects foram carregados
        console.log('Selects carregados:', {
            disciplinas: this.storage.obterDisciplinas().length,
            professores: this.storage.obterProfessores().length,
            turmas: this.storage.obterTurmas().length,
            alunos: this.storage.obterAlunos().length
        });
    }


    carregarSelectDisciplinas() {
        const selects = ['disciplina-turma', 'disciplina-nota', 'disciplina-frequencia', 'filtro-disciplina', 'filtro-disciplina-nota', 'disciplinas-professor'];
        const disciplinas = this.sistema.disciplinas;
        
        console.log('Carregando disciplinas nos selects:', disciplinas.length);
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
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
                console.log(`Select ${selectId} populado com ${disciplinas.length} disciplinas`);
            } else {
                console.log(`Select ${selectId} não encontrado`);
            }
        });
    }

    carregarSelectProfessores() {
        const selects = ['professor-turma', 'filtro-professor'];
        const professores = this.sistema.professores;
        
        console.log('Carregando professores nos selects:', professores.length);
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione um professor</option>';
                professores.forEach(professor => {
                    const option = document.createElement('option');
                    option.value = professor.id;
                    option.textContent = professor.nome;
                    select.appendChild(option);
                });
                console.log(`Select ${selectId} populado com ${professores.length} professores`);
            } else {
                console.log(`Select ${selectId} não encontrado`);
            }
        });
    }

    carregarSelectAlunos() {
        const selects = ['aluno-nota', 'aluno-frequencia', 'filtro-aluno'];
        const alunos = this.sistema.alunos;
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione um aluno</option>';
                alunos.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id;
                    option.textContent = aluno.nome;
                    select.appendChild(option);
                });
            }
        });
    }

    carregarSelectTurmas() {
        const selects = ['turma-aluno', 'filtro-turma', 'filtro-turma-nota', 'turma-nota'];
        const turmas = this.sistema.turmas;
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione uma turma</option>';
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id;
                    option.textContent = turma.nome;
                    select.appendChild(option);
                });
            }
        });
    }

    // Cadastrar aluno (sem matrícula, CPF como identificador único)
    cadastrarAluno() {
        const nome = document.getElementById('nome-aluno').value;
        const cpf = document.getElementById('cpf-aluno').value;
        const nascimento = document.getElementById('nascimento-aluno').value;
        const contato = document.getElementById('contato-aluno').value;
        const turmaId = document.getElementById('turma-aluno').value;

        // Validar CPF
        const pessoa = new Pessoa(nome, '', cpf, contato); // Matrícula vazia
        if (!pessoa.validarCPF(cpf)) {
            alert('CPF inválido!');
            return;
        }

        // Verificar se CPF já existe
        const alunoExistente = this.storage.obterAlunos().find(a => a.cpf === cpf);
        if (alunoExistente) {
            alert('CPF já cadastrado!');
            return;
        }

        const aluno = new Aluno(nome, '', cpf, nascimento, contato, turmaId); // Sem matrícula
        
        if (this.storage.adicionarAluno(aluno)) {
            alert('Aluno cadastrado com sucesso!');
            document.getElementById('form-aluno').reset();
            this.atualizarListaAlunos();
            this.carregarSelectAlunos();
        } else {
            alert('Erro ao cadastrar aluno!');
        }
    }

    // Cadastrar professor (sem matrícula, CPF como identificador único)
    cadastrarProfessor() {
        const nome = document.getElementById('nome-professor').value;
        const cpf = document.getElementById('cpf-professor').value;
        const area = document.getElementById('area-professor').value;
        const contato = document.getElementById('contato-professor').value;
        const disciplinas = Array.from(document.getElementById('disciplinas-professor').selectedOptions)
            .map(option => option.value)
            .filter(value => value);

        // Validar CPF
        const pessoa = new Pessoa(nome, '', cpf, contato); // Matrícula vazia
        if (!pessoa.validarCPF(cpf)) {
            alert('CPF inválido!');
            return;
        }

        // Verificar se CPF já existe
        const professorExistente = this.storage.obterProfessores().find(p => p.cpf === cpf);
        if (professorExistente) {
            alert('CPF já cadastrado!');
            return;
        }

        const professor = new Professor(nome, '', cpf, area, contato, disciplinas); // Sem matrícula
        
        if (this.storage.adicionarProfessor(professor)) {
            alert('Professor cadastrado com sucesso!');
            document.getElementById('form-professor').reset();
            this.atualizarListaProfessores();
            this.carregarSelectProfessores(); // Atualizar selects de professores
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

        console.log('Dados da turma:', { nome, disciplinaId, professorId, turno, ano, semestre });

        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!nome || !disciplinaId || !professorId || !turno || !ano || !semestre) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        // Verificar se o professor existe
        const professor = this.storage.obterProfessor(professorId);
        if (!professor) {
            alert('Professor selecionado não encontrado!');
            return;
        }

        // Verificar se a disciplina existe
        const disciplina = this.storage.obterDisciplina(disciplinaId);
        if (!disciplina) {
            alert('Disciplina selecionada não encontrada!');
            return;
        }

        const turma = new Turma(nome, disciplinaId, professorId, turno, ano, semestre);
        
        if (this.storage.adicionarTurma(turma)) {
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

        const frequenciaObj = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            alunoId,
            disciplinaId,
            data,
            presente
        };

        // Adicionar frequência ao aluno também
        const aluno = this.storage.obterAluno(alunoId);
        if (aluno) {
            if (!aluno.frequencias) {
                aluno.frequencias = [];
            }
            aluno.frequencias.push(frequenciaObj);
        }

        if (this.storage.adicionarFrequencia(frequenciaObj)) {
            alert('Frequência registrada com sucesso!');
            document.getElementById('form-frequencia').reset();
            this.atualizarListaFrequencia();
        } else {
            alert('Erro ao registrar frequência!');
        }
    }

    // Atualizar lista de alunos
    atualizarListaAlunos() {
        const container = document.getElementById('lista-alunos');
        const alunos = this.storage.obterAlunos();
        
        container.innerHTML = '';
        
        alunos.forEach(aluno => {
            const turma = this.storage.obterTurma(aluno.turmaId);
            const turmaNome = turma ? turma.nome : 'Sem turma';
            
            const alunoDiv = document.createElement('div');
            alunoDiv.className = 'list-item';
            alunoDiv.innerHTML = `
                <h4>${aluno.nome}</h4>
                <p><strong>CPF:</strong> ${aluno.cpf}</p>
                <p><strong>Data de Nascimento:</strong> ${aluno.dataNascimento}</p>
                <p><strong>Contato:</strong> ${aluno.contato}</p>
                <p><strong>Turma:</strong> ${turmaNome}</p>
            `;
            container.appendChild(alunoDiv);
        });
    }

    // Atualizar lista de professores
    atualizarListaProfessores() {
        const container = document.getElementById('lista-professores');
        const professores = this.storage.obterProfessores();
        
        container.innerHTML = '';
        
        professores.forEach(professor => {
            const disciplinas = professor.disciplinas.map(id => {
                const disciplina = this.storage.obterDisciplina(id);
                return disciplina ? disciplina.nome : 'Disciplina não encontrada';
            }).join(', ');

            const professorDiv = document.createElement('div');
            professorDiv.className = 'list-item';
            professorDiv.innerHTML = `
                <h4>${professor.nome}</h4>
                <p><strong>CPF:</strong> ${professor.cpf}</p>
                <p><strong>Área de Atuação:</strong> ${professor.areaAtuacao}</p>
                <p><strong>Contato:</strong> ${professor.contato}</p>
                <p><strong>Disciplinas:</strong> ${disciplinas || 'Nenhuma disciplina'}</p>
            `;
            container.appendChild(professorDiv);
        });
    }

    // Atualizar lista de turmas
    atualizarListaTurmas() {
        const container = document.getElementById('lista-turmas');
        const turmas = this.storage.obterTurmas();
        
        container.innerHTML = '';
        
        turmas.forEach(turma => {
            const disciplina = this.storage.obterDisciplina(turma.disciplinaId);
            const professor = this.storage.obterProfessor(turma.professorId);
            
            const turmaDiv = document.createElement('div');
            turmaDiv.className = 'list-item';
            turmaDiv.innerHTML = `
                <h4>${turma.nome}</h4>
                <p><strong>Disciplina:</strong> ${disciplina ? disciplina.nome : 'Disciplina não encontrada'}</p>
                <p><strong>Professor:</strong> ${professor ? professor.nome : 'Professor não encontrado'}</p>
                <p><strong>Turno:</strong> ${turma.turno}</p>
                <p><strong>Ano:</strong> ${turma.ano}</p>
                <p><strong>Semestre:</strong> ${turma.semestre}</p>
                <p><strong>Total de Alunos:</strong> ${turma.alunos ? turma.alunos.length : 0}</p>
            `;
            container.appendChild(turmaDiv);
        });
    }

    // Atualizar lista de notas
    atualizarListaNotas() {
        const container = document.getElementById('lista-notas');
        const alunos = this.storage.obterAlunos();
        const disciplinas = this.storage.obterDisciplinas();
        
        container.innerHTML = '';
        
        alunos.forEach(aluno => {
            if (aluno.notas && aluno.notas.length > 0) {
                aluno.notas.forEach(nota => {
                    const disciplina = disciplinas.find(d => d.id === nota.disciplinaId);
                    const disciplinaNome = disciplina ? disciplina.nome : 'Disciplina não encontrada';
                    
                    const notaDiv = document.createElement('div');
                    notaDiv.className = 'list-item';
                    const peso = nota.peso ? nota.peso : '';
                    notaDiv.innerHTML = `
                        <h4>${aluno.nome}</h4>
                        <p><strong>Disciplina:</strong> ${disciplinaNome}</p>
                        <p><strong>Tipo:</strong> ${nota.tipoAvaliacao}</p>
                        ${peso ? `<p><strong>Peso:</strong> ${peso}</p>` : ''}
                        <p><strong>Nota:</strong> ${nota.nota}</p>
                        <p><strong>Data:</strong> ${nota.data}</p>
                    `;
                    container.appendChild(notaDiv);
                });
            }
        });
    }

    // Atualizar lista de frequência
    atualizarListaFrequencia() {
        const container = document.getElementById('lista-frequencia');
        const frequencias = this.storage.obterFrequencias();
        const alunos = this.storage.obterAlunos();
        const disciplinas = this.storage.obterDisciplinas();
        
        container.innerHTML = '';
        
        frequencias.forEach(frequencia => {
            const aluno = alunos.find(a => a.id === frequencia.alunoId);
            const disciplina = disciplinas.find(d => d.id === frequencia.disciplinaId);
            
            const frequenciaDiv = document.createElement('div');
            frequenciaDiv.className = 'list-item';
            frequenciaDiv.innerHTML = `
                <h4>${aluno ? aluno.nome : 'Aluno não encontrado'}</h4>
                <p><strong>Disciplina:</strong> ${disciplina ? disciplina.nome : 'Disciplina não encontrada'}</p>
                <p><strong>Data:</strong> ${frequencia.data}</p>
                <p><strong>Status:</strong> ${frequencia.presente ? 'Presente' : 'Ausente'}</p>
            `;
            container.appendChild(frequenciaDiv);
        });
    }

    // Filtrar notas por aluno, disciplina e turma
    filtrarNotas() {
        const alunoId = document.getElementById('filtro-aluno').value;
        const disciplinaId = document.getElementById('filtro-disciplina-nota').value;
        const turmaId = document.getElementById('filtro-turma-nota').value;
        const container = document.getElementById('lista-notas');
        const alunos = this.storage.obterAlunos();
        const disciplinas = this.storage.obterDisciplinas();
        const turmas = this.storage.obterTurmas();
        
        container.innerHTML = '';
        
        let alunosFiltrados = alunos;
        
        // Filtrar por aluno
        if (alunoId) {
            alunosFiltrados = alunosFiltrados.filter(a => a.id === alunoId);
        }
        
        // Filtrar por turma
        if (turmaId) {
            alunosFiltrados = alunosFiltrados.filter(a => a.turmaId === turmaId);
        }
        
        alunosFiltrados.forEach(aluno => {
            if (aluno.notas && aluno.notas.length > 0) {
                let notasFiltradas = aluno.notas;
                
                // Filtrar por disciplina
                if (disciplinaId) {
                    notasFiltradas = notasFiltradas.filter(nota => nota.disciplinaId === disciplinaId);
                }
                
                notasFiltradas.forEach(nota => {
                    const disciplina = disciplinas.find(d => d.id === nota.disciplinaId);
                    const disciplinaNome = disciplina ? disciplina.nome : 'Disciplina não encontrada';
                    const turma = turmas.find(t => t.id === aluno.turmaId);
                    const turmaNome = turma ? turma.nome : 'Sem turma';
                    
                    // Calcular média da disciplina
                    const mediaDisciplina = parseFloat(aluno.calcularMediaDisciplina(nota.disciplinaId));
                    const frequenciaDisciplina = parseFloat(aluno.calcularFrequenciaDisciplina(nota.disciplinaId));
                    const aprovado = mediaDisciplina >= 6 && frequenciaDisciplina >= 75;
                    
                    const notaDiv = document.createElement('div');
                    notaDiv.className = 'list-item';
                    notaDiv.innerHTML = `
                        <h4>${aluno.nome}</h4>
                        <p><strong>Disciplina:</strong> ${disciplinaNome}</p>
                        <p><strong>Turma:</strong> ${turmaNome}</p>
                        <p><strong>Tipo:</strong> ${nota.tipoAvaliacao}</p>
                        ${nota.peso ? `<p><strong>Peso:</strong> ${nota.peso}</p>` : ''}
                        <p><strong>Nota:</strong> ${nota.nota}</p>
                        <p><strong>Data:</strong> ${nota.data}</p>
                        <p><strong>Média da Disciplina:</strong> ${mediaDisciplina}</p>
                        <p><strong>Frequência:</strong> ${frequenciaDisciplina}%</p>
                        <p><strong>Status:</strong> ${aprovado ? 'Aprovado' : 'Reprovado'}</p>
                    `;
                    container.appendChild(notaDiv);
                });
            }
        });
    }

    // Carregar filtros do relatório
    carregarFiltrosRelatorio() {
        // Verificar se há dados no sistema
        const temDados = this.storage.temDados();
        console.log('Sistema tem dados:', temDados);
        
        if (!temDados) {
            const container = document.getElementById('relatorio-resultado');
            if (container) {
                container.innerHTML = '<div class="list-item"><p>Nenhum dado encontrado no sistema. Cadastre alunos, professores, turmas e disciplinas primeiro.</p></div>';
            }
        }
        
        // Carregar todos os selects
        this.carregarSelectDisciplinas();
        this.carregarSelectProfessores();
        this.carregarSelectTurmas();
        
        // Debug: verificar se os selects foram populados
        setTimeout(() => {
            const disciplinaSelect = document.getElementById('filtro-disciplina');
            const professorSelect = document.getElementById('filtro-professor');
            const turmaSelect = document.getElementById('filtro-turma');
        }, 300);
    }

    // Gerar relatório
    gerarRelatorio() {
        const disciplinaSelect = document.getElementById('filtro-disciplina');
        const professorSelect = document.getElementById('filtro-professor');
        const turmaSelect = document.getElementById('filtro-turma');
        const container = document.getElementById('relatorio-resultado');
        
        // Verificar se os elementos existem
        if (!disciplinaSelect || !professorSelect || !turmaSelect || !container) {
            console.error('Elementos HTML não encontrados!');
            return;
        }
        
        const disciplinaId = disciplinaSelect.value;
        const professorId = professorSelect.value;
        const turmaId = turmaSelect.value;
        
        container.innerHTML = '';
        
        // Verificar se há dados para gerar relatório
        if (!disciplinaId && !professorId && !turmaId) {
            container.innerHTML = '<div class="list-item"><p>Selecione pelo menos um filtro para gerar o relatório.</p></div>';
            return;
        }
        
        // Filtrar dados baseado nos filtros
        let turmas = this.sistema.turmas;
        let disciplinas = this.sistema.disciplinas;
        let professores = this.sistema.professores;
        let alunos = this.sistema.alunos;
        
        // Debug: verificar se há dados
        console.log('Dados disponíveis:', {
            turmas: turmas.length,
            disciplinas: disciplinas.length,
            professores: professores.length,
            alunos: alunos.length
        });
        
        // Verificar se há dados no sistema
        if (turmas.length === 0 && disciplinas.length === 0 && professores.length === 0 && alunos.length === 0) {
            container.innerHTML = '<div class="list-item"><p>Nenhum dado encontrado no sistema. Cadastre alunos, professores, turmas e disciplinas primeiro.</p></div>';
            return;
        }
        
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
            
            // Buscar alunos da turma
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
                    const media = parseFloat(aluno.calcularMediaDisciplina(turma.disciplinaId));
                    const frequencia = parseFloat(aluno.calcularFrequenciaDisciplina(turma.disciplinaId));
                    return media >= 6 && frequencia >= 75;
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
                        <div class="label">Alunos com Notas</div>
                        <div class="value">${alunosComNotas.length}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Média da Turma</div>
                        <div class="value">${mediaTurma.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Nota Mais Alta</div>
                        <div class="value">${notaMaisAlta.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Nota Mais Baixa</div>
                        <div class="value">${notaMaisBaixa.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Aprovados</div>
                        <div class="value">${aprovados}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">Reprovados</div>
                        <div class="value">${reprovados}</div>
                    </div>
                    <div class="stat-item">
                        <div class="label">% Aprovação</div>
                        <div class="value">${alunosComNotas.length > 0 ? ((aprovados / alunosComNotas.length) * 100).toFixed(2) : 0}%</div>
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
        const disciplinaExistente = this.storage.obterDisciplinas().find(d => d.codigo === codigo);
        if (disciplinaExistente) {
            alert('Código da disciplina já cadastrado!');
            return;
        }

        const disciplina = new Disciplina(nome, codigo, 0); // Sem carga horária
        
        if (this.storage.adicionarDisciplina(disciplina)) {
            alert('Disciplina cadastrada com sucesso!');
            document.getElementById('form-disciplina').reset();
            this.atualizarListaDisciplinas();
            this.carregarSelectDisciplinas();
            
            // Atualizar também os selects de professores
            this.carregarSelectDisciplinas();
        } else {
            alert('Erro ao cadastrar disciplina!');
        }
    }

    // Atualizar lista de disciplinas
    atualizarListaDisciplinas() {
        const container = document.getElementById('lista-disciplinas');
        const disciplinas = this.storage.obterDisciplinas();
        
        container.innerHTML = '';
        
        disciplinas.forEach(disciplina => {
            const disciplinaDiv = document.createElement('div');
            disciplinaDiv.className = 'list-item';
            disciplinaDiv.innerHTML = `
                <h4>${disciplina.nome}</h4>
                <p><strong>Código:</strong> ${disciplina.codigo}</p>
            `;
            container.appendChild(disciplinaDiv);
        });
    }

    // Carregar notas do aluno logado
    carregarNotasAluno() {
        const alunoAtual = this.obterAlunoAtual();
        if (!alunoAtual) {
            const container = document.getElementById('lista-notas-aluno');
            if (container) {
                container.innerHTML = '<div class="list-item"><p>Nenhum aluno encontrado para exibir notas.</p></div>';
            }
            return;
        }
        
        const aluno = this.storage.obterAluno(alunoAtual.id);
        if (!aluno || !aluno.notas || aluno.notas.length === 0) {
            const container = document.getElementById('lista-notas-aluno');
            if (container) {
                container.innerHTML = '<div class="list-item"><p>Nenhuma nota encontrada.</p></div>';
            }
            return;
        }
        
        const container = document.getElementById('lista-notas-aluno');
        if (!container) return;
        
        container.innerHTML = '';
        const disciplinas = this.storage.obterDisciplinas();
        
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
            const disciplinaNome = disciplina ? disciplina.nome : 'Disciplina não encontrada';
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
            const aprovado = media >= 6 && frequencia >= 75;
            
            disciplinaDiv.innerHTML = `
                <h4>${disciplinaNome}</h4>
                ${notasHtml}
                <p><strong>Média:</strong> ${media}</p>
                <p><strong>Frequência:</strong> ${frequencia}%</p>
                <p><strong>Status:</strong> ${aprovado ? 'Aprovado' : 'Reprovado'}</p>
            `;
            container.appendChild(disciplinaDiv);
        });
    }

    obterAlunoAtual() {
        const cpfAtual = localStorage.getItem('usuario_atual') || sessionStorage.getItem('usuario_atual');
        if (!cpfAtual) return null;
        
        const alunos = this.storage.obterAlunos();
        return alunos.find(a => a.cpf === cpfAtual) || null;
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
            const professor = professores.find(p => p.cpf === usuario && senha === '1234'); // Senha padrão: 1234
            if (professor) {
                salvarSessao('professor', professor.cpf, lembrar);
                return true;
            }
        } else if (tipo === 'aluno') {
            const alunos = storage.obterAlunos();
            const aluno = alunos.find(a => a.cpf === usuario && senha === '1234'); // Senha padrão: 1234
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