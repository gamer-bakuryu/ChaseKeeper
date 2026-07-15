/**
 * ChaseManager - Controla toda a lógica da perseguição,
 * servindo de ponte entre o modelo de dados e a interface.
 */
class ChaseManager {
    constructor() {
        /** @type {Chase} */
        this.chase = new Chase();
        this.phase = 'setup'; // 'setup' ou 'chase'

        // Callbacks para a UI
        this.onUpdate = null;
        this.onPhaseChange = null;
        this.onLogEntry = null;
        this.onTurnChange = null;
    }

    // ========================
    // SETUP - Locações
    // ========================

    addLocation(name, description = '') {
        const loc = this.chase.addLocation({ name, description });
        this._emitUpdate();
        return loc;
    }

    removeLocation(locationId) {
        this.chase.removeLocation(locationId);
        // Ajustar posições dos personagens se necessário
        this.chase.characters.forEach(c => {
            if (c.locationIndex >= this.chase.locations.length) {
                c.locationIndex = Math.max(0, this.chase.locations.length - 1);
            }
        });
        this._emitUpdate();
    }

    addObstacleToLocation(locationId, obstacleConfig) {
        const loc = this.chase.getLocation(locationId);
        if (!loc) return null;
        const obs = new Obstacle(obstacleConfig);
        loc.addObstacle(obs);
        this._emitUpdate();
        return obs;
    }

    removeObstacleFromLocation(locationId, obstacleId) {
        const loc = this.chase.getLocation(locationId);
        if (!loc) return;
        loc.removeObstacle(obstacleId);
        this._emitUpdate();
    }

    // ========================
    // SETUP - Personagens
    // ========================

    addCharacter(config) {
        const char = this.chase.addCharacter(config);
        this._emitUpdate();
        return char;
    }

    removeCharacter(characterId) {
        this.chase.removeCharacter(characterId);
        this._emitUpdate();
    }

    updateCharacter(characterId, updates) {
        const char = this.chase.getCharacter(characterId);
        if (!char) return;
        Object.assign(char, updates);
        this._emitUpdate();
    }

    // ========================
    // INICIAR PERSEGUIÇÃO
    // ========================

    startChase() {
        const validation = this.chase.canStart();
        if (!validation.valid) {
            return validation;
        }

        this.chase.start();
        this.phase = 'chase';
        this._emitPhaseChange('chase');

        // Iniciar primeiro turno
        this.chase.nextTurn();
        this._emitTurnChange();
        this._emitUpdate();

        return { valid: true, errors: [] };
    }

    // ========================
    // TURNO
    // ========================

    getCurrentCharacter() {
        return this.chase.getCurrentCharacter();
    }

    endTurn() {
        const next = this.chase.nextTurn();
        this._emitTurnChange();
        this._emitUpdate();
        return next;
    }

    // ========================
    // AÇÕES DE MOVIMENTO
    // ========================

    /**
     * Move o personagem atual para frente
     */
    moveForward() {
        const char = this.getCurrentCharacter();
        if (!char || !char.canMove()) return null;

        const result = this.chase.moveCharacter(char.id, 1);

        if (result.blocked) {
            this.chase.addLog(
                `⛔ ${char.name} bloqueado por barreira: "${result.obstacle.name}"`,
                'barrier'
            );
        }

        this._emitUpdate();
        return result;
    }

    /**
     * Move o personagem atual para trás
     */
    moveBackward() {
        const char = this.getCurrentCharacter();
        if (!char || !char.canMove()) return null;

        const result = this.chase.moveCharacter(char.id, -1);
        this._emitUpdate();
        return result;
    }

    /**
     * Executa uma Corrida (sprint) - tenta mover 2 locações
     * @returns {{ moved: number, roll: number|null, autoSprint: boolean, obstacle: Obstacle|null }}
     */
    sprint() {
        const char = this.getCurrentCharacter();
        if (!char || !char.canSprint()) return null;

        char.isSprinting = true;
        char.markActed(); // Corrida usa a ação

        const autoSprint = this.chase.hasAutoSprintAdvantage(char.id);
        const hasBonus = this.chase.hasMovBonus(char.id);

        let result = { moved: 0, roll: null, autoSprint, obstacle: null, success: false, critFail: false };

        if (autoSprint) {
            // MOV ≥ 3 de vantagem: Corrida automática
            this.chase.addLog(`${char.name} corre com vantagem de MOV (automático)`, 'action');
            result.success = true;
        } else {
            // Testar CON
            let roll = this._rollD100();
            let target = char.con;

            if (hasBonus) {
                // Dado bônus: rola dois e pega o melhor
                const roll2 = this._rollD100();
                this.chase.addLog(
                    `🎲 ${char.name} testa CON ${target} com dado bônus: ${roll} e ${roll2}`,
                    'roll'
                );
                roll = Math.min(roll, roll2);
            } else {
                this.chase.addLog(
                    `🎲 ${char.name} testa CON ${target}: ${roll}`,
                    'roll'
                );
            }

            result.roll = roll;

            if (roll === 100) {
                // Fracasso Crítico
                result.critFail = true;
                result.success = false;
                this.chase.addLog(`💀 FRACASSO CRÍTICO! ${char.name} não consegue avançar!`, 'hazard');
            } else if (roll <= target) {
                result.success = true;
                this.chase.addLog(`✓ Sucesso! ${char.name} corre velozmente.`, 'action');
            } else {
                result.success = false;
                this.chase.addLog(`✗ Falha! ${char.name} não consegue acelerar.`, 'hazard');
            }
        }

        // Aplicar movimento baseado no resultado
        if (result.critFail) {
            // Fica parado
            result.moved = 0;
            char.markMoved();
        } else if (result.success) {
            // Mover 2 locações (uma de cada vez, verificando obstáculos)
            const move1 = this.chase.moveCharacter(char.id, 1);
            if (move1.success) {
                result.moved = 1;
                if (move1.obstacle) {
                    result.obstacle = move1.obstacle;
                }
                // Resetar hasMoved para permitir segundo movimento
                char.hasMoved = false;
                const move2 = this.chase.moveCharacter(char.id, 1);
                if (move2.success) {
                    result.moved = 2;
                    if (move2.obstacle) {
                        result.obstacle = move2.obstacle;
                    }
                } else if (move2.blocked) {
                    result.obstacle = move2.obstacle;
                    this.chase.addLog(
                        `⛔ ${char.name} bloqueado na segunda locação: "${move2.obstacle.name}"`,
                        'barrier'
                    );
                }
            } else if (move1.blocked) {
                result.obstacle = move1.obstacle;
                char.markMoved();
            }
        } else {
            // Falha: move apenas 1
            const move1 = this.chase.moveCharacter(char.id, 1);
            if (move1.success) {
                result.moved = 1;
                if (move1.obstacle) {
                    result.obstacle = move1.obstacle;
                }
            } else if (move1.blocked) {
                result.obstacle = move1.obstacle;
                char.markMoved();
            }
        }

        char.completeTurn(); // Corrida encerra o turno
        this._emitUpdate();
        return result;
    }

    // ========================
    // AÇÕES
    // ========================

    /**
     * Registra uma ação personalizada
     * @param {string} actionDescription
     */
    performAction(actionDescription) {
        const char = this.getCurrentCharacter();
        if (!char || !char.canAct()) return;

        char.markActed();
        this.chase.addLog(`${char.name}: ${actionDescription}`, 'action');
        this._emitUpdate();
    }

    /**
     * Criar obstáculo na locação atual
     * @param {Object} obstacleConfig
     * @returns {Obstacle|null}
     */
    createObstacle(obstacleConfig) {
        const char = this.getCurrentCharacter();
        if (!char || !char.canAct()) return null;

        const loc = this.chase.getLocationByIndex(char.locationIndex);
        if (!loc) return null;

        const obs = new Obstacle(obstacleConfig);
        loc.addObstacle(obs);

        char.markActed();
        this.chase.addLog(
            `${char.name} cria ${obs.getTypeLabel()}: "${obs.name}" em "${loc.name}"`,
            obs.isBarrier() ? 'barrier' : 'hazard'
        );

        this._emitUpdate();
        return obs;
    }

    /**
     * Tenta superar um obstáculo
     * @param {string} obstacleId
     * @param {number} skillValue - Valor da perícia do personagem
     * @returns {{ success: boolean, roll: number, critical: boolean }}
     */
    attemptObstacle(obstacleId, skillValue) {
        const char = this.getCurrentCharacter();
        if (!char) return null;

        // Encontrar o obstáculo
        let obstacle = null;
        for (const loc of this.chase.locations) {
            obstacle = loc.obstacles.find(o => o.id === obstacleId);
            if (obstacle) break;
        }

        if (!obstacle) return null;

        const roll = this._rollD100();
        const result = {
            roll,
            success: roll <= skillValue,
            criticalSuccess: roll === 1,
            criticalFailure: roll === 100
        };

        this.chase.addLog(
            `🎲 ${char.name} tenta superar "${obstacle.name}" (${obstacle.skill} ${skillValue}): ${roll}`,
            'roll'
        );

        if (result.criticalSuccess || result.success) {
            if (obstacle.isBarrier()) {
                obstacle.deactivate();
                this.chase.addLog(`✓ Barreira superada!`, 'action');
            } else {
                this.chase.addLog(`✓ Risco superado sem consequências!`, 'action');
            }
        } else if (result.criticalFailure) {
            this.chase.addLog(`💀 FRACASSO CRÍTICO ao enfrentar "${obstacle.name}"!`, 'hazard');
        } else {
            if (obstacle.isHazard()) {
                char.markActed();
                this.chase.addLog(`✗ Falha! ${char.name} perde sua ação.`, 'hazard');
            } else {
                this.chase.addLog(`✗ Falha! ${char.name} não consegue superar a barreira.`, 'barrier');
            }
        }

        this._emitUpdate();
        return result;
    }

    // ========================
    // ESCONDER-SE
    // ========================

    attemptHide(skillValue) {
        const char = this.getCurrentCharacter();
        if (!char || !char.canAct()) return null;

        const roll = this._rollD100();
        const success = roll <= skillValue;

        char.markActed();

        this.chase.addLog(
            `🎲 ${char.name} tenta se esconder (Furtividade ${skillValue}): ${roll}`,
            'roll'
        );

        if (success) {
            char.isHidden = true;
            this.chase.addLog(`✓ ${char.name} se escondeu!`, 'action');
        } else {
            this.chase.addLog(`✗ ${char.name} falhou em se esconder.`, 'hazard');
        }

        this._emitUpdate();
        return { roll, success };
    }

    // ========================
    // ENCERRAR
    // ========================

    endChase() {
        this.chase.end();
        this.phase = 'setup';
        this._emitPhaseChange('setup');
        this._emitUpdate();
    }

    resetChase() {
        this.chase = new Chase();
        this.phase = 'setup';
        this._emitPhaseChange('setup');
        this._emitUpdate();
    }

    // ========================
    // ROLAGEM
    // ========================

    _rollD100() {
        return Math.floor(Math.random() * 100) + 1;
    }

    // ========================
    // EVENTOS
    // ========================

    _emitUpdate() {
        if (typeof this.onUpdate === 'function') {
            this.onUpdate(this.chase);
        }
    }

    _emitPhaseChange(phase) {
        if (typeof this.onPhaseChange === 'function') {
            this.onPhaseChange(phase);
        }
    }

    _emitTurnChange() {
        if (typeof this.onTurnChange === 'function') {
            this.onTurnChange(this.getCurrentCharacter());
        }
    }
}
