const soundEngine = new TubeSoundEngine();

const TOTAL_QUESTIONS = 10;
const OPTIONS_PER_QUESTION = 4;

let currentQuestion = 0;
let score = 0;
let questions = [];
let answered = false;
let playing = false;

// DOM elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-btn');
const playBtn = document.getElementById('play-btn');
const playLabel = document.getElementById('play-label');
const optionsContainer = document.getElementById('options');
const feedback = document.getElementById('feedback');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackText = document.getElementById('feedback-text');
const feedbackDetail = document.getElementById('feedback-detail');
const nextBtn = document.getElementById('next-btn');
const questionNum = document.getElementById('question-num');
const scoreDisplay = document.getElementById('score-display');
const progressFill = document.getElementById('progress-fill');
const resultsTitle = document.getElementById('results-title');
const finalScore = document.getElementById('final-score');
const resultsMessage = document.getElementById('results-message');
const resultsBreakdown = document.getElementById('results-breakdown');
const restartBtn = document.getElementById('restart-btn');

function switchScreen(show) {
    [startScreen, quizScreen, resultsScreen].forEach(s => s.classList.remove('active'));
    show.classList.add('active');
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateQuestions() {
    const shuffledLines = shuffle(TUBE_LINES);
    const selectedLines = shuffledLines.slice(0, TOTAL_QUESTIONS);

    return selectedLines.map(correctLine => {
        const wrongOptions = shuffle(
            TUBE_LINES.filter(l => l.id !== correctLine.id)
        ).slice(0, OPTIONS_PER_QUESTION - 1);

        const options = shuffle([correctLine, ...wrongOptions]);

        return {
            correctLine,
            options,
            userAnswer: null,
        };
    });
}

function renderQuestion() {
    const q = questions[currentQuestion];
    answered = false;
    playing = false;

    questionNum.textContent = `Question ${currentQuestion + 1}/${TOTAL_QUESTIONS}`;
    scoreDisplay.textContent = `Score: ${score}`;
    progressFill.style.width = `${((currentQuestion) / TOTAL_QUESTIONS) * 100}%`;

    playBtn.classList.remove('playing');
    playLabel.textContent = 'Play Sound';

    feedback.classList.add('hidden');

    optionsContainer.innerHTML = '';
    q.options.forEach(line => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
            <span class="line-dot" style="background: ${line.color}"></span>
            <span>${line.name}</span>
        `;
        btn.addEventListener('click', () => handleAnswer(line, btn));
        optionsContainer.appendChild(btn);
    });
}

async function playSound() {
    if (playing) return;
    playing = true;
    playBtn.classList.add('playing');
    playLabel.textContent = 'Playing...';

    const q = questions[currentQuestion];
    await soundEngine.play(q.correctLine.id, 4);

    playing = false;
    playBtn.classList.remove('playing');
    playLabel.textContent = 'Play Again';
}

function handleAnswer(selectedLine, btn) {
    if (answered) return;
    answered = true;

    const q = questions[currentQuestion];
    const correct = selectedLine.id === q.correctLine.id;
    q.userAnswer = selectedLine;

    if (correct) score++;

    // Highlight buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => {
        b.disabled = true;
        const lineName = b.querySelector('span:last-child').textContent;
        if (lineName === q.correctLine.name) {
            b.classList.add('correct');
        }
    });

    if (!correct) {
        btn.classList.add('wrong');
    }

    // Show feedback
    feedbackIcon.textContent = correct ? '\u2705' : '\u274C';
    feedbackText.textContent = correct ? 'Correct!' : `It was the ${q.correctLine.name} line`;
    feedbackDetail.textContent = q.correctLine.description;

    scoreDisplay.textContent = `Score: ${score}`;

    const isLast = currentQuestion === TOTAL_QUESTIONS - 1;
    nextBtn.textContent = isLast ? 'See Results' : 'Next Question';

    feedback.classList.remove('hidden');
}

function showResults() {
    switchScreen(resultsScreen);

    finalScore.textContent = score;
    progressFill.style.width = '100%';

    if (score === 10) {
        resultsTitle.textContent = 'Perfect Score!';
        resultsMessage.textContent = 'You really know your tubes! Are you a train driver?';
    } else if (score >= 8) {
        resultsTitle.textContent = 'Excellent!';
        resultsMessage.textContent = 'You clearly spend a lot of time on the Underground.';
    } else if (score >= 6) {
        resultsTitle.textContent = 'Not Bad!';
        resultsMessage.textContent = 'A solid commuter effort. A few more journeys and you\'ll nail it.';
    } else if (score >= 4) {
        resultsTitle.textContent = 'Room to Improve';
        resultsMessage.textContent = 'You know some lines but might want to ride a few more.';
    } else {
        resultsTitle.textContent = 'Tourist Level';
        resultsMessage.textContent = 'Maybe stick to the bus for now? Try again!';
    }

    // Breakdown
    resultsBreakdown.innerHTML = '';
    questions.forEach(q => {
        const correct = q.userAnswer && q.userAnswer.id === q.correctLine.id;
        const row = document.createElement('div');
        row.className = `result-row ${correct ? 'correct-row' : 'wrong-row'}`;
        row.innerHTML = `
            <span class="line-dot" style="background: ${q.correctLine.color}"></span>
            <span class="line-name">${q.correctLine.name}</span>
            ${!correct && q.userAnswer ? `<span style="font-size:12px;color:#6b6b6b;">You said: ${q.userAnswer.name}</span>` : ''}
            <span class="result-icon">${correct ? '\u2705' : '\u274C'}</span>
        `;
        resultsBreakdown.appendChild(row);
    });
}

// Event listeners
startBtn.addEventListener('click', () => {
    questions = generateQuestions();
    currentQuestion = 0;
    score = 0;
    switchScreen(quizScreen);
    renderQuestion();
});

playBtn.addEventListener('click', playSound);

nextBtn.addEventListener('click', () => {
    soundEngine.stop();
    currentQuestion++;
    if (currentQuestion >= TOTAL_QUESTIONS) {
        showResults();
    } else {
        renderQuestion();
    }
});

restartBtn.addEventListener('click', () => {
    questions = generateQuestions();
    currentQuestion = 0;
    score = 0;
    switchScreen(quizScreen);
    renderQuestion();
});
