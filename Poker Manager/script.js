document.addEventListener('DOMContentLoaded', function() {

    // Funzione di utilità per riprodurre suoni
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    // --- GESTIONE INDEX.HTML ---
    if (document.getElementById('create-tournament')) {
        const createTournamentBtn = document.getElementById('create-tournament');
        const tournamentForm = document.getElementById('tournament-form');
        const rebuyCheckbox = document.getElementById('rebuy');
        const rebuyDetails = document.getElementById('rebuy-details');
        const addonCheckbox = document.getElementById('addon'); // Aggiunto
        const addonDetails = document.getElementById('addon-details'); // Aggiunto
        const tournamentConfigForm = document.getElementById('tournament-config');


        createTournamentBtn.addEventListener('click', function() {
            tournamentForm.classList.toggle('hidden');
        });

        // Mostra/nascondi i dettagli del rebuy

        rebuyCheckbox.addEventListener('change', function() {
            rebuyDetails.classList.toggle('hidden', !this.checked);
        });

        // Mostra/nascondi i dettagli dell'add-on
        addonCheckbox.addEventListener('change', function() { // Aggiunto
            addonDetails.classList.toggle('hidden', !this.checked);
        });


        tournamentConfigForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const tournamentData = {
                name: document.getElementById('tournament-name').value,
                buyIn: parseFloat(document.getElementById('buy-in').value),
                initialPlayers: parseInt(document.getElementById('initial-players').value),
                initialStack: parseInt(document.getElementById('initial-stack').value),
                rebuy: {
                    enabled: rebuyCheckbox.checked,
                    amount: rebuyCheckbox.checked ? parseFloat(document.getElementById('rebuy-amount').value) : 0,
                    chips: rebuyCheckbox.checked ? parseInt(document.getElementById('rebuy-chips').value) : 0
                },
                addon: {
                    enabled: addonCheckbox.checked, // Aggiunto
                    amount: addonCheckbox.checked ? parseFloat(document.getElementById('addon-amount').value) : 0, // Aggiunto
                    chips: addonCheckbox.checked ? parseInt(document.getElementById('addon-chips').value) : 0 // Aggiunto
                }
            };

            localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
            window.location.href = 'levels.html';
        });
    }

// --- GESTIONE LEVELS.HTML ---
    if (document.getElementById('levels-table')) {
        const levelsTable = document.getElementById('levels-table');
        const addLevelButton = document.getElementById('add-level');
        const saveLevelsButton = document.getElementById('save-levels');
        const levelsErrorMessage = document.getElementById('levels-error-message'); // Aggiunto

        // Carica i livelli salvati all'avvio, o quelli predefiniti se non ce ne sono
        loadLevels();


        addLevelButton.addEventListener('click', function() {
            const tbody = levelsTable.querySelector('tbody');
            const newRow = tbody.insertRow();
            newRow.innerHTML = `
                <td>${tbody.rows.length + 1}</td>
                <td><input type="number" value=""></td>
                <td><input type="number" value=""></td>
                <td><input type="number" value=""></td>
                <td><input type="number" value=""></td>
                <td><input type="number" value=""></td>
                <td><button class="delete-level">Elimina</button></td>
            `;
             // Resetta i messaggi di errore quando si aggiunge un nuovo livello
            levelsErrorMessage.textContent = '';
            validateLevels(); // Aggiorna lo stato del pulsante "Salva"
        });

        // Gestione eliminazione livelli (usando delegation)
        levelsTable.addEventListener('click', function(event) {
            if (event.target.classList.contains('delete-level')) {
                const row = event.target.closest('tr');
                row.remove();

                // Ri-numera i livelli e aggiorna localStorage
                const tbody = levelsTable.querySelector('tbody');
                const levels = [];
                for (let i = 0; i < tbody.rows.length; i++) {
                    tbody.rows[i].cells[0].textContent = i + 1;
                    const row = tbody.rows[i];
                    levels.push({
                       smallBlind: parseInt(row.cells[1].querySelector('input').value) || 0,
                        bigBlind: parseInt(row.cells[2].querySelector('input').value) || 0,
                        ante: parseInt(row.cells[3].querySelector('input').value) || 0,
                        duration: parseInt(row.cells[4].querySelector('input').value) || 0,
                        pause: parseInt(row.cells[5].querySelector('input').value) || 0,
                    });
                }
                localStorage.setItem('levels', JSON.stringify(levels));
                validateLevels()
            }
        });

         // Aggiungi un event listener per la validazione in tempo reale
        levelsTable.addEventListener('input', function(event) {
            if (event.target.tagName === 'INPUT' && event.target.type === 'number') {
                validateLevels();
            }
        });

        saveLevelsButton.addEventListener('click', function() {
           if (validateLevels()) { // Solo se la validazione ha successo
                const tbody = levelsTable.querySelector('tbody');
                const levels = [];

                for (let i = 0; i < tbody.rows.length; i++) {
                    const row = tbody.rows[i];
                    levels.push({
                        smallBlind: parseInt(row.cells[1].querySelector('input').value) || 0,
                        bigBlind: parseInt(row.cells[2].querySelector('input').value) || 0,
                        ante: parseInt(row.cells[3].querySelector('input').value) || 0,
                        duration: parseInt(row.cells[4].querySelector('input').value) || 0,
                        pause: parseInt(row.cells[5].querySelector('input').value) || 0,
                    });
                }

                localStorage.setItem('levels', JSON.stringify(levels));
                alert('Livelli salvati con successo!');
                window.location.href = 'rebuyaddon.html';
            }
        });
    }

    // --- GESTIONE REBUYADDON.HTML ---
    if (document.getElementById('players-table')) {
        const playersTable = document.getElementById('players-table');
        const addPlayerButton = document.getElementById('add-player');
        const playerForm = document.getElementById('player-form');
        const playerConfigForm = document.getElementById('player-config');
        const startTournamentBtn = document.getElementById('start-tournament-btn');
        const editPlayerModal = document.getElementById('edit-player-modal'); // Aggiunto
        const editPlayerForm = document.getElementById('edit-player-form');   // Aggiunto
        const closeButton = document.querySelector('.close-button'); // Aggiunto
        const playerErrorMessage = document.getElementById('player-error-message');
        const editPlayerErrorMessage = document.getElementById('edit-player-error-message');

        let currentPlayerIndex = null; // Tiene traccia del giocatore da modificare


        loadPlayers(); // Carica i giocatori all'avvio


        addPlayerButton.addEventListener('click', function() {
            playerForm.classList.toggle('hidden');
            playerErrorMessage.textContent = ''; // Resetta i messaggi di errore
        });

        playerConfigForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const playerName = document.getElementById('player-name').value.trim();
            const playerStack = parseInt(document.getElementById('player-stack').value);
            const rebuyPlayer = document.getElementById('rebuy-player').checked;
            const addonPlayer = document.getElementById('addon-player').checked;

            // Validazione (lato client)
            if (!playerName) {
                playerErrorMessage.textContent = 'Inserisci il nome del giocatore.';
                return; // Interrompi l'esecuzione se il nome è vuoto
            }
            playerErrorMessage.textContent = ''; // Resetta il messaggio di errore


            const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
            const buyIn = tournamentData.buyIn;
            const rebuyAmount = rebuyPlayer ? tournamentData.rebuy.amount : 0;
            const addonAmount = addonPlayer ? tournamentData.addon.amount : 0; // Usa l'importo dell'add-on da tournamentData
            const totalSpent = buyIn + rebuyAmount + addonAmount;

            const player = {
                name: playerName,
                stack: playerStack,
                rebuy: rebuyPlayer,
                addon: addonPlayer,
                totalSpent: totalSpent,
                rebuyCount: rebuyPlayer ? 1 : 0,
                addonCount: addonPlayer ? 1 : 0
            };

            const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
            savedPlayers.push(player);
            localStorage.setItem('players', JSON.stringify(savedPlayers));

            loadPlayers();
            alert('Giocatore aggiunto con successo!');
            playerForm.classList.add('hidden');
            playerConfigForm.reset();

            startTournamentBtn.classList.remove('hidden');
        });

         // --- MODIFICA GIOCATORE ---
        // Apertura modale
         playersTable.addEventListener('click', function(event) {
            if (event.target.classList.contains('edit-btn')) {
                const playerName = event.target.closest('tr').cells[0].textContent;
                currentPlayerIndex = getPlayerIndexByName(playerName); // Salva l'indice
                if (currentPlayerIndex !== null) {
                   const player = getPlayerByIndex(currentPlayerIndex);
                    if (player) {
                        // Popola il form modale con i dati del giocatore
                        document.getElementById('edit-player-name').value = player.name;
                        document.getElementById('edit-player-stack').value = player.stack;
                        document.getElementById('edit-rebuy-player').checked = player.rebuyCount > 0;
                        document.getElementById('edit-addon-player').checked = player.addonCount > 0;

                        editPlayerModal.classList.remove('hidden'); // Mostra la modale
                    }
                }
            }
        });

        // Chiusura modale
        closeButton.addEventListener('click', function() {
            editPlayerModal.classList.add('hidden');
            editPlayerErrorMessage.textContent = ''; //Resetta errore
        });

        //Salvataggio modifiche giocatore
        editPlayerForm.addEventListener('submit', function(e) {
            e.preventDefault();
             const playerName = document.getElementById('edit-player-name').value.trim(); //trim per evitare spazi vuoti
            if (!playerName) { //Validazione
                editPlayerErrorMessage.textContent = 'Il nome non può essere vuoto.';
                return;
            }
              editPlayerErrorMessage.textContent = '';
            const updatedPlayer = {
                name: playerName,
                stack: parseInt(document.getElementById('edit-player-stack').value) || 0,
                rebuyCount: document.getElementById('edit-rebuy-player').checked ? 1 : 0, // Considera solo 1 o 0 per rebuy/addon iniziali
                addonCount: document.getElementById('edit-addon-player').checked ? 1 : 0,
            };

             // Ricalcola totalSpent
            const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
            updatedPlayer.totalSpent = tournamentData.buyIn +
                (updatedPlayer.rebuyCount > 0 ? tournamentData.rebuy.amount : 0) +
                (updatedPlayer.addonCount > 0 ? tournamentData.addon.amount : 0);

            updatePlayer(currentPlayerIndex, updatedPlayer); // Aggiorna il giocatore
            editPlayerModal.classList.add('hidden'); // Chiudi la modale
            editPlayerForm.reset();
            loadPlayers(); // Ricarica la tabella
            alert('Giocatore modificato con successo!');
        });

        // Event delegation per i pulsanti rebuy, add-on e elimina
        playersTable.addEventListener('click', function(event) {
            const playerName = event.target.closest('tr').cells[0].textContent;
            if (event.target.classList.contains('rebuy-btn')) {
                addRebuy(playerName);
            } else if (event.target.classList.contains('addon-btn')) {
                addAddon(playerName);
            } else if (event.target.classList.contains('delete-btn')) { // Aggiunto
                 if (confirm(`Sei sicuro di voler eliminare ${playerName}?`)) {
                    deletePlayer(playerName);
                }
            }
        });

        startTournamentBtn.addEventListener('click', function() {
            window.location.href = 'tournament.html';
        });
    }

     // --- GESTIONE TOURNAMENT.HTML (Timer) ---

    let isPaused = false;
    let pauseTimeRemaining = 0;

     if (document.getElementById('tournament-name')) {
        const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
        const levels = JSON.parse(localStorage.getItem('levels'));
        const players = JSON.parse(localStorage.getItem('players'));
        const prevLevelBtn = document.getElementById('prev-level-btn');
        const pauseResumeBtn = document.getElementById('pause-resume-btn');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const savePayoutBtn = document.getElementById('save-payout-btn'); // Aggiunto
        const payoutConfigMessage = document.getElementById('payout-config-message');

        if (tournamentData && levels?.length && players?.length) {
            startTournament();
        } else {
            const container = document.querySelector('.container');
            const message = document.createElement('p');
            message.textContent = 'Nessun torneo configurato. Torna alla home per crearne uno.';
            container.appendChild(message);
        }

        function loadBackground() {
            const savedBackground = localStorage.getItem('tournamentBackground');
            if (savedBackground) {
                document.body.style.backgroundImage = `url(${savedBackground})`;
            }
        }

        loadBackground();

        const backgroundUpload = document.getElementById('background-upload');
            if (backgroundUpload) {
                backgroundUpload.addEventListener('change', function(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            document.body.style.backgroundImage = `url(${e.target.result})`;
                            localStorage.setItem('tournamentBackground', e.target.result);
                        }
                        reader.readAsDataURL(file);
                    }
                });
            }

            function updatePauseResumeIcon() {
                const icon = pauseResumeBtn.querySelector('span');
                icon.innerHTML = isPaused ? '&#9199;' : '&#9208;';
            }

            if (prevLevelBtn) {
                prevLevelBtn.addEventListener('click', goToPreviousLevel);
                pauseResumeBtn.addEventListener('click', togglePauseResume);
                nextLevelBtn.addEventListener('click', goToNextLevel);
            }

            function goToPreviousLevel() {
                if (currentLevelIndex > 0) {
                    playSound('level-change-sound');
                    clearInterval(timerInterval);
                    currentLevelIndex--;
                    timeRemaining = levels[currentLevelIndex].duration * 60;
                    updateLevelInfo();
                    calculateNextBreak();
                    updateNextBreakDisplay();
                    timerInterval = setInterval(updateTimer, 1000);
                }
            }

        function togglePauseResume() {
                isPaused = !isPaused;
                updatePauseResumeIcon();

                if (isPaused) {
                    clearInterval(timerInterval);
                    pauseTimeRemaining = timeRemaining;
                } else {
                    timeRemaining = pauseTimeRemaining;
                    timerInterval = setInterval(updateTimer, 1000);
                }
            }

            function goToNextLevel() {
                playSound('level-change-sound');
                clearInterval(timerInterval);
                currentLevelIndex++;
                if (currentLevelIndex < levels.length) {
                    timeRemaining = levels[currentLevelIndex].duration * 60;
                    updateLevelInfo();
                    calculateNextBreak();
                    updateNextBreakDisplay();
                    timerInterval = setInterval(updateTimer, 1000);
                } else {
                    alert('Torneo concluso!');
                }
            }
    // --- GESTIONE PAYOUT ---
        // Mostra la sezione di configurazione del payout all'avvio
        const payoutConfigSection = document.getElementById('payout-config');
            if (payoutConfigSection) {
            payoutConfigSection.classList.remove('hidden');
        }
        //Carica percentuali salvate
        loadPayoutPercentages();

        // Aggiungi event listener al pulsante "Salva Payout"
        if(savePayoutBtn){
            savePayoutBtn.addEventListener('click', savePayoutPercentages);
        }
    }

    // --- FUNZIONI DI SUPPORTO ---

     function loadPlayers() {
        const playersTable = document.getElementById('players-table');
        if (!playersTable) return;

        const tbody = playersTable.querySelector('tbody');
        tbody.innerHTML = ''; // Svuota la tabella

        const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
        const startTournamentBtn = document.getElementById('start-tournament-btn'); // Per la visibilità del pulsante

        if (savedPlayers.length > 0) {
            startTournamentBtn.classList.remove('hidden');
        } else {
            startTournamentBtn.classList.add('hidden');
        }

        savedPlayers.forEach((player, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><span class="math-inline">\{player\.name\}</td\>
<td\></span>{player.stack.toLocaleString('it-IT')}</td>
                <td><span class="math-inline">\{player\.rebuyCount\}</td\>
<td\></span>{player.addonCount}</td>
                <td>${player.totalSpent.toLocaleString('it-IT')} €</td>
                <td>
                    <button class="rebuy-btn">Rebuy</button>
                    <button class="addon-btn">Add-on</button>
                    <<button class="edit-btn">Modifica</button>
                    <button class="delete-btn">Elimina</button>
                </td>
            `;
        });
    }

    function addRebuy(playerName) {
        const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
        const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));

        if (!tournamentData) {
            alert("Errore: dati del torneo non trovati. Configura il torneo dalla home page."); // Messaggio di errore
            return;
        }

        const updatedPlayers = savedPlayers.map(player => {
            if (player.name === playerName) {
                return {
                    ...player,
                    rebuyCount: player.rebuyCount + 1,
                    totalSpent: player.totalSpent + (tournamentData.rebuy?.amount || 0), // Usa 0 se rebuy non è definito
                    stack: player.stack + (tournamentData.rebuy?.chips || 0)
                };
            }
            return player;
        });

        localStorage.setItem('players', JSON.stringify(updatedPlayers));
        loadPlayers();
    }

  function addAddon(playerName) {
    const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
    const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));

     if (!tournamentData) {
            alert("Errore: dati del torneo non trovati. Configura il torneo dalla home page."); // Messaggio di errore
            return;
        }

    const updatedPlayers = savedPlayers.map(player => {
        if (player.name === playerName) {
            // Usa i valori di tournamentData.addon, o 0 se non definiti
            const addonAmount = tournamentData.addon?.amount || 0;
            const addonChips = tournamentData.addon?.chips || 10000; // Valore predefinito

            return {
                ...player,
                addonCount: player.addonCount + 1,
                totalSpent: player.totalSpent + addonAmount,
                stack: player.stack + addonChips
            };
        }
        return player;
    });

    localStorage.setItem('players', JSON.stringify(updatedPlayers));
    loadPlayers();
}


    // Aggiunte funzioni per MODIFICA e ELIMINAZIONE giocatori
    function updatePlayer(index, updatedPlayer) {
        const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
        if (index >= 0 && index < savedPlayers.length) {
            savedPlayers[index] = { ...savedPlayers[index], ...updatedPlayer }; // Sovrascrive i dati
            localStorage.setItem('players', JSON.stringify(savedPlayers));
        }
    }


    function deletePlayer(playerName) {
        let savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
        savedPlayers = savedPlayers.filter(player => player.name !== playerName);
        localStorage.setItem('players', JSON.stringify(savedPlayers));
        loadPlayers();
    }

     function getPlayerIndexByName(playerName) {
        const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
        for (let i = 0; i < savedPlayers.length; i++) {
            if (savedPlayers[i].name === playerName) {
                return i;
            }
        }
        return null; // Giocatore non trovato
    }

    function getPlayerByIndex(index) {
         const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
            if (index >= 0 && index < savedPlayers.length) {
                return savedPlayers[index];
            }
            return null; //Indice non valido
    }

   function loadLevels() {
        const levelsTable = document.getElementById('levels-table');
        if (!levelsTable) return;

        const tbody = levelsTable.querySelector('tbody');
        tbody.innerHTML = ''; // Svuota la tabella

        let savedLevels = JSON.parse(localStorage.getItem('levels'));

        // Se non ci sono livelli salvati, usa quelli predefiniti
        if (!savedLevels || savedLevels.length === 0) {
            savedLevels = [
                { smallBlind: 100, bigBlind: 100, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 100, bigBlind: 200, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 200, bigBlind: 400, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 300, bigBlind: 600, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 500, bigBlind: 1000, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 600, bigBlind: 1200, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 800, bigBlind: 1600, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 1000, bigBlind: 2000, ante: 0, duration: 18, pause: 0 },
                { smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 15, pause: 5 },
                { smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 15, pause: 5 },
                { smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 15, pause: 5 },
                { smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 15, pause: 5 },
                { smallBlind: 7000, bigBlind: 14000, ante: 14000, duration: 15, pause: 5 },
                { smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 15, pause: 5 },
                { smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 15, pause: 5 },
                { smallBlind: 25000, bigBlind: 50000, ante: 50000, duration: 15, pause: 5 }
            ];
        }
           // Salva i livelli predefiniti *solo se non ce ne sono già di salvati*
            if (!localStorage.getItem('levels')) {
                localStorage.setItem('levels', JSON.stringify(savedLevels));
            }

        savedLevels.forEach((level, index) => {
            const row = tbody.insertRow();

            // Costruisci la riga HTML *correttamente*, usando i valori delle variabili:
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="number" value="${level.smallBlind}"></td>
                <td><input type="number" value="${level.bigBlind}"></td>
                <td><input type="number" value="${level.ante}"></td>
                <td><input type="number" value="${level.duration}"></td>
                <td><input type="number" value="${level.pause}"></td>
                <td><button class="delete-level">Elimina</button></td>
            `;
        });
         validateLevels(); // Chiamata per controllare lo stato iniziale del pulsante
    }

    // VALIDAZIONE (levels.html)
    function validateLevels() {
        const levelsTable = document.getElementById('levels-table');
        const saveLevelsButton = document.getElementById('save-levels');
        const levelsErrorMessage = document.getElementById('levels-error-message'); // Aggiunto
        let isValid = true; // Inizializza come valido

        if (!levelsTable) return true;

        const tbody = levelsTable.querySelector('tbody');
        for (let i = 0; i < tbody.rows.length; i++) {
            const row = tbody.rows[i];
            const inputs = row.querySelectorAll('input[type="number"]');

            for (const input of inputs) {
                const value = parseInt(input.value);
                 // Controlla se il valore è un numero intero positivo
                if (isNaN(value) || value < 0 || !Number.isInteger(value)) {
                    isValid = false; // Imposta isValid a false se trovi un errore
                    input.classList.add('input-error'); // Aggiungi classe per stile errore

                } else {
                    input.classList.remove('input-error'); // Rimuovi la classe di errore
                }
            }
        }
         if (!isValid) {
            levelsErrorMessage.textContent = "Tutti i valori devono essere numeri interi positivi.";
            saveLevelsButton.disabled = true; // Disabilita il pulsante
        } else {
            levelsErrorMessage.textContent = ''; // Cancella il messaggio di errore
            saveLevelsButton.disabled = false; // Abilita il pulsante
        }

        return isValid; // Importante: restituisci il risultato della validazione
    }

    // --- FUNZIONE startTournament ---
   function startTournament() {
        const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
        const levels = JSON.parse(localStorage.getItem('levels'));
        let players = JSON.parse(localStorage.getItem('players')) || [];

       if (!tournamentData || !levels?.length) {
            alert('Configurazione incompleta! Completa tutti i passaggi prima di avviare il torneo.');
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('tournament-name').textContent = tournamentData.name;

        let totalPlayers = players.length;
        document.getElementById('total-players').textContent = totalPlayers;
        document.getElementById('remaining-count').textContent = totalPlayers;

        const initialStack = tournamentData.initialStack;
        let averageStack = (initialStack * totalPlayers) / totalPlayers;
        document.getElementById('average-stack').textContent = averageStack.toLocaleString('it-IT');

        let currentLevelIndex = 0;
        let timerInterval;
        let timeRemaining;

        //Gestione Pause
        let nextBreakTime = 0;
        function calculateNextBreak() {
            nextBreakTime = 0;
            let totalTime = 0;

            for (let i = 0; i < levels.length; i++) { // Cicla *tutti* i livelli
                totalTime += levels[i].duration * 60; // Aggiungi la durata del livello
                if (levels[i].pause > 0) { // Se c'è una pausa in *questo* livello
                    nextBreakTime = totalTime; // Imposta la prossima pausa
                    break; // Esci dal ciclo, abbiamo trovato la prossima
                }
                 if (i > currentLevelIndex) {
                    break;  //Se abbiamo superato il livello corrente, fermati.
                 }
            }
        }


        function updateNextBreakDisplay() {

            let timeUntilNextBreak = nextBreakTime - (levels[currentLevelIndex].duration * 60 - timeRemaining);
            const breakMinutes = Math.floor(timeUntilNextBreak / 60);
            const breakSeconds = timeUntilNextBreak % 60;
            document.getElementById('next-break').textContent = `${String(breakMinutes).padStart(2, '0')}:${String(breakSeconds).padStart(2, '0')}`;
        }

        function updateTimer() {

            // Decrementa timeRemaining *prima* di fare i controlli
            timeRemaining--;

            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            document.getElementById('level-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            updateNextBreakDisplay();

            if (timeRemaining === 60) {
                playSound('pause-alert-sound');  // Avviso pausa imminente
                alert('1 minuto rimanente nel livello!');
            }

            if (timeRemaining <= 0) {
                playSound('level-change-sound'); // Avviso cambio livello
                clearInterval(timerInterval);
                currentLevelIndex++;

                if (currentLevelIndex < levels.length) {
                    timeRemaining = levels[currentLevelIndex].duration * 60;
                    updateLevelInfo();
                    calculateNextBreak();  // Calcola la prossima pausa
                    updateNextBreakDisplay(); // Aggiorna la visualizzazione
                    timerInterval = setInterval(updateTimer, 1000);
                } else {
                    alert('Torneo concluso!');
                    // Qui potresti gestire la fine del torneo
                }
            }
        }

        function updateLevelInfo() {
            const currentLevel = levels[currentLevelIndex];
            const nextLevel = levels[currentLevelIndex + 1] || { smallBlind: '-', bigBlind: '-', ante: '-' };

            document.getElementById('current-small-blind').textContent = currentLevel.smallBlind.toLocaleString('it-IT');
            document.getElementById('current-big-blind').textContent = currentLevel.bigBlind.toLocaleString('it-IT');
            document.getElementById('current-ante').textContent = currentLevel.ante ? currentLevel.ante.toLocaleString('it-IT') : '-';
            document.getElementById('current-duration').textContent = currentLevel.duration;

            document.getElementById('next-small-blind').textContent = nextLevel.smallBlind.toLocaleString('it-IT');
            document.getElementById('next-big-blind').textContent = nextLevel.bigBlind.toLocaleString('it-IT');
            document.getElementById('next-ante').textContent = nextLevel.ante ? nextLevel.ante.toLocaleString('it-IT') : '-';

             //Inizializza timer
             timeRemaining = levels[currentLevelIndex].duration * 60;
             updateTimer(); //Imposta subito il timer a video
        }


        updateLevelInfo(); // Imposta le info del livello iniziale
        calculateNextBreak(); // Calcola quando sarà la prima pausa
        updateNextBreakDisplay();
        timerInterval = setInterval(updateTimer, 1000); // Avvia il timer


        document.getElementById('player-out').addEventListener('click', function() {
            playSound('player-out-sound');
            let remainingCount = parseInt(document.getElementById('remaining-count').textContent);

            if (remainingCount > 1) {
                remainingCount--;
                document.getElementById('remaining-count').textContent = remainingCount;

                // Aggiorna il numero totale dei giocatori
                totalPlayers = remainingCount;

                // Ricalcola e aggiorna l'average stack
                const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
                const levels = JSON.parse(localStorage.getItem('levels'));
                const players = JSON.parse(localStorage.getItem('players')) || [];

                // Somma gli stack attuali dei giocatori rimasti
                let totalRemainingStack = 0;
                for (let i = 0; i < players.length; i++) {
                  if (i < remainingCount) {
                  totalRemainingStack += players[i].stack;
                  }
                }
                // Calcola l'average stack
                const averageStack = totalRemainingStack / remainingCount;
                document.getElementById('average-stack').textContent = averageStack.toLocaleString('it-IT');

                // Aggiorna localStorage
                localStorage.setItem('players', JSON.stringify(players));

            } else {
                alert("Il torneo è terminato, non ci sono giocatori da eliminare");
            }
        });

        // --- PAYOUT ---

        function calculateAndDisplayPayout() {
            const prizePool = tournamentData.buyIn * totalPlayers;
            document.getElementById('total-prize-pool').textContent = prizePool.toLocaleString('it-IT');

            // Carica le percentuali salvate (o usa valori predefiniti)
            const savedPayout = JSON.parse(localStorage.getItem('payoutPercentages')) || {
                first: 50,
                second: 25,
                third: 15,
                fourth: 10
            };

             // Assicurati che le percentuali siano valide, altrimenti usa i valori predefiniti.
            const firstPercent = savedPayout.first;
            const secondPercent = savedPayout.second;
            const thirdPercent = savedPayout.third;
            const fourthPercent = savedPayout.fourth
            //Controlla che la somma sia 100, altrimenti usa i valori predefiniti
            if(firstPercent+secondPercent+thirdPercent+fourthPercent != 100){
                firstPercent =  50;
                secondPercent =  25;
                thirdPercent =  15;
                fourthPercent = 10
            }
            const firstPrize = Math.round(prizePool * (firstPercent / 100) / 10) * 10;
            const secondPrize = Math.round(prizePool * (secondPercent / 100) / 10) * 10;
            const thirdPrize = Math.round(prizePool * (thirdPercent / 100) / 10) * 10;
            const fourthPrize = prizePool - (firstPrize + secondPrize + thirdPrize);

            document.getElementById('first-prize').textContent = firstPrize.toLocaleString('it-IT');
            document.getElementById('second-prize').textContent = secondPrize.toLocaleString('it-IT');
            document.getElementById('third-prize').textContent = thirdPrize.toLocaleString('it-IT');
            document.getElementById('fourth-prize').textContent = fourthPrize.toLocaleString('it-IT');
        }


         function savePayoutPercentages() {
            const first = parseInt(document.getElementById('first-place-percent').value) || 0; //il parseInt gestisce anche il caso di stringa vuota
            const second = parseInt(document.getElementById('second-place-percent').value) || 0;
            const third = parseInt(document.getElementById('third-place-percent').value) || 0;
            const fourth = parseInt(document.getElementById('fourth-place-percent').value) || 0;

            const total = first + second + third + fourth;

            if (total !== 100) {
                payoutConfigMessage.textContent = 'La somma delle percentuali deve essere 100%';
                return;
            }
              payoutConfigMessage.textContent = ''; //Resetta

            const payoutPercentages = { first, second, third, fourth };
            localStorage.setItem('payoutPercentages', JSON.stringify(payoutPercentages));
            calculateAndDisplayPayout(); // Ricalcola e mostra il payout
            alert('Percentuali di payout salvate con successo!');
              // Nascondi la sezione di configurazione dopo il salvataggio
             payoutConfigSection.classList.add('hidden');
        }

        function loadPayoutPercentages() {
            const savedPayout = JSON.parse(localStorage.getItem('payoutPercentages')) || {
                first: 50,
                second: 25,
                third: 15,
                fourth: 10
            };

            document.getElementById('first-place-percent').value = savedPayout.first;
            document.getElementById('second-place-percent').value = savedPayout.second;
            document.getElementById('third-place-percent').value = savedPayout.third;
            document.getElementById('fourth-place-percent').value = savedPayout.fourth;
        }

        calculateAndDisplayPayout(); // Calcola e mostra il payout all'avvio
        payoutConfigSection.classList.add('hidden'); //Nascondi di default

    }

    // --- GESTIONE NAVIGAZIONE (comune a tutte le pagine) ---
    const backToHomeButton = document.getElementById('back-to-home');
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
});