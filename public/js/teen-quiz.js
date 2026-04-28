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
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/country/${countryId}`);
            if (!response.ok) throw new Error('Failed to fetch quiz');

            const quizzes = await response.json();
            if (!quizzes || quizzes.length === 0) {
                alert('No quiz available for this country yet.');
                window.location.href = 'teen-map.html';
                return;
            }

            const quizData = quizzes[0];
            
            // Check for previous attempt (Resuming logic)
            const previousAttempt = await checkPreviousAttempt(quizData.id);
            if (previousAttempt && previousAttempt.id) {
                console.log('Previous attempt found:', previousAttempt);
                if (previousAttempt.completed) {
                    currentQuiz = quizData;
                    score = previousAttempt.score;
                    showResults(true); // Already completed
                    return;
                } else {
                    // Resume progress
                    score = previousAttempt.score || 0;
                    userAnswers = Array.isArray(previousAttempt.answers) ? previousAttempt.answers : [];
                    currentQuestionIndex = userAnswers.length;
                    
                    if (currentQuestionIndex >= quizData.questions.length) {
                        currentQuiz = quizData;
                        showResults(false);
                        return;
                    }
                }
            }

            initializeQuiz(quizData);
        } catch (err) {
            console.error('Quiz loading error:', err);
            alert('Error loading quiz. Please try again.');
            window.location.href = 'teen-map.html';
        }
    }

    function initializeQuiz(quizData) {
        currentQuiz = quizData;
        
        // Parse questions
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

        // Set Header Info - Prefer title if available, otherwise country_name
        document.getElementById('quiz-country-name').textContent = currentQuiz.title || currentQuiz.country_name || 'Global Challenge';
        document.getElementById('potential-xp').textContent = `+${currentQuiz.xp_reward || 20}`;
        
        fetchCountryFlag(countryId);

        // Update UI for resumed attempts
        if (userAnswers.length > 0) {
            const currentAccuracy = Math.round((score / userAnswers.length) * 100);
            document.getElementById('current-accuracy').textContent = `${currentAccuracy}%`;
        }
        
        renderQuestion();
        quizLoader.style.display = 'none';
        console.log("Quiz Initialized:", currentQuiz);
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
        const total = currentQuiz.questions.length;
        const xpEarned = Math.round((currentQuiz.xp_reward || 20) * (score / total));

        quizLoader.style.display = 'none';
        document.getElementById('quiz-container').style.display = 'none';
        const results = document.getElementById('results-container');
        results.style.display = 'flex';
        
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-total').textContent = `/ ${total}`;
        document.getElementById('final-xp').textContent = `+${xpEarned}`;
        
        if (isPrevious) {
            document.getElementById('results-title').textContent = "Quiz Already Completed";
            document.getElementById('results-message').textContent = "You have already finished this quiz. Here is your recorded score:";
        } else {
            if (score === total) {
                document.getElementById('results-message').textContent = "Perfect Score! You're a true geography expert!";
            } else if (score >= total / 2) {
                document.getElementById('results-message').textContent = "Good job! You've got a solid understanding of this country.";
            } else {
                document.getElementById('results-message').textContent = "Keep practicing! You'll get better with each try.";
            }
        }
    }

    loadQuiz();
});
