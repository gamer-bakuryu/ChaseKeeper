/**
 * Character - Representa um participante da perseguição.
 */
class Character {
    /**
     * @param {Object} config
     * @param {string} config.name - Nome do personagem
     * @param {string} config.role - 'pursuer' (perseguidor) ou 'fugitive' (fugitivo)
     * @param {number} config.dex - DEX (Destreza) - determina ordem dos turnos
     * @param {number} config.con - CON (Constituição) - teste de Corrida
     * @param {number} config.mov - MOV (Velocidade) - vantagem de velocidade
     * @param {number} config.locationIndex - Posição inicial no trajeto
     */
    constructor({
        name = 'Personagem',
        role = 'pursuer',
        dex = 50,
        con = 50,
        mov = 8,
        locationIndex = 0
    } = {}) {
        this.id = Character.generateId();
        this.name = name;
        this.role = role; // 'pursuer' ou 'fugitive'
        this.dex = dex;
        this.con = con;
        this.mov = mov;
        this.locationIndex = locationIndex;

        // Estado do turno
        this.hasMoved = false;
        this.hasActed = false;
        this.isSprinting = false;
        this.turnComplete = false;

        // Status
        this.isActive = true; // Ainda participa da perseguição
        this.isHidden = false;
        this.notes = '';
    }

    isPursuer() {
        return this.role === 'pursuer';
    }

    isFugitive() {
        return this.role === 'fugitive';
    }

    getRoleLabel() {
        return this.role === 'pursuer' ? 'Perseguidor' : 'Fugitivo';
    }

    getRoleIcon() {
        return this.role === 'pursuer' ? '🔴' : '🔵';
    }

    getInitials() {
        return this.name.substring(0, 2).toUpperCase();
    }

    /**
     * Reseta estado do turno para uma nova rodada
     */
    resetTurn() {
        this.hasMoved = false;
        this.hasActed = false;
        this.isSprinting = false;
        this.turnComplete = false;
    }

    /**
     * Marca que se moveu
     */
    markMoved() {
        this.hasMoved = true;
    }

    /**
     * Marca que agiu
     */
    markActed() {
        this.hasActed = true;
    }

    /**
     * Marca turno como completo
     */
    completeTurn() {
        this.turnComplete = true;
    }

    /**
     * Verifica se pode se mover
     */
    canMove() {
        return !this.hasMoved && !this.turnComplete;
    }

    /**
     * Verifica se pode agir
     */
    canAct() {
        return !this.hasActed && !this.isSprinting && !this.turnComplete;
    }

    /**
     * Verifica se pode fazer Corrida
     */
    canSprint() {
        return !this.hasActed && !this.hasMoved && !this.turnComplete;
    }

    /**
     * Calcula diferença de MOV em relação a outro personagem
     * @param {Character} other
     * @returns {number} Diferença positiva = este é mais rápido
     */
    movAdvantageOver(other) {
        return this.mov - other.mov;
    }

    static generateId() {
        return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }
}
