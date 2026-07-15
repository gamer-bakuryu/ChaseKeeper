/**
 * TurnUI - Controla o painel de turno e as ações disponíveis.
 */
class TurnUI {
    /**
     * @param {ChaseManager} manager
     * @param {Modal} modal
     * @param {MapUI} mapUI
     */
    constructor(manager, modal, mapUI) {
        this.manager = manager;
        this.modal = modal;
        this.mapUI = mapUI;
    }

    /**
     * Atualiza todo o painel de turno
     */
    render() {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        // Atualizar info do personagem
        document.getElementById('turn-char-name').textContent =
            `${char.getRoleIcon()} ${char.name}`;

        const movAdvantage = this.manager.chase.getMaxMovAdvantage(char.id);
        let movNote = '';
        if (movAdvantage >= 3) movNote = ' (Corrida Auto)';
        else if (movAdvantage >= 1) movNote = ' (Dado Bônus)';

        document.getElementById('turn-char-stats').innerHTML = `
            <div class="stat-item">
                <span class="stat-label">DEX</span>
                <span class="stat-value">${char.dex}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">CON</span>
                <span class="stat-value">${char.con}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">MOV</span>
                <span class="stat-value">${char.mov}${movNote}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Locação</span>
                <span class="stat-value">${char.locationIndex + 1}</span>
            </div>
        `;

        // Atualizar info da rodada
        document.getElementById('round-number').textContent = `Rodada ${this.manager.chase.round}`;
        document.getElementById('current-turn-name').textContent = `Turno de ${char.name}`;

        // Atualizar estado dos botões
        this._updateActionButtons(char);
    }

    _updateActionButtons(char) {
        const moveForwardBtn = document.querySelector('[data-action="move-forward"]');
        const moveBackwardBtn = document.querySelector('[data-action="move-backward"]');
        const sprintBtn = document.querySelector('[data-action="sprint"]');
        const attackBtn = document.querySelector('[data-action="attack"]');
        const createObstacleBtn = document.querySelector('[data-action="create-obstacle"]');
        const hideBtn = document.querySelector('[data-action="hide"]');
        const customBtn = document.querySelector('[data-action="custom"]');
        const endTurnBtn = document.getElementById('btn-end-turn');

        // Deslocamento
        const canMove = char.canMove();
        const atStart = char.locationIndex <= 0;
        const atEnd = char.locationIndex >= this.manager.chase.locations.length - 1;

        moveForwardBtn.disabled = !canMove || atEnd;
        moveBackwardBtn.disabled = !canMove || atStart;

        // Corrida
        sprintBtn.disabled = !char.canSprint() || atEnd;
        if (this.manager.chase.hasAutoSprintAdvantage(char.id)) {
            sprintBtn.textContent = 'Corrida (Auto - MOV)';
        } else {
            sprintBtn.textContent = 'Corrida (Teste CON)';
        }

        // Ações
        const canAct = char.canAct();
        attackBtn.disabled = !canAct;
        createObstacleBtn.disabled = !canAct;
        hideBtn.disabled = !canAct;
        customBtn.disabled = !canAct;

        // Botão encerrar turno
        endTurnBtn.disabled = false;
    }

    /**
     * Renderiza o log de eventos
     */
    renderLog() {
        const container = document.getElementById('log-content');
        const logs = this.manager.chase.log;

        // Mostrar os últimos 50 registros
        const recentLogs = logs.slice(-50);

        container.innerHTML = recentLogs.map(entry => `
            <div class="log-entry ${entry.type}">${entry.message}</div>
        `).join('');

        // Scroll para o final
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Processa uma ação do turno
     * @param {string} action
     */
    handleAction(action) {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        switch (action) {
            case 'move-forward':
                this._handleMove(1);
                break;

            case 'move-backward':
                this._handleMove(-1);
                break;

            case 'sprint':
                this._handleSprint();
                break;

            case 'attack':
                this._handleAttack();
                break;

            case 'create-obstacle':
                this._handleCreateObstacle();
                break;

            case 'hide':
                this._handleHide();
                break;

            case 'custom':
                this._handleCustomAction();
                break;

            case 'end-turn':
                this.manager.endTurn();
                break;
        }
    }

    _handleMove(direction) {
        const result = direction === 1 ? this.manager.moveForward() : this.manager.moveBackward();
        if (!result) return;

        if (result.blocked && result.obstacle) {
            // Barreira - precisa superar
            this.modal.showObstacleChallenge(result.obstacle, (skillValue) => {
                const testResult = this.manager.attemptObstacle(result.obstacle.id, skillValue);
                if (testResult) {
                    const resultText = testResult.criticalSuccess ? 'SUCESSO CRÍTICO!' :
                        testResult.success ? 'Sucesso!' :
                            testResult.criticalFailure ? 'FRACASSO CRÍTICO!' : 'Falha!';

                    this.modal.showDiceResult(
                        'Teste de Obstáculo',
                        testResult.roll,
                        skillValue,
                        resultText
                    );

                    if (testResult.success || testResult.criticalSuccess) {
                        // Tentar mover novamente após superar barreira
                        if (direction === 1) {
                            this.manager.moveForward();
                        } else {
                            this.manager.moveBackward();
                        }
                    }
                }
            });
        } else if (result.success && result.obstacle) {
            // Risco - precisa testar
            this.modal.showObstacleChallenge(result.obstacle, (skillValue) => {
                const testResult = this.manager.attemptObstacle(result.obstacle.id, skillValue);
                if (testResult) {
                    const resultText = testResult.criticalSuccess ? 'SUCESSO CRÍTICO!' :
                        testResult.success ? 'Risco superado!' :
                            testResult.criticalFailure ? 'FRACASSO CRÍTICO!' : 'Falha - ação perdida!';

                    this.modal.showDiceResult(
                        'Risco!',
                        testResult.roll,
                        skillValue,
                        resultText
                    );
                }
            });
        }
    }

    _handleSprint() {
        const result = this.manager.sprint();
        if (!result) return;

        if (result.autoSprint) {
            this.manager.chase.addLog(
                `➤ ${this.manager.getCurrentCharacter()?.name || 'Personagem'} se move ${result.moved} locação(ões) automaticamente.`,
                'action'
            );
        } else if (result.roll !== null) {
            const char = this.manager.chase.getCharacter(
                this.manager.chase.turnOrder[this.manager.chase.currentTurnIndex]
            );
            const resultText = result.critFail ? 'FRACASSO CRÍTICO! Parado!' :
                result.success ? `Sucesso! Moveu ${result.moved} locação(ões).` :
                    `Falha. Moveu apenas ${result.moved} locação(ões).`;

            this.modal.showDiceResult(
                'Corrida - Teste de CON',
                result.roll,
                char ? char.con : 50,
                resultText
            );
        }

        // Verificar obstáculos encontrados durante a corrida
        if (result.obstacle) {
            setTimeout(() => {
                this.modal.showObstacleChallenge(result.obstacle, (skillValue) => {
                    const testResult = this.manager.attemptObstacle(result.obstacle.id, skillValue);
                    if (testResult) {
                        const text = testResult.success ? 'Obstáculo superado!' : 'Falha!';
                        this.modal.showDiceResult('Obstáculo durante Corrida', testResult.roll, skillValue, text);
                    }
                });
            }, 500);
        }
    }

    _handleAttack() {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        this.modal.showCustomAction(char.name, (desc) => {
            this.manager.performAction(`Ataque: ${desc}`);
        });
    }

    _handleCreateObstacle() {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        const loc = this.manager.chase.getLocationByIndex(char.locationIndex);
        if (!loc) return;

        this.modal.showCreateObstacleForm(loc.name, (obsData) => {
            this.manager.createObstacle(obsData);
        });
    }

    _handleHide() {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        this.modal.showHideAction(char.name, (skillValue) => {
            const result = this.manager.attemptHide(skillValue);
            if (result) {
                this.modal.showDiceResult(
                    'Esconder-se',
                    result.roll,
                    skillValue,
                    result.success ? 'Escondeu-se com sucesso!' : 'Falhou em se esconder!'
                );
            }
        });
    }

    _handleCustomAction() {
        const char = this.manager.getCurrentCharacter();
        if (!char) return;

        this.modal.showCustomAction(char.name, (desc) => {
            this.manager.performAction(desc);
        });
    }
}
