// Classe base Pessoa
class Pessoa {
    constructor(nome, matricula, cpf, contato) {
        this.nome = nome;
        this.matricula = matricula;
        this.cpf = cpf;
        this.contato = contato;
        this.id = this.generateId();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Método para validar CPF
    validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // Validação do primeiro dígito
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;

        // Validação do segundo dígito
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;

        return true;
    }
}

// Classe Aluno
class Aluno extends Pessoa {
    constructor(nome, matricula, cpf, dataNascimento, contato, turmaId = null) {
        super(nome, matricula, cpf, contato);
        this.dataNascimento = dataNascimento;
        this.turmaId = turmaId;
        this.notas = [];
        this.frequencias = [];
    }

    // Adicionar nota (agora com peso)
    adicionarNota(disciplinaId, tipoAvaliacao, peso, nota, data) {
        const notaObj = {
            id: this.generateId(),
            disciplinaId,
            tipoAvaliacao,
            peso: parseFloat(peso),
            nota: parseFloat(nota),
            data: data || new Date().toISOString().split('T')[0]
        };
        this.notas.push(notaObj);
        return notaObj;
    }

    // Calcular média ponderada por disciplina
    calcularMediaDisciplina(disciplinaId) {
        const notasDisciplina = this.notas.filter(nota => nota.disciplinaId === disciplinaId);
        if (notasDisciplina.length === 0) return 0;

        let somaNotasPonderadas = 0;
        let somaPesos = 0;

        notasDisciplina.forEach(nota => {
            const peso = nota.peso || 1.0; // Assume peso 1 se não definido
            somaNotasPonderadas += nota.nota * peso;
            somaPesos += peso;
        });

        if (somaPesos === 0) return 0; // Evitar divisão por zero

        // Normaliza a média para o total de pesos
        return (somaNotasPonderadas / somaPesos).toFixed(2);
    }

    // Adicionar frequência
    adicionarFrequencia(disciplinaId, data, presente) {
        const frequenciaObj = {
            id: this.generateId(),
            disciplinaId,
            data,
            presente
        };
        this.frequencias.push(frequenciaObj);
        return frequenciaObj;
    }

    // Calcular percentual de frequência por disciplina
    calcularFrequenciaDisciplina(disciplinaId) {
        const frequenciasDisciplina = this.frequencias.filter(freq => freq.disciplinaId === disciplinaId);

        // Se não há aulas registradas, a frequência é 0%.
        if (frequenciasDisciplina.length === 0) return 0;

        const presentes = frequenciasDisciplina.filter(freq => freq.presente).length;
        return ((presentes / frequenciasDisciplina.length) * 100).toFixed(0);
    }

    // Verificar se está aprovado (média >= 6 e frequência >= 75%)
    verificarAprovacao(disciplinaId) {
        const media = parseFloat(this.calcularMediaDisciplina(disciplinaId));
        const frequencia = parseFloat(this.calcularFrequenciaDisciplina(disciplinaId));

        // Se não houver aulas registradas (frequencia == 0), aprova só pela média
        if (this.frequencias.filter(freq => freq.disciplinaId === disciplinaId).length === 0) {
            return media >= 6; // Aprova por nota se não houver registro de frequência
        }

        return media >= 6 && frequencia >= 75;
    }
}

// Classe Professor
class Professor extends Pessoa {
    constructor(nome, matricula, cpf, areaAtuacao, contato, disciplinas = []) {
        super(nome, matricula, cpf, contato);
        this.areaAtuacao = areaAtuacao;
        this.disciplinas = disciplinas;
    }

    // Lançar nota para aluno (agora com peso)
    lancarNota(aluno, disciplinaId, tipoAvaliacao, peso, nota, data) {
        return aluno.adicionarNota(disciplinaId, tipoAvaliacao, peso, nota, data);
    }

    // Registrar frequência para aluno
    registrarFrequencia(aluno, disciplinaId, data, presente) {
        return aluno.adicionarFrequencia(disciplinaId, data, presente);
    }
}

// Classe Turma
class Turma {
    constructor(nome, disciplinaId, professorId, turno, ano, semestre) {
        this.nome = nome;
        this.disciplinaId = disciplinaId;
        this.professorId = professorId;
        this.turno = turno;
        this.ano = ano;
        this.semestre = semestre;
        this.alunos = []; 
        this.id = this.generateId();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    adicionarAluno(alunoId) {
        if (!this.alunos.includes(alunoId)) {
            this.alunos.push(alunoId);
        }
    }

    removerAluno(alunoId) {
        this.alunos = this.alunos.filter(id => id !== alunoId);
    }
}

// Classe Disciplina
class Disciplina {
    constructor(nome, codigo, descricao = '') {
        this.nome = nome;
        this.codigo = codigo;
        this.descricao = descricao;
        this.id = this.generateId();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}


// Classe para gerenciar o sistema
class SistemaAcademico {
    constructor() {
        this.alunos = [];
        this.professores = [];
        this.turmas = [];
        this.disciplinas = [];
    }

    // Métodos para Alunos
    adicionarAluno(aluno) {
        this.alunos.push(aluno);
        return aluno;
    }

    obterAluno(id) {
        return this.alunos.find(aluno => aluno.id === id);
    }

    obterAlunos() {
        return this.alunos;
    }

    // Métodos para Professores
    adicionarProfessor(professor) {
        this.professores.push(professor);
        return professor;
    }

    obterProfessor(id) {
        return this.professores.find(professor => professor.id === id);
    }

    obterProfessores() {
        return this.professores;
    }

    // Métodos para Turmas
    adicionarTurma(turma) {
        this.turmas.push(turma);
        return turma;
    }

    obterTurma(id) {
        return this.turmas.find(turma => turma.id === id);
    }

    obterTurmas() {
        return this.turmas;
    }

    // Métodos para Disciplinas
    adicionarDisciplina(disciplina) {
        this.disciplinas.push(disciplina);
        return disciplina;
    }

    obterDisciplina(id) {
        return this.disciplinas.find(disciplina => disciplina.id === id);
    }

    obterDisciplinas() {
        return this.disciplinas;
    }
}