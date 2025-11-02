// Configurações do Sistema Acadêmico
const CONFIG = {
    // Configurações de validação
    validacao: {
        cpf: {
            habilitado: true,
            mensagem: 'CPF inválido!'
        },
        matricula: {
            habilitado: true,
            mensagem: 'Matrícula já cadastrada!'
        },
        camposObrigatorios: {
            habilitado: true,
            mensagem: 'Preencha todos os campos obrigatórios!'
        }
    },

    // Configurações de notas
    notas: {
        valorMinimo: 0,
        valorMaximo: 10,
        casasDecimais: 1,
        aprovacao: {
            mediaMinima: 6.0, 
            frequenciaMinima: 75.0
        }
    },

    // Configurações de interface
    interface: {
        tema: 'azul-escuro',
        animacoes: true,
        notificacoes: true,
        timeoutNotificacoes: 5000
    },

    // Configurações de backup
    backup: {
        formato: 'json',
        incluirMetadados: true,
        compressao: false,
        nomeArquivo: 'backup_sistema_academico'
    },

    // Configurações de dados
    dados: {
        inicializarExemplo: true,
        limparAoInicializar: false,
        validarIntegridade: true
    },

    // Configurações de relatórios
    relatorios: {
        formatos: ['json', 'csv'],
        incluirEstatisticas: true,
        incluirGraficos: false,
        filtrosAvancados: true
    },

    // Configurações de performance
    performance: {
        cache: true,
        lazyLoading: true,
        debounce: 300,
        maxRegistros: 1000
    },

    // Mensagens do sistema
    mensagens: {
        sucesso: {
            cadastro: 'Cadastrado com sucesso!',
            atualizacao: 'Atualizado com sucesso!',
            remocao: 'Removido com sucesso!',
            backup: 'Backup realizado com sucesso!',
            restore: 'Dados restaurados com sucesso!'
        },
        erro: {
            cadastro: 'Erro ao cadastrar!',
            atualizacao: 'Erro ao atualizar!',
            remocao: 'Erro ao remover!',
            backup: 'Erro ao fazer backup!',
            restore: 'Erro ao restaurar dados!',
            validacao: 'Dados inválidos!',
            conexao: 'Erro de conexão!'
        },
        confirmacao: {
            remocao: 'Tem certeza que deseja remover?',
            limpeza: 'Tem certeza que deseja limpar TODOS os dados?',
            backup: 'Deseja fazer backup dos dados atuais?'
        }
    },

    // Configurações de desenvolvimento
    desenvolvimento: {
        debug: false,
        logs: true,
        validacaoExtra: true,
        simulacaoLenta: false
    }
};

// Função para obter configuração
function obterConfiguracao(chave) {
    const chaves = chave.split('.');
    let valor = CONFIG;
    
    for (const ch of chaves) {
        if (valor && valor[ch] !== undefined) {
            valor = valor[ch];
        } else {
            return undefined;
        }
    }
    
    return valor;
}

// Função para definir configuração
function definirConfiguracao(chave, valor) {
    const chaves = chave.split('.');
    let objeto = CONFIG;
    
    for (let i = 0; i < chaves.length - 1; i++) {
        if (!objeto[chaves[i]]) {
            objeto[chaves[i]] = {};
        }
        objeto = objeto[chaves[i]];
    }
    
    objeto[chaves[chaves.length - 1]] = valor;
}

// Função para validar configuração
function validarConfiguracao() {
    const erros = [];
    
    // Validar configurações de notas
    if (CONFIG.notas.valorMinimo < 0) {
        erros.push('Valor mínimo de notas deve ser >= 0');
    }
    
    if (CONFIG.notas.valorMaximo > 10) {
        erros.push('Valor máximo de notas deve ser <= 10');
    }
    
    if (CONFIG.notas.valorMinimo >= CONFIG.notas.valorMaximo) {
        erros.push('Valor mínimo deve ser menor que valor máximo');
    }
    
    // Validar configurações de aprovação
    if (CONFIG.notas.aprovacao.mediaMinima < 0 || CONFIG.notas.aprovacao.mediaMinima > 10) {
        erros.push('Média mínima para aprovação deve estar entre 0 e 10');
    }
    
    if (CONFIG.notas.aprovacao.frequenciaMinima < 0 || CONFIG.notas.aprovacao.frequenciaMinima > 100) {
        erros.push('Frequência mínima para aprovação deve estar entre 0 e 100');
    }
    
    // Validar configurações de performance
    if (CONFIG.performance.maxRegistros < 1) {
        erros.push('Máximo de registros deve ser >= 1');
    }
    
    if (CONFIG.performance.debounce < 0) {
        erros.push('Debounce deve ser >= 0');
    }
    
    return {
        valido: erros.length === 0,
        erros: erros
    };
}

// Função para resetar configurações
function resetarConfiguracao() {
    // Recarregar configurações padrão
    location.reload();
}

// Função para exportar configurações
function exportarConfiguracao() {
    return JSON.stringify(CONFIG, null, 2);
}

// Função para importar configurações
function importarConfiguracao(configJson) {
    try {
        const config = JSON.parse(configJson);
        Object.assign(CONFIG, config);
        return true;
    } catch (error) {
        console.error('Erro ao importar configurações:', error);
        return false;
    }
}

// Configurações específicas por módulo
const CONFIG_MODULOS = {
    alunos: {
        validacaoCPF: true,
        validacaoMatricula: true,
        camposObrigatorios: ['nome', 'matricula', 'cpf', 'dataNascimento', 'contato']
    },
    professores: {
        validacaoCPF: true,
        validacaoMatricula: true,
        camposObrigatorios: ['nome', 'matricula', 'cpf', 'areaAtuacao', 'contato']
    },
    turmas: {
        validacaoReferencias: true,
        camposObrigatorios: ['nome', 'disciplinaId', 'professorId', 'turno', 'ano', 'semestre']
    },
    notas: {
        validacaoValor: true,
        calculoAutomatico: true,
        tiposAvaliacao: ['prova1', 'prova2', 'trabalho', 'atividade']
    },
    frequencia: {
        validacaoData: true,
        calculoAutomatico: true,
        tiposPresenca: ['presente', 'ausente']
    },
    relatorios: {
        filtrosDisponiveis: ['disciplina', 'professor', 'turma', 'periodo'],
        formatosDisponiveis: ['json', 'csv'],
        incluirGraficos: false
    }
};

// Função para obter configuração de módulo
function obterConfiguracaoModulo(modulo) {
    return CONFIG_MODULOS[modulo] || {};
}

// Função para validar configuração de módulo
function validarConfiguracaoModulo(modulo) {
    const config = obterConfiguracaoModulo(modulo);
    const erros = [];
    
    if (config.camposObrigatorios && !Array.isArray(config.camposObrigatorios)) {
        erros.push(`Campos obrigatórios do módulo ${modulo} devem ser um array`);
    }
    
    if (config.intervaloAtualizacao && config.intervaloAtualizacao < 1000) {
        erros.push(`Intervalo de atualização do módulo ${modulo} deve ser >= 1000ms`);
    }
    
    return {
        valido: erros.length === 0,
        erros: erros
    };
}