/**
 * Chase - Modelo principal que armazena todo o estado da perseguição.
 */
class Chase {
    constructor() {
        /** @type {Location[]} */
        this.locations = [];
        /** @type {Character[]} */
        this.characters = [];

        this.round = 0;
        this.currentTurnIndex = -1;
        this.turnOrder = []; // IDs dos personagens em ordem de DEX
        this.isRunning = false;

        /** @type {string[]} */
        this.log = [];
    }

    // ========================
    // LOCAÇÕES
    // ========================

    addLocation(config) {
        const loc = new Location({ ...config, index: this.locations.length });
        this.locations.push(loc);
        return loc;
    }

    removeLocation(locationId) {
        const idx = this.locations.findIndex(l => l.id === locationId);
        if (idx === -1) return;
        this.locations.splice(idx, 1);
        // Reindexar
        this.locations.forEach((loc, i) => loc.index = i);
    }

    getLocation(locationId) {
        return this.locations.find(l => l.id === locationId) || null;
    }

    getLocationByIndex(index) {
        return this.locations[index] || null;
    }

    // ========================
    // PERSONAGENS
    // ========================

    addCharacter(config) {
        const char = new Character(config);
        this.characters.push(char);
        return char;
    }

    removeCharacter(characterId) {
        this.characters = this.characters.filter(c => c.id !== characterId);
    }

    getCharacter(characterId) {
        return this.characters.find(c => c.id === characterId) || null;
    }

    getActiveCharacters() {
        return this.characters.filter(c => c.isActive);
    }

    getCharactersAtLocation(locationIndex) {
        return this.characters.filter(c => c.locationIndex === locationIndex && c.isActive);
    }

    // ========================
    // ORDEM DE TURNO (DEX)
    // ========================

    /**
     * Calcula a ordem de turnos baseada em DEX (maior primeiro)
     */
    calculateTurnOrder() {
        this.turnOrder = this.getActiveCharacters()
            .sort((a, b) => b.dex - a.dex)
            .map(c => c.id);
    }

    getCurrentCharacter() {
        if (this.currentTurnIndex < 0 || this.currentTurnIndex >= this.turnOrder.length) {
            return null;
        }
        return this.getCharacter(this.turnOrder[this.currentTurnIndex]);
    }

    // ========================
    // FLUXO DA PERSEGUIÇÃO
    // ========================

    start() {
        this.isRunning = true;
        this.round = 0;
        this.calculateTurnOrder();
        this.nextRound();
    }

    nextRound() {
        this.round++;
        this.currentTurnIndex = -1;
        // Resetar turnos
        this.getActiveCharacters().forEach(c => c.resetTurn());
        // Recalcular ordem (caso alguém tenha sido desativado)
        this.calculateTurnOrder();
        this.addLog(`═══ RODADA ${this.round} ═══`, 'round-marker');
    }

    nextTurn() {
        // Marcar turno atual como completo
        const current = this.getCurrentCharacter();
        if (current) {
            current.completeTurn();
        }

        this.currentTurnIndex++;

        // Se passou por todos, nova rodada
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.nextRound();
            this.currentTurnIndex = 0;
        }

        const next = this.getCurrentCharacter();
        if (next) {
            this.addLog(`▸ Turno de ${next.name} (DEX ${next.dex})`, 'action');
        }

        return next;
    }

    end() {
        this.isRunning = false;
        this.addLog('═══ PERSEGUIÇÃO ENCERRADA ═══', 'round-marker');
    }

    // ========================
    // MOVIMENTO
    // ========================

    /**
     * Move um personagem em uma direção
     * @param {string} characterId
     * @param {number} direction - 1 (avançar) ou -1 (recuar)
     * @returns {{ success: boolean, blocked: boolean, obstacle: Obstacle|null }}
     */
    moveCharacter(characterId, direction) {
        const char = this.getCharacter(characterId);
        if (!char) return { success: false, blocked: false, obstacle: null };

        const targetIndex = char.locationIndex + direction;

        // Limites do mapa
        if (targetIndex < 0 || targetIndex >= this.locations.length) {
            return { success: false, blocked: false, obstacle: null };
        }

        const targetLocation = this.locations[targetIndex];

        // Verificar barreira ativa na locação de destino
        const barrier = targetLocation.getFirstActiveBarrier();
        if (barrier) {
            return { success: false, blocked: true, obstacle: barrier };
        }

        // Mover
        char.locationIndex = targetIndex;
        char.markMoved();

        // Verificar riscos na locação de destino
        const hazards = targetLocation.getActiveHazards();

        this.addLog(`${char.name} moveu para "${targetLocation.name}" (Locação ${targetIndex + 1})`);

        return { success: true, blocked: false, obstacle: hazards.length > 0 ? hazards[0] : null };
    }

    // ========================
    // CORRIDA (SPRINT)
    // ========================

    /**
     * Calcula se o personagem tem vantagem de MOV para Corrida automática
     * @param {string} characterId
     * @returns {boolean}
     */
    hasAutoSprintAdvantage(characterId) {
        const char = this.getCharacter(characterId);
        if (!char) return false;

        // Verifica se há diferença de 3+ MOV contra algum oponente
        const opponents = this.getActiveCharacters().filter(c =>
            c.role !== char.role
        );

        return opponents.some(opp => char.movAdvantageOver(opp) >= 3);
    }

    /**
     * Verifica se o personagem tem dado bônus por MOV
     * @param {string} characterId
     * @returns {boolean}
     */
    hasMovBonus(characterId) {
        const char = this.getCharacter(characterId);
        if (!char) return false;

        const opponents = this.getActiveCharacters().filter(c => c.role !== char.role);
        const diff = opponents.reduce((max, opp) => Math.max(max, char.movAdvantageOver(opp)), 0);
        return diff >= 1 && diff <= 2;
    }

    // ========================
    // VERIFICAÇÕES MOV
    // ========================

    /**
     * Retorna a maior diferença de MOV entre um personagem e seus oponentes
     * @param {string} characterId
     * @returns {number}
     */
    getMaxMovAdvantage(characterId) {
        const char = this.getCharacter(characterId);
        if (!char) return 0;

        const opponents = this.getActiveCharacters().filter(c => c.role !== char.role);
        if (opponents.length === 0) return 0;

        return opponents.reduce((max, opp) => Math.max(max, char.movAdvantageOver(opp)), 0);
    }

    // ========================
    // LOG
    // ========================

    addLog(message, type = '') {
        this.log.push({ message, type, timestamp: Date.now() });
    }

    // ========================
    // VALIDAÇÃO
    // ========================

    canStart() {
        const errors = [];

        if (this.locations.length < 2) {
            errors.push('São necessárias pelo menos 2 locações.');
        }

        if (this.characters.length < 2) {
            errors.push('São necessários pelo menos 2 participantes.');
        }

        const hasPursuer = this.characters.some(c => c.role === 'pursuer');
        const hasFugitive = this.characters.some(c => c.role === 'fugitive');

        if (!hasPursuer) errors.push('É necessário ao menos um perseguidor.');
        if (!hasFugitive) errors.push('É necessário ao menos um fugitivo.');

        // Verificar se posições são válidas
        const invalidPos = this.characters.some(c =>
            c.locationIndex < 0 || c.locationIndex >= this.locations.length
        );
        if (invalidPos) errors.push('Algum participante está em uma locação inválida.');

        return { valid: errors.length === 0, errors };
    }
}
