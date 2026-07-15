/**
 * Obstacle - Representa um Risco ou Barreira em uma locação.
 *
 * Riscos: atrasam ou causam consequências, mas não impedem a passagem.
 * Barreiras: impedem completamente o avanço até serem superadas.
 */
class Obstacle {
    /**
     * @param {Object} config
     * @param {string} config.name - Nome do obstáculo
     * @param {string} config.type - 'hazard' (risco) ou 'barrier' (barreira)
     * @param {string} config.skill - Perícia sugerida para superar
     * @param {number} config.difficulty - Dificuldade do teste (valor alvo)
     * @param {string} config.description - Descrição narrativa
     * @param {boolean} config.active - Se o obstáculo ainda está ativo
     */
    constructor({
        name = 'Obstáculo',
        type = 'hazard',
        skill = 'Destreza',
        difficulty = 50,
        description = '',
        active = true
    } = {}) {
        this.id = Obstacle.generateId();
        this.name = name;
        this.type = type; // 'hazard' ou 'barrier'
        this.skill = skill;
        this.difficulty = difficulty;
        this.description = description;
        this.active = active;
    }

    isHazard() {
        return this.type === 'hazard';
    }

    isBarrier() {
        return this.type === 'barrier';
    }

    deactivate() {
        this.active = false;
    }

    getTypeLabel() {
        return this.type === 'hazard' ? 'Risco' : 'Barreira';
    }

    static generateId() {
        return 'obs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }
}
