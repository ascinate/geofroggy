document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found. Redirecting to login...');
        window.location.href = 'teen-login.html';
        return;
    }

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
    let isQuizCompleted = false;

    // Elements
    const quizLoader = document.getElementById('quiz-loader');
    const quizArea = document.getElementById('quiz-question-area');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    async function loadQuiz() {
        try {
            console.log('Loading quiz for country:', countryId);
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/country/${countryId}`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const quizzes = await response.json();
            if (!quizzes || quizzes.length === 0) {
                alert('No quiz available for this country yet.');
                window.location.href = 'teen-map.html';
                return;
            }

            // 1. Prepare Data Immediately
            currentQuiz = quizzes[0];
            
            // Safety check for questions
            if (!currentQuiz.questions || !Array.isArray(currentQuiz.questions) || currentQuiz.questions.length === 0) {
                throw new Error('Quiz has no questions data');
            }

            currentQuiz.questions = currentQuiz.questions.map(q => {
                let parsedData = q.question;
                if (typeof q.question === 'string') {
                    try {
                        parsedData = JSON.parse(q.question);
                    } catch (e) {
                        console.error('Failed to parse question JSON:', q.question);
                        parsedData = { question: q.question, options: {}, correct: '' };
                    }
                }
                return { ...q, data: parsedData || {} };
            });

            // 2. Check for previous attempt (Resuming logic)
            const previousAttempt = await checkPreviousAttempt(currentQuiz.id);
            
            // Set basic UI info early
            const nameEl = document.getElementById('quiz-country-name');
            if (nameEl) nameEl.textContent = currentQuiz.title || currentQuiz.country_name || 'Global Challenge';
            fetchCountryFlag(countryId);

            if (previousAttempt && previousAttempt.id) {
                console.log('Previous attempt found:', previousAttempt);
                
                // Parse answers if they are in string format
                let parsedAnswers = previousAttempt.answers;
                if (typeof parsedAnswers === 'string') {
                    try {
                        parsedAnswers = JSON.parse(parsedAnswers);
                    } catch (e) {
                        console.error('Failed to parse previous attempt answers:', e);
                        parsedAnswers = [];
                    }
                }
                userAnswers = Array.isArray(parsedAnswers) ? parsedAnswers : [];
                score = previousAttempt.score || 0;

                if (previousAttempt.completed) {
                    showResults(true); // Already completed
                    return;
                } else {
                    // Resume progress
                    currentQuestionIndex = userAnswers.length;
                    
                    if (currentQuestionIndex >= currentQuiz.questions.length) {
                        showResults(false);
                        return;
                    }
                }
            }

            // 3. Initialize UI only if playing
            initializeQuizUI();
        } catch (err) {
            console.error('Quiz loading error:', err);
            alert(`Error loading quiz: ${err.message || 'Unknown error'}`);
            window.location.href = 'teen-map.html';
        }
    }

    function initializeQuizUI() {
        // Set Header Info
        const nameEl = document.getElementById('quiz-country-name');
        const xpEl = document.getElementById('potential-xp');
        
        if (nameEl && !nameEl.textContent.includes(currentQuiz.title)) {
            nameEl.textContent = currentQuiz.title || currentQuiz.country_name || 'Global Challenge';
        }
        if (xpEl) xpEl.textContent = `+${currentQuiz.xp_reward || 20}`;

        // Update UI for resumed attempts
        if (userAnswers.length > 0) {
            const currentAccuracy = Math.round((score / userAnswers.length) * 100);
            const accuracyEl = document.getElementById('current-accuracy');
            if (accuracyEl) accuracyEl.textContent = `${currentAccuracy}%`;
        }
        
        renderQuestion();
        if (quizLoader) quizLoader.style.display = 'none';
        console.log("Quiz UI Initialized");
    }

    async function fetchCountryFlag(id) {
        try {
            const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/country`);
            const countries = await res.json();
            const country = countries.find(c => c.id == id || c.name === id); // Use == for loose match if ID is string/num
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

    async function selectOption(card, letter) {
        if (nextBtn.disabled === false) return; // Already answered

        const qData = currentQuiz.questions[currentQuestionIndex].data;
        const isCorrect = letter === qData.correct;

        // Visual feedback
        const allCards = document.querySelectorAll('.option-card');
        allCards.forEach(c => c.onclick = null); // Disable all clicks
        
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

        // Update accuracy stat immediately
        const currentAccuracy = Math.round((score / userAnswers.length) * 100);
        document.getElementById('current-accuracy').textContent = `${currentAccuracy}%`;

        // Save progress (Partial)
        await saveAttempt(false);

        nextBtn.disabled = false;
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

    async function checkPreviousAttempt(quizId) {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (e) {
            console.error('Error checking attempt:', e);
        }
        return null;
    }

    async function saveAttempt(completed) {
        const xpEarned = completed ? Math.round((currentQuiz.xp_reward || 20) * (score / currentQuiz.questions.length)) : 0;

        try {
            console.log(`Saving attempt (completed: ${completed})...`);
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quiz_id: currentQuiz.id,
                    score: score,
                    completed: completed,
                    xp_earned: xpEarned,
                    answers: userAnswers
                })
            });
            
            const result = await response.json();

            if (!response.ok) {
                console.error('Failed to save quiz attempt:', result.error || 'Unknown error');
            } else {
                console.log(completed ? 'Attempt finalized!' : 'Progress saved...', result);
                
                // If completed, update the local stats to reflect the rewards immediately
                if (completed && result.rewards) {
                    const stats = JSON.parse(localStorage.getItem('stats') || '{}');
                    stats.xp = (stats.xp || 0) + (result.rewards.xp || 0);
                    stats.tokens = (stats.tokens || 0) + (result.rewards.tokens || 0);
                    localStorage.setItem('stats', JSON.stringify(stats));
                    
                    // Dispatch event for components to update if needed
                    window.dispatchEvent(new Event('statsUpdated'));
                }
            }
        } catch (e) {
            console.error('Error saving attempt:', e);
        }
    }

    async function finishQuiz() {
        quizArea.style.opacity = '0.5';
        nextBtn.disabled = true;
        
        await saveAttempt(true);
        showResults(false);
    }

    function showResults(isPrevious) {
        if (!currentQuiz) {
            console.error('Cannot show results: currentQuiz is null');
            return;
        }

        const total = (currentQuiz.questions && currentQuiz.questions.length) || 0;
        const xpEarned = total > 0 ? Math.round((currentQuiz.xp_reward || 20) * (score / total)) : 0;

        if (quizLoader) quizLoader.style.display = 'none';
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) quizContainer.style.display = 'none';
        
        const results = document.getElementById('results-container');
        if (results) results.style.display = 'flex';
        
        const scoreEl = document.getElementById('final-score');
        const totalEl = document.getElementById('final-total');
        const xpEl = document.getElementById('final-xp');
        
        if (scoreEl) scoreEl.textContent = score;
        if (totalEl) totalEl.textContent = `/ ${total}`;
        if (xpEl) xpEl.textContent = `+${xpEarned}`;
        
        const titleEl = document.getElementById('results-title');
        const msgEl = document.getElementById('results-message');

        if (isPrevious) {
            if (titleEl) titleEl.textContent = "Quiz Already Completed";
            if (msgEl) msgEl.textContent = "You have already finished this quiz. Here is your recorded score:";
        } else {
            if (msgEl) {
                if (score === total && total > 0) {
                    msgEl.textContent = "Perfect Score! You're a true geography expert!";
                } else if (score >= total / 2) {
                    msgEl.textContent = "Good job! You've got a solid understanding of this country.";
                } else {
                    msgEl.textContent = "Keep practicing! You'll get better with each try.";
                }
            }
        }
    }

    loadQuiz();
});
