// Funzione per caricare i livelli salvati
function loadLevels() {
    const savedLevels = JSON.parse(localStorage.getItem('levels')) || [];
    const levelsTable = document.getElementById('levels-table').getElementsByTagName('tbody')[0];
    levelsTable.innerHTML = ''; // Pulisce la tabella

    savedLevels.forEach((level, index) => {
        const row = levelsTable.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="number" value="${level.smallBlind}"></td>
            <td><input type="number" value="${level.bigBlind}"></td>
            <td><input type="number" value="${level.ante}"></td>
            <td><input type="number" value="${level.duration}"></td>
            <td><input type="checkbox" ${level.pause ? 'checked' : ''}></td>
            <td><button class="delete-level">Elimina</button></td>
        `;
    });
}

// Funzione per salvare i livelli
function saveLevels() {
    const levelsTable = document.getElementById('levels-table').getElementsByTagName('tbody')[0];
    const levels = [];

    for (let i = 0; i < levelsTable.rows.length; i++) {
        const row = levelsTable.rows[i];
        levels.push({
            smallBlind: parseInt(row.cells[1].querySelector('input').value),
            bigBlind: parseInt(row.cells[2].querySelector('input').value),
            ante: parseInt(row.cells[3].querySelector('input').value),
            duration: parseInt(row.cells[4].querySelector('input').value),
            pause: row.cells[5].querySelector('input').checked
        });
    }

    localStorage.setItem('levels', JSON.stringify(levels));
    alert('Livelli salvati con successo!');
}

// Funzione per caricare i giocatori salvati
function loadPlayers() {
    const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
    const playersTable = document.getElementById('players-table').getElementsByTagName('tbody')[0];
    playersTable.innerHTML = ''; // Pulisce la tabella

    savedPlayers.forEach((player, index) => {
        const row = playersTable.insertRow();
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.stack}</td>
            <td>${player.rebuy ? 'Sì' : 'No'}</td>
            <td>${player.addon ? 'Sì' : 'No'}</td>
            <td>${player.totalSpent} €</td>
        `;
    });
}

// Funzione per aggiungere un giocatore
document.getElementById('player-config').addEventListener('submit', function(event) {
    event.preventDefault();
    const playerName = document.getElementById('player-name').value;
    const playerStack = document.getElementById('player-stack').value;
    const rebuyPlayer = document.getElementById('rebuy-player').checked;
    const addonPlayer = document.getElementById('addon-player').checked;

    // Calcola il totale speso (buy-in + rebuy + add-on)
    const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
    const buyIn = tournamentData.buyIn;
    const rebuyAmount = rebuyPlayer ? tournamentData.rebuy.amount : 0;
    const addonAmount = addonPlayer ? 10 : 0; // Esempio: add-on costa 10€
    const totalSpent = buyIn + rebuyAmount + addonAmount;

    // Salva il giocatore
    const player = {
        name: playerName,
        stack: playerStack,
        rebuy: rebuyPlayer,
        addon: addonPlayer,
        totalSpent: totalSpent
    };
    const savedPlayers = JSON.parse(localStorage.getItem('players')) || [];
    savedPlayers.push(player);
    localStorage.setItem('players', JSON.stringify(savedPlayers));

    // Ricarica la tabella
    loadPlayers();
    alert('Giocatore aggiunto con successo!');
    document.getElementById('player-form').classList.add('hidden');
});

// Funzione per avviare il torneo
function startTournament() {
    const tournamentData = JSON.parse(localStorage.getItem('tournamentData'));
    const levels = JSON.parse(localStorage.getItem('levels'));
    const players = JSON.parse(localStorage.getItem('players'));

    // Imposta il nome del torneo
    document.getElementById('tournament-name').textContent = tournamentData.name;

    // Imposta il numero totale di giocatori
    const totalPlayers = players.length;
    document.getElementById('total-players').textContent = totalPlayers;
    document.getElementById('remaining-count').textContent = totalPlayers;

    // Calcola l'average stack iniziale
    const initialStack = tournamentData.initialStack;
    const averageStack = (initialStack * totalPlayers) / totalPlayers;
    document.getElementById('average-stack').textContent = averageStack.toLocaleString();

    // Inizializza il timer e i livelli
    let currentLevelIndex = 0;
    let timerInterval;
    let timeRemaining = levels[currentLevelIndex].duration * 60; // Durata in secondi

    function updateTimer() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        document.getElementById('level-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeRemaining === 60) {
            playSound('pause-alert-sound');
            alert('1 minuto rimanente nel livello!');
        }

        if (timeRemaining === 0) {
            playSound('level-change-sound');
            clearInterval(timerInterval);
            currentLevelIndex++;
            if (currentLevelIndex < levels.length) {
                timeRemaining = levels[currentLevelIndex].duration * 60;
                updateLevelInfo();
                timerInterval = setInterval(updateTimer, 1000);
            } else {
                alert('Torneo concluso!');
            }
        } else {
            timeRemaining--;
        }
    }

    // Aggiorna le informazioni sul livello attuale e successivo
    function updateLevelInfo() {
        const currentLevel = levels[currentLevelIndex];
        const nextLevel = levels[currentLevelIndex + 1] || { smallBlind: '-', bigBlind: '-', ante: '-' };

        document.getElementById('current-small-blind').textContent = currentLevel.smallBlind;
        document.getElementById('current-big-blind').textContent = currentLevel.bigBlind;
        document.getElementById('current-ante').textContent = currentLevel.ante || '-';
        document.getElementById('current-duration').textContent = currentLevel.duration;

        document.getElementById('next-small-blind').textContent = nextLevel.smallBlind;
        document.getElementById('next-big-blind').textContent = nextLevel.bigBlind;
        document.getElementById('next-ante').textContent = nextLevel.ante || '-';
    }

    // Avvia il timer
    updateLevelInfo();
    timerInterval = setInterval(updateTimer, 1000);

    // Gestione delle eliminazioni
    document.getElementById('player-out').addEventListener('click', function() {
        playSound('player-out-sound');
        const remainingCount = parseInt(document.getElementById('remaining-count').textContent);
        if (remainingCount > 0) {
            document.getElementById('remaining-count').textContent = remainingCount - 1;
            const newAverageStack = (initialStack * totalPlayers) / (remainingCount - 1);
            document.getElementById('average-stack').textContent = newAverageStack.toLocaleString();
        }
    });

    // Calcola il Prize Pool e il Payout
    const prizePool = tournamentData.buyIn * totalPlayers;
    document.getElementById('total-prize-pool').textContent = prizePool.toLocaleString();

    const firstPrize = Math.round(prizePool * 0.50 / 10) * 10;
    const secondPrize = Math.round(prizePool * 0.25 / 10) * 10;
    const thirdPrize = Math.round(prizePool * 0.18 / 10) * 10;
    const fourthPrize = prizePool - (firstPrize + secondPrize + thirdPrize);

    document.getElementById('first-prize').textContent = firstPrize.toLocaleString();
    document.getElementById('second-prize').textContent = secondPrize.toLocaleString();
    document.getElementById('third-prize').textContent = thirdPrize.toLocaleString();
    document.getElementById('fourth-prize').textContent = fourthPrize.toLocaleString();
}

// Riproduci un suono
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    sound.currentTime = 0; // Riavvia il suono
    sound.play();
}

// Torna alla Home
document.getElementById('back-to-home').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Carica i livelli all'avvio
loadLevels();

// Carica i giocatori all'avvio
loadPlayers();

// Avvia il torneo all'apertura della pagina
startTournament();