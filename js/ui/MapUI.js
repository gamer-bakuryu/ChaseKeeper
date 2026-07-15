/**
 * MapUI - Renderiza o mapa visual da perseguição.
 */
class MapUI {
    /**
     * @param {ChaseManager} manager
     */
    constructor(manager) {
        this.manager = manager;
    }

    /**
     * Renderiza o mapa completo
     */
    render() {
        const container = document.getElementById('chase-map');
        const chase = this.manager.chase;
        const currentChar = this.manager.getCurrentCharacter();

        if (!chase.locations.length) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        chase.locations.forEach((loc, idx) => {
            // Conector entre locações
            if (idx > 0) {
                html += `<div class="map-connector">→</div>`;
            }

            // Classes da locação
            const classes = ['map-location-box'];
            if (loc.hasActiveHazard()) classes.push('has-hazard');
            if (loc.hasActiveBarrier()) classes.push('has-barrier');
            if (currentChar && currentChar.locationIndex === idx) classes.push('active-location');

            // Obstáculos
            const obstaclesHTML = loc.getActiveObstacles().map(obs => `
                <div class="map-location-obstacle ${obs.type}">
                    ${obs.type === 'hazard' ? '⚠' : '⛔'} ${obs.name}
                </div>
            `).join('');

            // Tokens dos personagens
            const charsHere = chase.getCharactersAtLocation(idx);
            const tokensHTML = charsHere.map(char => {
                const isCurrent = currentChar && char.id === currentChar.id;
                const tokenClasses = ['map-token', char.role];
                if (isCurrent) tokenClasses.push('current-turn');

                return `
                    <div class="${tokenClasses.join(' ')}" title="${char.name} (${char.getRoleLabel()})">
                        ${char.getInitials()}
                    </div>
                `;
            }).join('');

            html += `
                <div class="map-location" data-location-index="${idx}">
                    <div class="${classes.join(' ')}">
                        <div class="map-location-number">${idx + 1}</div>
                        <div class="map-location-name">${loc.name}</div>
                        ${obstaclesHTML}
                        <div class="map-tokens">${tokensHTML}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Scroll para a locação ativa
        if (currentChar) {
            this._scrollToLocation(currentChar.locationIndex);
        }
    }

    _scrollToLocation(index) {
        const container = document.getElementById('chase-map');
        const locationEl = container.querySelector(`[data-location-index="${index}"]`);
        if (locationEl) {
            locationEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    /**
     * Renderiza a lista de iniciativa na sidebar
     */
    renderInitiative() {
        const container = document.getElementById('initiative-list');
        const chase = this.manager.chase;
        const currentChar = this.manager.getCurrentCharacter();

        container.innerHTML = chase.turnOrder.map((charId, idx) => {
            const char = chase.getCharacter(charId);
            if (!char) return '';

            const classes = ['initiative-entry'];
            if (currentChar && char.id === currentChar.id) classes.push('current');
            if (char.turnComplete) classes.push('done');

            return `
                <li class="${classes.join(' ')}">
                    <div class="init-token ${char.role}">${char.getInitials()}</div>
                    <span class="init-name">${char.name}</span>
                    <span class="init-dex">${char.dex}</span>
                </li>
            `;
        }).join('');
    }
}
