document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryId = urlParams.get('id');

    if (!countryId) {
        alert('No country specified. Returning to map.');
        window.location.href = 'teen-map.html';
        return;
    }

    // Global State
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let isSaving = false;

    // Elements
    const quizLoader = document.getElementById('quiz-loader');
    const quizArea = document.getElementById('quiz-question-area');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    async function loadQuiz() {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/country/${countryId}`);
            if (!response.ok) throw new Error('Failed to fetch quiz');

            const quizzes = await response.json();
            if (!quizzes || quizzes.length === 0) {
                alert('No quiz available for this country yet.');
                window.location.href = 'teen-map.html';
                return;
            }

            currentQuiz = quizzes[0];
            
            // Parse questions if they are JSON strings
            currentQuiz.questions = currentQuiz.questions.map(q => {
                if (typeof q.question === 'string') {
                    try {
                        return { ...q, data: JSON.parse(q.question) };
                    } catch (e) {
                        return { ...q, data: { question: q.question, options: {}, correct: '' } };
                    }
                }
                return { ...q, data: q.question };
            });

            // Set Header Info
            document.getElementById('quiz-country-name').textContent = currentQuiz.country_name || 'Global Challenge';
            document.getElementById('potential-xp').textContent = `+${currentQuiz.xp_reward || 20}`;
            
            fetchCountryFlag(countryId);
            
            renderQuestion();
            quizLoader.style.display = 'none';
        } catch (err) {
            console.error('Quiz loading error:', err);
            alert('Error loading quiz. Please try again.');
            window.location.href = 'teen-map.html';
        }
    }

    async function fetchCountryFlag(id) {
        try {
            const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/country`);
            const countries = await res.json();
            const country = countries.find(c => c.id === id || c.name === id);
            if (country && country.code) {
                const flagImg = document.getElementById('quiz-flag');
                flagImg.src = `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
                flagImg.style.display = 'block';
            }
        } catch (e) {}
    }

    function renderQuestion() {
        const question = currentQuiz.questions[currentQuestionIndex];
        const qData = question.data;

        // Update UI
        document.getElementById('question-number').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
        document.getElementById('question-text').textContent = qData.question;
        
        optionsContainer.innerHTML = '';
        nextBtn.disabled = true;

        Object.entries(qData.options).forEach(([letter, text]) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `
                <div class="option-letter">${letter}</div>
                <div class="option-text">${text}</div>
            `;
            card.onclick = () => selectOption(card, letter);
            optionsContainer.appendChild(card);
        });

        updateProgress();
    }

    function selectOption(card, letter) {
        if (nextBtn.disabled === false) return; // Already answered

        const qData = currentQuiz.questions[currentQuestionIndex].data;
        const isCorrect = letter === qData.correct;

        // Visual feedback
        const allCards = document.querySelectorAll('.option-card');
        allCards.forEach(c => c.classList.remove('selected'));
        
        if (isCorrect) {
            card.classList.add('correct');
            score++;
        } else {
            card.classList.add('incorrect');
            // Highlight correct one
            allCards.forEach(c => {
                if (c.querySelector('.option-letter').textContent === qData.correct) {
                    c.classList.add('correct');
                }
            });
        }

        userAnswers.push({
            question_id: currentQuiz.questions[currentQuestionIndex].id,
            selected_option: letter,
            is_correct: isCorrect
        });

        // Save partial progress
        saveAttempt(false);

        nextBtn.disabled = false;
        
        // Update accuracy stat
        const currentAccuracy = Math.round((score / userAnswers.length) * 100);
        document.getElementById('current-accuracy').textContent = `${currentAccuracy}%`;
    }

    function updateProgress() {
        const total = currentQuiz.questions.length;
        const percent = Math.round((currentQuestionIndex / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}% Completed`;
    }

    nextBtn.onclick = () => {
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            finishQuiz();
        }
    };

    async function saveAttempt(completed) {
        const token = localStorage.getItem('token');
        if (!token) return;

        const xpEarned = completed ? Math.round((currentQuiz.xp_reward || 20) * (score / currentQuiz.questions.length)) : 0;

        try {
            await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quiz_id: currentQuiz.id,
                    score,
                    completed,
                    xp_earned: xpEarned,
                    answers: userAnswers
                })
            });
        } catch (e) {
            console.error('Failed to save attempt:', e);
        }
    }

    async function finishQuiz() {
        quizArea.style.opacity = '0.5';
        nextBtn.disabled = true;
        
        await saveAttempt(true);
        
        const total = currentQuiz.questions.length;
        const xpEarned = Math.round((currentQuiz.xp_reward || 20) * (score / total));

        // Show Results
        document.getElementById('quiz-container').style.display = 'none';
        const results = document.getElementById('results-container');
        results.style.display = 'flex';
        
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-total').textContent = `/ ${total}`;
        document.getElementById('final-xp').textContent = `+${xpEarned}`;
        
        if (score === total) {
            document.getElementById('results-message').textContent = "Perfect Score! You're a true geography expert!";
        } else if (score >= total / 2) {
            document.getElementById('results-message').textContent = "Good job! You've got a solid understanding of this country.";
        } else {
            document.getElementById('results-message').textContent = "Keep practicing! You'll get better with each try.";
        }
    }

    loadQuiz();
});
