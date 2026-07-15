/**
 * Location - Representa uma locação no trajeto da perseguição.
 */
class Location {
    /**
     * @param {Object} config
     * @param {string} config.name - Nome da locação
     * @param {string} config.description - Descrição narrativa
     * @param {number} config.index - Posição no trajeto (0-based)
     */
    constructor({
        name = 'Locação',
        description = '',
        index = 0
    } = {}) {
        this.id = Location.generateId();
        this.name = name;
        this.description = description;
        this.index = index;
        /** @type {Obstacle[]} */
        this.obstacles = [];
    }

    /**
     * Adiciona um obstáculo à locação
     * @param {Obstacle} obstacle
     */
    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    /**
     * Remove um obstáculo pelo id
     * @param {string} obstacleId
     */
    removeObstacle(obstacleId) {
        this.obstacles = this.obstacles.filter(o => o.id !== obstacleId);
    }

    /**
     * Retorna obstáculos ativos
     */
    getActiveObstacles() {
        return this.obstacles.filter(o => o.active);
    }

    /**
     * Verifica se tem risco ativo
     */
    hasActiveHazard() {
        return this.obstacles.some(o => o.active && o.isHazard());
    }

    /**
     * Verifica se tem barreira ativa
     */
    hasActiveBarrier() {
        return this.obstacles.some(o => o.active && o.isBarrier());
    }

    /**
     * Retorna a primeira barreira ativa (para bloquear passagem)
     */
    getFirstActiveBarrier() {
        return this.obstacles.find(o => o.active && o.isBarrier()) || null;
    }

    /**
     * Retorna riscos ativos
     */
    getActiveHazards() {
        return this.obstacles.filter(o => o.active && o.isHazard());
    }

    static generateId() {
        return 'loc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }
}
