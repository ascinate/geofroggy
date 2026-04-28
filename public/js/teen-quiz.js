document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryId = urlParams.get('id');

    if (!countryId) {
        showError('No country specified. Please return to the map.');
        return;
    }

    // State
    let currentQuiz = null;
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timer = 0;
    let timerInterval = null;
    let userAnswers = [];

    const loader = document.getElementById('quiz-loader');
    const quizBody = document.getElementById('quiz-body');
    const errorState = document.getElementById('quiz-error');
    const feedbackBanner = document.getElementById('feedback-banner');
    const resultScreen = document.getElementById('result-screen');

    async function startQuiz() {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/country/${countryId}`);
            if (!response.ok) throw new Error('Failed to fetch quiz data');

            const quizzes = await response.json();
            if (!quizzes || quizzes.length === 0) {
                showError('No quizzes found for this country yet.');
                return;
            }

            currentQuiz = quizzes[0];

            // Format questions
            questions = currentQuiz.questions.map(q => {
                let data = q.question;
                if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch (e) { console.error("Parse error", e); }
                }
                return { ...q, data };
            });

            if (questions.length === 0) {
                showError('This quiz has no questions.');
                return;
            }

            // Init UI
            document.getElementById('quiz-title').textContent = currentQuiz.title || 'Country Quiz';
            document.getElementById('xp-indicator').textContent = `+${currentQuiz.xp_reward || 20} XP Reward`;

            loader.style.display = 'none';
            quizBody.style.display = 'block';

            renderQuestion();
            startTimer();

        } catch (err) {
            console.error("Quiz load error:", err);
            showError('Could not load the quiz. Please try again later.');
        }
    }

    function renderQuestion() {
        const q = questions[currentQuestionIndex];
        const data = q.data;

        // Update Progress
        const total = questions.length;
        document.getElementById('question-count-text').textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
        document.getElementById('quiz-pbar-fill').style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;

        // Set Question Text
        document.getElementById('question-text').textContent = data.question;

        // Render Options
        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';

        Object.entries(data.options).forEach(([letter, text]) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `
                <div class="option-letter">${letter}</div>
                <div class="option-text">${text}</div>
            `;
            card.onclick = () => handleAnswer(letter, card);
            grid.appendChild(card);
        });

        // Hide feedback
        feedbackBanner.classList.remove('show');
    }

    function handleAnswer(selectedLetter, card) {
        const q = questions[currentQuestionIndex];
        const data = q.data;
        const correctLetter = data.correct;
        const isCorrect = selectedLetter === correctLetter;

        // Disable all options
        document.querySelectorAll('.option-card').forEach(c => c.style.pointerEvents = 'none');

        if (isCorrect) {
            score++;
            card.classList.add('correct');
            showFeedback(true, 'Correct!', 'You nailed it!');
        } else {
            card.classList.add('incorrect');
            // Highlight correct one
            document.querySelectorAll('.option-card').forEach(c => {
                if (c.querySelector('.option-letter').textContent === correctLetter) {
                    c.classList.add('correct');
                }
            });
            showFeedback(false, 'Oops!', `The correct answer was ${correctLetter}: ${data.options[correctLetter]}`);
        }

        userAnswers.push({
            question_id: q.id,
            selected_option: selectedLetter,
            is_correct: isCorrect
        });
    }

    function showFeedback(isCorrect, title, desc) {
        feedbackBanner.classList.remove('correct-bg', 'incorrect-bg');
        feedbackBanner.classList.add(isCorrect ? 'correct-bg' : 'incorrect-bg');

        document.getElementById('feedback-title').textContent = title;
        document.getElementById('feedback-desc').textContent = desc;
        document.getElementById('feedback-icon').innerHTML = isCorrect ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';

        const btn = document.getElementById('btn-next');
        if (currentQuestionIndex === questions.length - 1) {
            btn.querySelector('span').textContent = 'Finish Quiz';
        } else {
            btn.querySelector('span').textContent = 'Next Question';
        }

        feedbackBanner.classList.add('show');
    }

    document.getElementById('btn-next').onclick = () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            finishQuiz();
        }
    };

    async function finishQuiz() {
        clearInterval(timerInterval);
        quizBody.style.display = 'none';
        feedbackBanner.classList.remove('show');
        loader.style.display = 'flex';

        const total = questions.length;
        const xpEarned = Math.round((currentQuiz.xp_reward || 20) * (score / total));

        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quiz_id: currentQuiz.id,
                        score: score,
                        completed: true,
                        xp_earned: xpEarned,
                        answers: userAnswers
                    })
                });
            }
        } catch (e) {
            console.error("Failed to save attempt:", e);
        }

        // Show Results
        loader.style.display = 'none';
        resultScreen.style.display = 'block';

        document.getElementById('final-score').textContent = score;
        document.getElementById('total-questions').textContent = total;
        document.getElementById('final-xp').textContent = `+${xpEarned}`;

        if (score === total) {
            document.getElementById('result-title').textContent = 'Perfect Score!';
            document.getElementById('result-desc').textContent = 'You are a true Geography Genius!';
        } else if (score > total / 2) {
            document.getElementById('result-title').textContent = 'Well Done!';
            document.getElementById('result-desc').textContent = "Great effort! You're almost there.";
        } else {
            document.getElementById('result-title').textContent = 'Keep Practicing!';
            document.getElementById('result-desc').textContent = "Geography is hard, but you're getting better!";
        }
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            timer++;
            const mins = Math.floor(timer / 60).toString().padStart(2, '0');
            const secs = (timer % 60).toString().padStart(2, '0');
            document.getElementById('timer-text').textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function showError(msg) {
        loader.style.display = 'none';
        quizBody.style.display = 'none';
        errorState.style.display = 'flex';
        document.getElementById('error-message').textContent = msg;
    }

    // Start
    startQuiz();
});
