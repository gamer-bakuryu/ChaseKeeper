/**
 * App - Ponto de entrada principal da aplicação.
 * Inicializa todos os componentes e conecta eventos.
 */
(function () {
    'use strict';

    // ========================
    // INSTÂNCIAS
    // ========================
    const manager = new ChaseManager();
    const modal = new Modal();
    const characterUI = new CharacterUI(manager, modal);
    const mapUI = new MapUI(manager);
    const turnUI = new TurnUI(manager, modal, mapUI);

    // ========================
    // CALLBACKS DO MANAGER
    // ========================
    manager.onUpdate = function () {
        if (manager.phase === 'setup') {
            characterUI.renderLocations();
            characterUI.renderCharacters();
            characterUI.updateValidation();
        } else {
            mapUI.render();
            mapUI.renderInitiative();
            turnUI.render();
            turnUI.renderLog();
        }
    };

    manager.onPhaseChange = function (phase) {
        const setupEl = document.getElementById('setup-phase');
        const chaseEl = document.getElementById('chase-phase');

        if (phase === 'setup') {
            setupEl.classList.add('active');
            chaseEl.classList.remove('active');
        } else {
            setupEl.classList.remove('active');
            chaseEl.classList.add('active');
        }
    };

    manager.onTurnChange = function () {
        mapUI.render();
        mapUI.renderInitiative();
        turnUI.render();
        turnUI.renderLog();
    };

    // ========================
    // EVENTOS DO HEADER
    // ========================
    document.getElementById('btn-new-chase').addEventListener('click', function () {
        if (manager.phase === 'chase') {
            modal.showConfirm(
                'Nova Perseguição',
                'A perseguição atual será descartada. Deseja continuar?',
                function () {
                    manager.resetChase();
                }
            );
        } else {
            manager.resetChase();
        }
    });

    document.getElementById('btn-help').addEventListener('click', function () {
        modal.showRules();
    });

    // ========================
    // EVENTOS DO SETUP
    // ========================
    document.getElementById('btn-add-location').addEventListener('click', function () {
        modal.showLocationForm(null, function (data) {
            manager.addLocation(data.name, data.description);
        });
    });

    document.getElementById('btn-add-character').addEventListener('click', function () {
        modal.showCharacterForm(
            null,
            manager.chase.locations.length,
            function (data) {
                manager.addCharacter(data);
            }
        );
    });

    document.getElementById('btn-start-chase').addEventListener('click', function () {
        const result = manager.startChase();
        if (!result.valid) {
            document.getElementById('setup-validation').textContent = result.errors.join(' ');
        }
    });

    // ========================
    // EVENTOS DA PERSEGUIÇÃO
    // ========================

    // Botões de ação do turno (delegação de eventos)
    document.getElementById('turn-panel').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (btn && !btn.disabled) {
            turnUI.handleAction(btn.dataset.action);
        }
    });

    // Encerrar perseguição
    document.getElementById('btn-end-chase').addEventListener('click', function () {
        modal.showConfirm(
            'Encerrar Perseguição',
            'Deseja encerrar a perseguição atual?',
            function () {
                manager.endChase();
            }
        );
    });

    // Toggle do log
    document.getElementById('btn-toggle-log').addEventListener('click', function () {
        const content = document.getElementById('log-content');
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'flex' : 'none';
        this.textContent = isHidden ? '▼' : '▲';
    });

    // ========================
    // INICIALIZAÇÃO
    // ========================

    // Renderizar estado inicial
    characterUI.renderLocations();
    characterUI.renderCharacters();
    characterUI.updateValidation();

    // Adicionar locações de exemplo para facilitar teste
    // (Comentar se não quiser exemplos)
    _addExampleData();

    function _addExampleData() {
        manager.addLocation('Rua Principal', 'Uma rua larga e movimentada');
        manager.addLocation('Beco Estreito', 'Um beco escuro entre dois prédios');
        manager.addLocation('Mercado', 'Barracas e multidão');
        manager.addLocation('Ponte Velha', 'Uma ponte de madeira sobre o rio');
        manager.addLocation('Praça da Igreja', 'Destino final');

        // Adicionar obstáculos
        const locations = manager.chase.locations;
        if (locations[2]) {
            manager.addObstacleToLocation(locations[2].id, {
                name: 'Multidão',
                type: 'hazard',
                skill: 'Destreza',
                difficulty: 45,
                description: 'Uma multidão densa bloqueia parcialmente a passagem.'
            });
        }
        if (locations[3]) {
            manager.addObstacleToLocation(locations[3].id, {
                name: 'Tábua Solta',
                type: 'hazard',
                skill: 'Saltar',
                difficulty: 40,
                description: 'Uma tábua da ponte está solta e pode ceder.'
            });
        }

        // Adicionar personagens
        manager.addCharacter({
            name: 'Investigador',
            role: 'pursuer',
            dex: 55,
            con: 50,
            mov: 8,
            locationIndex: 0
        });

        manager.addCharacter({
            name: 'Cultista',
            role: 'fugitive',
            dex: 45,
            con: 40,
            mov: 7,
            locationIndex: 2
        });
    }

})();
