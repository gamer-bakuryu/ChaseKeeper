/**
 * CharacterUI - Renderiza a lista de personagens e locações no setup.
 */
class CharacterUI {
    /**
     * @param {ChaseManager} manager
     * @param {Modal} modal
     */
    constructor(manager, modal) {
        this.manager = manager;
        this.modal = modal;
    }

    // ========================
    // RENDERIZAR LOCAÇÕES (SETUP)
    // ========================

    renderLocations() {
        const container = document.getElementById('locations-list');
        const locations = this.manager.chase.locations;

        if (locations.length === 0) {
            container.innerHTML = '<p class="empty-message">Adicione locações para criar o trajeto da perseguição.</p>';
            return;
        }

        container.innerHTML = locations.map((loc, idx) => {
            const obstaclesHTML = loc.obstacles.map(obs => `
                <span class="badge ${obs.type === 'hazard' ? 'badge-hazard' : 'badge-barrier'}">
                    ${obs.name}
                    <button class="btn btn-ghost btn-tiny" data-remove-obstacle="${obs.id}" data-location="${loc.id}" title="Remover">✕</button>
                </span>
            `).join('');

            return `
                <div class="location-item" data-location-id="${loc.id}">
                    <div class="location-index">${idx + 1}</div>
                    <div class="location-info">
                        <div class="location-name">${loc.name}</div>
                        ${loc.description ? `<div class="location-detail">${loc.description}</div>` : ''}
                        ${obstaclesHTML ? `<div class="location-badges" style="margin-top: 4px;">${obstaclesHTML}</div>` : ''}
                    </div>
                    <div class="location-actions">
                        <button class="btn btn-ghost btn-tiny" data-add-obstacle="${loc.id}" title="Adicionar Obstáculo">⚠</button>
                        <button class="btn btn-ghost btn-tiny" data-edit-location="${loc.id}" title="Editar">✎</button>
                        <button class="btn btn-ghost btn-tiny" data-remove-location="${loc.id}" title="Remover">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        this._bindLocationEvents(container);
    }

    _bindLocationEvents(container) {
        // Remover locação
        container.querySelectorAll('[data-remove-location]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locId = e.currentTarget.dataset.removeLocation;
                this.manager.removeLocation(locId);
            });
        });

        // Editar locação
        container.querySelectorAll('[data-edit-location]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locId = e.currentTarget.dataset.editLocation;
                const loc = this.manager.chase.getLocation(locId);
                if (!loc) return;
                this.modal.showLocationForm(loc, (data) => {
                    loc.name = data.name;
                    loc.description = data.description;
                    this.manager._emitUpdate();
                });
            });
        });

        // Adicionar obstáculo
        container.querySelectorAll('[data-add-obstacle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locId = e.currentTarget.dataset.addObstacle;
                const loc = this.manager.chase.getLocation(locId);
                if (!loc) return;
                this.modal.showObstacleForm(loc.name, (obsData) => {
                    this.manager.addObstacleToLocation(locId, obsData);
                });
            });
        });

        // Remover obstáculo
        container.querySelectorAll('[data-remove-obstacle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const obsId = e.currentTarget.dataset.removeObstacle;
                const locId = e.currentTarget.dataset.location;
                this.manager.removeObstacleFromLocation(locId, obsId);
            });
        });
    }

    // ========================
    // RENDERIZAR PERSONAGENS (SETUP)
    // ========================

    renderCharacters() {
        const container = document.getElementById('characters-list');
        const characters = this.manager.chase.characters;

        if (characters.length === 0) {
            container.innerHTML = '<p class="empty-message">Adicione os participantes da perseguição.</p>';
            return;
        }

        container.innerHTML = characters.map(char => `
            <div class="character-item" data-character-id="${char.id}">
                <div class="character-icon ${char.role}">${char.getRoleIcon()}</div>
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    <div class="character-stats">
                        DEX ${char.dex} | CON ${char.con} | MOV ${char.mov} | Loc. ${char.locationIndex + 1} | ${char.getRoleLabel()}
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn btn-ghost btn-tiny" data-edit-character="${char.id}" title="Editar">✎</button>
                    <button class="btn btn-ghost btn-tiny" data-remove-character="${char.id}" title="Remover">✕</button>
                </div>
            </div>
        `).join('');

        this._bindCharacterEvents(container);
    }

    _bindCharacterEvents(container) {
        // Remover personagem
        container.querySelectorAll('[data-remove-character]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charId = e.currentTarget.dataset.removeCharacter;
                this.manager.removeCharacter(charId);
            });
        });

        // Editar personagem
        container.querySelectorAll('[data-edit-character]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charId = e.currentTarget.dataset.editCharacter;
                const char = this.manager.chase.getCharacter(charId);
                if (!char) return;
                this.modal.showCharacterForm(
                    char,
                    this.manager.chase.locations.length,
                    (data) => {
                        this.manager.updateCharacter(charId, data);
                    }
                );
            });
        });
    }

    // ========================
    // VALIDAÇÃO DO SETUP
    // ========================

    updateValidation() {
        const btn = document.getElementById('btn-start-chase');
        const msg = document.getElementById('setup-validation');
        const validation = this.manager.chase.canStart();

        btn.disabled = !validation.valid;
        msg.textContent = validation.errors.join(' ');
    }
}
