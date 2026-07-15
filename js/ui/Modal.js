/**
 * Modal - Controla a exibição de modais da aplicação.
 */
class Modal {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.container = document.getElementById('modal-container');
        this.titleEl = document.getElementById('modal-title');
        this.bodyEl = document.getElementById('modal-body');
        this.footerEl = document.getElementById('modal-footer');
        this.closeBtn = document.getElementById('modal-close');

        this._setupEvents();
    }

    _setupEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    /**
     * Abre o modal
     * @param {Object} config
     * @param {string} config.title
     * @param {string} config.bodyHTML
     * @param {Array<{label: string, className: string, onClick: Function}>} config.buttons
     * @param {Function} [config.onOpen]
     */
    open({ title = '', bodyHTML = '', buttons = [], onOpen = null } = {}) {
        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = bodyHTML;

        // Botões
        this.footerEl.innerHTML = '';
        buttons.forEach(btn => {
            const el = document.createElement('button');
            el.textContent = btn.label;
            el.className = `btn ${btn.className || ''}`;
            el.addEventListener('click', () => {
                if (typeof btn.onClick === 'function') {
                    btn.onClick();
                }
            });
            this.footerEl.appendChild(el);
        });

        this.overlay.classList.remove('hidden');

        if (typeof onOpen === 'function') {
            // Pequeno delay para garantir que o DOM foi atualizado
            requestAnimationFrame(() => onOpen());
        }
    }

    close() {
        this.overlay.classList.add('hidden');
    }

    // ==========================================
    // MODAIS PRÉ-DEFINIDOS
    // ==========================================

    /**
     * Modal para adicionar/editar locação
     */
    showLocationForm(existingLocation = null, onSave) {
        const isEdit = existingLocation !== null;
        this.open({
            title: isEdit ? 'Editar Locação' : 'Nova Locação',
            bodyHTML: `
                <div class="input-group">
                    <label>Nome da Locação</label>
                    <input type="text" id="loc-name" class="input-field"
                        placeholder="Ex: Beco Escuro, Rua Principal..."
                        value="${isEdit ? existingLocation.name : ''}" />
                </div>
                <div class="input-group">
                    <label>Descrição (opcional)</label>
                    <input type="text" id="loc-desc" class="input-field"
                        placeholder="Breve descrição do local"
                        value="${isEdit ? existingLocation.description : ''}" />
                </div>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: isEdit ? 'Salvar' : 'Adicionar',
                    className: 'btn-primary',
                    onClick: () => {
                        const name = document.getElementById('loc-name').value.trim();
                        const desc = document.getElementById('loc-desc').value.trim();
                        if (name) {
                            onSave({ name, description: desc });
                            this.close();
                        }
                    }
                }
            ],
            onOpen: () => {
                const input = document.getElementById('loc-name');
                if (input) input.focus();
            }
        });
    }

    /**
     * Modal para adicionar obstáculo a uma locação
     */
    showObstacleForm(locationName, onSave) {
        this.open({
            title: `Obstáculo em "${locationName}"`,
            bodyHTML: `
                <div class="input-group">
                    <label>Nome do Obstáculo</label>
                    <input type="text" id="obs-name" class="input-field"
                        placeholder="Ex: Muro Alto, Rua Congestionada..." />
                </div>
                <div class="input-group">
                    <label>Tipo</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="obs-type" value="hazard" checked />
                            Risco
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="obs-type" value="barrier" />
                            Barreira
                        </label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Perícia Sugerida</label>
                        <input type="text" id="obs-skill" class="input-field"
                            placeholder="Ex: Saltar, Escalar..." value="Destreza" />
                    </div>
                    <div class="input-group">
                        <label>Dificuldade</label>
                        <input type="number" id="obs-diff" class="input-field"
                            min="1" max="99" value="50" />
                    </div>
                </div>
                <div class="input-group">
                    <label>Descrição (opcional)</label>
                    <input type="text" id="obs-description" class="input-field"
                        placeholder="Detalhes narrativos..." />
                </div>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: 'Adicionar',
                    className: 'btn-primary',
                    onClick: () => {
                        const name = document.getElementById('obs-name').value.trim();
                        const type = document.querySelector('input[name="obs-type"]:checked').value;
                        const skill = document.getElementById('obs-skill').value.trim() || 'Destreza';
                        const difficulty = parseInt(document.getElementById('obs-diff').value) || 50;
                        const description = document.getElementById('obs-description').value.trim();

                        if (name) {
                            onSave({ name, type, skill, difficulty, description });
                            this.close();
                        }
                    }
                }
            ],
            onOpen: () => {
                const input = document.getElementById('obs-name');
                if (input) input.focus();
            }
        });
    }

    /**
     * Modal para adicionar/editar personagem
     */
    showCharacterForm(existingChar = null, totalLocations = 0, onSave) {
        const isEdit = existingChar !== null;
        const char = existingChar || {};

        // Gerar opções de locação
        let locOptions = '';
        for (let i = 0; i < Math.max(totalLocations, 1); i++) {
            const selected = (char.locationIndex === i) ? 'selected' : '';
            locOptions += `<option value="${i}" ${selected}>Locação ${i + 1}</option>`;
        }

        this.open({
            title: isEdit ? 'Editar Participante' : 'Novo Participante',
            bodyHTML: `
                <div class="input-group">
                    <label>Nome</label>
                    <input type="text" id="char-name" class="input-field"
                        placeholder="Nome do personagem"
                        value="${char.name || ''}" />
                </div>
                <div class="input-group">
                    <label>Papel</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="char-role" value="pursuer"
                                ${(!char.role || char.role === 'pursuer') ? 'checked' : ''} />
                            🔴 Perseguidor
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="char-role" value="fugitive"
                                ${char.role === 'fugitive' ? 'checked' : ''} />
                            🔵 Fugitivo
                        </label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>DEX (Destreza)</label>
                        <input type="number" id="char-dex" class="input-field"
                            min="1" max="99" value="${char.dex || 50}" />
                    </div>
                    <div class="input-group">
                        <label>CON (Constituição)</label>
                        <input type="number" id="char-con" class="input-field"
                            min="1" max="99" value="${char.con || 50}" />
                    </div>
                    <div class="input-group">
                        <label>MOV</label>
                        <input type="number" id="char-mov" class="input-field"
                            min="1" max="20" value="${char.mov || 8}" />
                    </div>
                </div>
                <div class="input-group">
                    <label>Posição Inicial</label>
                    <select id="char-location" class="input-field">
                        ${locOptions}
                    </select>
                </div>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: isEdit ? 'Salvar' : 'Adicionar',
                    className: 'btn-primary',
                    onClick: () => {
                        const name = document.getElementById('char-name').value.trim();
                        const role = document.querySelector('input[name="char-role"]:checked').value;
                        const dex = parseInt(document.getElementById('char-dex').value) || 50;
                        const con = parseInt(document.getElementById('char-con').value) || 50;
                        const mov = parseInt(document.getElementById('char-mov').value) || 8;
                        const locationIndex = parseInt(document.getElementById('char-location').value) || 0;

                        if (name) {
                            onSave({ name, role, dex, con, mov, locationIndex });
                            this.close();
                        }
                    }
                }
            ],
            onOpen: () => {
                const input = document.getElementById('char-name');
                if (input) input.focus();
            }
        });
    }

    /**
     * Modal de confirmação
     */
    showConfirm(title, message, onConfirm) {
        this.open({
            title,
            bodyHTML: `<p style="color: var(--color-text-secondary);">${message}</p>`,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: 'Confirmar',
                    className: 'btn-danger',
                    onClick: () => {
                        this.close();
                        onConfirm();
                    }
                }
            ]
        });
    }

    /**
     * Modal de rolagem de dados
     */
    showDiceResult(title, roll, target, resultText, resultClass = '') {
        let outcomeClass = '';
        if (roll === 1) outcomeClass = 'critical-success';
        else if (roll === 100) outcomeClass = 'critical-failure';
        else if (roll <= target) outcomeClass = 'success';
        else outcomeClass = 'failure';

        this.open({
            title,
            bodyHTML: `
                <div class="dice-result">
                    <div class="dice-value ${outcomeClass}">${roll}</div>
                    <div class="dice-target">Alvo: ${target}</div>
                    <div class="dice-outcome ${resultClass}">${resultText}</div>
                </div>
            `,
            buttons: [
                { label: 'OK', className: 'btn-primary', onClick: () => this.close() }
            ]
        });
    }

    /**
     * Modal de teste de obstáculo
     */
    showObstacleChallenge(obstacle, onRoll) {
        this.open({
            title: `${obstacle.getTypeLabel()}: ${obstacle.name}`,
            bodyHTML: `
                <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">
                    ${obstacle.description || 'Supere este obstáculo para continuar.'}
                </p>
                <div class="input-row">
                    <div class="input-group">
                        <label>Perícia: ${obstacle.skill}</label>
                        <input type="number" id="obstacle-skill-value" class="input-field"
                            min="1" max="99" value="${obstacle.difficulty}"
                            placeholder="Valor da perícia do personagem" />
                    </div>
                </div>
                <p style="font-size: var(--text-xs); color: var(--color-text-muted);">
                    Insira o valor da perícia do personagem para o teste.
                </p>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: 'Rolar',
                    className: 'btn-accent',
                    onClick: () => {
                        const skillValue = parseInt(document.getElementById('obstacle-skill-value').value) || 50;
                        this.close();
                        onRoll(skillValue);
                    }
                }
            ]
        });
    }

    /**
     * Modal para criar obstáculo durante a perseguição
     */
    showCreateObstacleForm(locationName, onSave) {
        this.showObstacleForm(locationName, onSave);
    }

    /**
     * Modal para ação personalizada
     */
    showCustomAction(charName, onConfirm) {
        this.open({
            title: `Ação de ${charName}`,
            bodyHTML: `
                <div class="input-group">
                    <label>Descreva a ação</label>
                    <input type="text" id="custom-action-desc" class="input-field"
                        placeholder="Ex: Saca a arma, abre a porta, lança feitiço..." />
                </div>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: 'Confirmar',
                    className: 'btn-primary',
                    onClick: () => {
                        const desc = document.getElementById('custom-action-desc').value.trim();
                        if (desc) {
                            this.close();
                            onConfirm(desc);
                        }
                    }
                }
            ],
            onOpen: () => {
                const input = document.getElementById('custom-action-desc');
                if (input) input.focus();
            }
        });
    }

    /**
     * Modal para esconder-se
     */
    showHideAction(charName, onRoll) {
        this.open({
            title: `${charName} tenta se esconder`,
            bodyHTML: `
                <div class="input-group">
                    <label>Furtividade</label>
                    <input type="number" id="hide-skill-value" class="input-field"
                        min="1" max="99" value="50"
                        placeholder="Valor de Furtividade" />
                </div>
            `,
            buttons: [
                { label: 'Cancelar', className: 'btn-ghost', onClick: () => this.close() },
                {
                    label: 'Rolar',
                    className: 'btn-accent',
                    onClick: () => {
                        const skillValue = parseInt(document.getElementById('hide-skill-value').value) || 50;
                        this.close();
                        onRoll(skillValue);
                    }
                }
            ]
        });
    }

    /**
     * Modal de regras
     */
    showRules() {
        this.open({
            title: 'Regras de Perseguição',
            bodyHTML: `
                <div class="rules-content">
                    <h4>Turno de Perseguição</h4>
                    <p>Cada personagem pode realizar <strong>um deslocamento</strong> (1 locação) e <strong>uma ação</strong> por turno. Alternativamente, pode declarar uma <strong>Corrida</strong> para tentar se mover 2 locações, sacrificando a ação.</p>

                    <h4>Corrida</h4>
                    <p>Requer um teste de <strong>CON</strong>.</p>
                    <ul>
                        <li><strong>Sucesso:</strong> move 2 locações.</li>
                        <li><strong>Falha:</strong> move apenas 1.</li>
                        <li><strong>Fracasso Crítico (100):</strong> fica parado.</li>
                    </ul>

                    <h4>Influência do MOV</h4>
                    <ul>
                        <li><strong>Diferença de 1-2:</strong> dado bônus em testes de deslocamento.</li>
                        <li><strong>Diferença de 3+:</strong> Corrida automática (sem teste de CON).</li>
                    </ul>

                    <h4>Riscos</h4>
                    <p>Obstáculos que atrasam ou causam consequências, sem bloquear passagem. Falha = perde a ação ou sofre consequência narrativa.</p>

                    <h4>Barreiras</h4>
                    <p>Impedem completamente o avanço até serem superadas com perícia, força ou criatividade.</p>

                    <h4>Ordem dos Turnos</h4>
                    <p>Determinada pela <strong>DEX</strong> (maior primeiro), como em combate.</p>

                    <h4>Encerramento</h4>
                    <p>A perseguição termina quando o perseguidor alcança o alvo, o fugitivo escapa, ou as circunstâncias tornam impossível a continuidade.</p>
                </div>
            `,
            buttons: [
                { label: 'Fechar', className: 'btn-primary', onClick: () => this.close() }
            ]
        });
    }
}
