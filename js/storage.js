// Sistema de persistência em JSON
class StorageManager {
    constructor() {
        this.storageKey = 'sistema_academico';
        this.data = this.carregarDados();
    }

    // Carregar dados do localStorage
    carregarDados() {
        try {
            const dados = localStorage.getItem(this.storageKey);
            if (dados) {
                const parsedData = JSON.parse(dados);
                // Garantir que a estrutura base exista
                return {
                    alunos: parsedData.alunos || [],
                    professores: parsedData.professores || [],
                    turmas: parsedData.turmas || [],
                    disciplinas: parsedData.disciplinas || [],
                    ultimaAtualizacao: parsedData.ultimaAtualizacao || new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
        
        // Retorna estrutura vazia se não houver dados
        return {
            alunos: [],
            professores: [],
            turmas: [],
            disciplinas: [],
            ultimaAtualizacao: new Date().toISOString()
        };
    }

    // Salvar dados no localStorage
    salvarDados() {
        try {
            this.data.ultimaAtualizacao = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }

    // Métodos para Alunos
    adicionarAluno(aluno) {
        this.data.alunos.push(aluno);
        return this.salvarDados();
    }

    obterAlunos() {
        return this.data.alunos;
    }

    obterAluno(id) {
        return this.data.alunos.find(aluno => aluno.id === id);
    }

    atualizarAluno(id, dadosAtualizados) {
        const index = this.data.alunos.findIndex(aluno => aluno.id === id);
        if (index !== -1) {
            this.data.alunos[index] = { ...this.data.alunos[index], ...dadosAtualizados };
            return this.salvarDados();
        }
        return false;
    }

    removerAluno(id) {
        const index = this.data.alunos.findIndex(aluno => aluno.id === id);
        if (index !== -1) {
            this.data.alunos.splice(index, 1);
            return this.salvarDados();
        }
        return false;
    }

    // Métodos para Professores
    adicionarProfessor(professor) {
        this.data.professores.push(professor);
        return this.salvarDados();
    }

    obterProfessores() {
        return this.data.professores;
    }

    obterProfessor(id) {
        return this.data.professores.find(professor => professor.id === id);
    }

    atualizarProfessor(id, dadosAtualizados) {
        const index = this.data.professores.findIndex(professor => professor.id === id);
        if (index !== -1) {
            this.data.professores[index] = { ...this.data.professores[index], ...dadosAtualizados };
            return this.salvarDados();
        }
        return false;
    }

    removerProfessor(id) {
        const index = this.data.professores.findIndex(professor => professor.id === id);
        if (index !== -1) {
            this.data.professores.splice(index, 1);
            return this.salvarDados();
        }
        return false;
    }

    // Métodos para Turmas
    adicionarTurma(turma) {
        this.data.turmas.push(turma);
        return this.salvarDados();
    }

    obterTurmas() {
        return this.data.turmas;
    }

    obterTurma(id) {
        return this.data.turmas.find(turma => turma.id === id);
    }

    atualizarTurma(id, dadosAtualizados) {
        const index = this.data.turmas.findIndex(turma => turma.id === id);
        if (index !== -1) {
            this.data.turmas[index] = { ...this.data.turmas[index], ...dadosAtualizados };
            return this.salvarDados();
        }
        return false;
    }

    removerTurma(id) {
        const index = this.data.turmas.findIndex(turma => turma.id === id);
        if (index !== -1) {
            this.data.turmas.splice(index, 1);
            return this.salvarDados();
        }
        return false;
    }

    // Métodos para Disciplinas
    adicionarDisciplina(disciplina) {
        this.data.disciplinas.push(disciplina);
        return this.salvarDados();
    }

    obterDisciplinas() {
        return this.data.disciplinas;
    }

    obterDisciplina(id) {
        return this.data.disciplinas.find(disciplina => disciplina.id === id);
    }

    atualizarDisciplina(id, dadosAtualizados) {
        const index = this.data.disciplinas.findIndex(disciplina => disciplina.id === id);
        if (index !== -1) {
            this.data.disciplinas[index] = { ...this.data.disciplinas[index], ...dadosAtualizados };
            return this.salvarDados();
        }
        return false;
    }

    removerDisciplina(id) {
        const index = this.data.disciplinas.findIndex(disciplina => disciplina.id === id);
        if (index !== -1) {
            this.data.disciplinas.splice(index, 1);
            return this.salvarDados();
        }
        return false;
    }

    // Métodos para Notas (armazenadas nos alunos)
    adicionarNota(alunoId, nota) {
        const aluno = this.obterAluno(alunoId);
        if (aluno) {
            if (!aluno.notas) {
                aluno.notas = [];
            }
            aluno.notas.push(nota);
            return this.salvarDados();
        }
        return false;
    }

    obterNotasAluno(alunoId) {
        const aluno = this.obterAluno(alunoId);
        return aluno ? aluno.notas || [] : [];
    }

    atualizarNota(alunoId, notaId, dadosAtualizados) {
        const aluno = this.obterAluno(alunoId);
        if (aluno && aluno.notas) {
            const index = aluno.notas.findIndex(nota => nota.id === notaId);
            if (index !== -1) {
                aluno.notas[index] = { ...aluno.notas[index], ...dadosAtualizados };
                return this.salvarDados();
            }
        }
        return false;
    }

    removerNota(alunoId, notaId) {
        const aluno = this.obterAluno(alunoId);
        if (aluno && aluno.notas) {
            const index = aluno.notas.findIndex(nota => nota.id === notaId);
            if (index !== -1) {
                aluno.notas.splice(index, 1);
                return this.salvarDados();
            }
        }
        return false;
    }

    // Métodos para Frequências dos Alunos (armazenadas nos alunos)
    adicionarFrequenciaAluno(alunoId, frequencia) {
        const aluno = this.obterAluno(alunoId);
        if (aluno) {
            if (!aluno.frequencias) {
                aluno.frequencias = [];
            }
            aluno.frequencias.push(frequencia);
            return this.salvarDados();
        }
        return false;
    }

    obterFrequenciasAluno(alunoId) {
        const aluno = this.obterAluno(alunoId);
        return aluno ? aluno.frequencias || [] : [];
    }

    // Métodos de backup e restore
    exportarDados() {
        return JSON.stringify(this.data, null, 2);
    }

    importarDados(dadosJson) {
        try {
            const dados = JSON.parse(dadosJson);
            // Validar a estrutura básica
            if (dados.alunos && dados.professores && dados.turmas && dados.disciplinas) {
                 this.data = dados;
                 return this.salvarDados();
            } else {
                throw new Error("Estrutura de dados inválida.");
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    // Limpar todos os dados
    limparDados() {
        this.data = {
            alunos: [],
            professores: [],
            turmas: [],
            disciplinas: [],
            ultimaAtualizacao: new Date().toISOString()
        };
        return this.salvarDados();
    }
    
    // Verificar se há dados
    temDados() {
        return this.data.alunos.length > 0 || 
               this.data.professores.length > 0 || 
               this.data.turmas.length > 0 || 
               this.data.disciplinas.length > 0;
    }
}