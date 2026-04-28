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
    let timerInterval = null;
    let timeLeft = 600; // 10 minutes default

    // Elements
    const quizLoader = document.getElementById('quiz-loader');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressBar = document.getElementById('progress-bar');
    const timerValue = document.getElementById('quiz-timer-value');

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

            // 1. Prepare Data
            currentQuiz = quizzes[0];
            
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

            // 2. Check for previous attempt
            const previousAttempt = await checkPreviousAttempt(currentQuiz.id);
            
            // Set basic UI info early
            const catEl = document.getElementById('quiz-category');
            if (catEl) catEl.textContent = currentQuiz.title || 'Geography Challenge';

            if (previousAttempt && previousAttempt.id) {
                let parsedAnswers = previousAttempt.answers;
                if (typeof parsedAnswers === 'string') {
                    try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { parsedAnswers = []; }
                }
                userAnswers = Array.isArray(parsedAnswers) ? parsedAnswers : [];
                score = previousAttempt.score || 0;

                if (previousAttempt.completed) {
                    showResults(true);
                    return;
                } else {
                    currentQuestionIndex = userAnswers.length;
                    if (currentQuestionIndex >= currentQuiz.questions.length) {
                        showResults(false);
                        return;
                    }
                }
            }

            initializeQuizUI();
            startTimer();
        } catch (err) {
            console.error('Quiz loading error:', err);
            alert(`Error loading quiz: ${err.message || 'Unknown error'}`);
            window.location.href = 'teen-map.html';
        }
    }

    function initializeQuizUI() {
        const xpPerQ = Math.floor((currentQuiz.xp_reward || 20) / currentQuiz.questions.length);
        const xpPerQEl = document.getElementById('xp-per-question');
        if (xpPerQEl) xpPerQEl.textContent = `+${xpPerQ} XP`;

        const stats = JSON.parse(localStorage.getItem('stats') || '{}');
        const totalXpEl = document.getElementById('sidebar-total-xp');
        if (totalXpEl) totalXpEl.textContent = (stats.xp || 0).toLocaleString();

        updateSidebar();
        renderQuestion();
        if (quizLoader) quizLoader.style.display = 'none';
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                finishQuiz();
                return;
            }
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            if (timerValue) timerValue.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function renderQuestion() {
        const question = currentQuiz.questions[currentQuestionIndex];
        const qData = question.data;

        // Update Text
        document.getElementById('question-number').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
        document.getElementById('question-text').textContent = qData.question;
        
        // Did You Know
        const dykText = document.getElementById('dyk-text');
        if (dykText) dykText.textContent = qData.fun_fact || "The world is full of amazing geography facts waiting for you to discover!";

        optionsContainer.innerHTML = '';
        
        // Handle Resumed Question Visuals
        const existingAnswer = userAnswers[currentQuestionIndex];
        
        Object.entries(qData.options).forEach(([letter, text]) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            if (existingAnswer && existingAnswer.selected_option === letter) {
                card.classList.add('selected');
                if (existingAnswer.is_correct) card.classList.add('correct');
                else card.classList.add('incorrect');
            }

            card.innerHTML = `
                <div class="option-left">
                    <div class="option-radio"></div>
                    <div class="option-text">${text}</div>
                </div>
                ${existingAnswer && existingAnswer.selected_option === letter ? '<span class="selected-badge">Selected</span>' : ''}
            `;
            
            if (!existingAnswer) {
                card.onclick = () => selectOption(card, letter);
            }
            optionsContainer.appendChild(card);
        });

        // Navigation state
        nextBtn.disabled = !existingAnswer;
        prevBtn.disabled = currentQuestionIndex === 0;
        
        updateProgress();
    }

    async function selectOption(card, letter) {
        if (nextBtn.disabled === false) return; // Already answered

        const qData = currentQuiz.questions[currentQuestionIndex].data;
        const isCorrect = letter === qData.correct;

        // Visual feedback
        const allCards = document.querySelectorAll('.option-card');
        allCards.forEach(c => c.onclick = null);
        
        card.classList.add('selected');
        card.innerHTML += '<span class="selected-badge">Selected</span>';

        if (isCorrect) {
            card.classList.add('correct');
            score++;
        } else {
            card.classList.add('incorrect');
            // Show correct answer
            allCards.forEach(c => {
                const optText = c.querySelector('.option-text').textContent;
                const correctText = qData.options[qData.correct];
                if (optText === correctText) c.classList.add('correct');
            });
        }

        userAnswers[currentQuestionIndex] = {
            question_id: currentQuiz.questions[currentQuestionIndex].id,
            selected_option: letter,
            is_correct: isCorrect
        };

        updateSidebar();
        await saveAttempt(false);
        nextBtn.disabled = false;
    }

    function updateProgress() {
        const total = currentQuiz.questions.length;
        const percent = Math.round((currentQuestionIndex / total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
    }

    function updateSidebar() {
        const total = currentQuiz.questions.length;
        const answered = userAnswers.filter(a => a !== undefined).length;
        const correct = userAnswers.filter(a => a && a.is_correct).length;
        const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

        // Progress Card
        const circle = document.getElementById('circle-progress');
        if (circle) circle.style.setProperty('--percent', percent);
        const percentText = document.getElementById('percent-text');
        if (percentText) percentText.textContent = `${percent}%`;
        
        const answeredEl = document.getElementById('answered-count');
        if (answeredEl) answeredEl.textContent = `${answered} / ${total}`;
        
        const correctEl = document.getElementById('correct-count');
        if (correctEl) correctEl.innerHTML = `<i class="fa-regular fa-circle-check"></i> ${correct}`;

        // Streak (Simple logic: consecutive correct answers in current session)
        let streak = 0;
        for (let i = userAnswers.length - 1; i >= 0; i--) {
            if (userAnswers[i] && userAnswers[i].is_correct) streak++;
            else if (userAnswers[i] && !userAnswers[i].is_correct) break;
        }
        const streakEl = document.getElementById('streak-value');
        if (streakEl) streakEl.textContent = streak;
        
        const dots = document.querySelectorAll('.streak-dot');
        dots.forEach((dot, idx) => {
            if (idx < streak) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    nextBtn.onclick = () => {
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        } else {
            finishQuiz();
        }
    };

    prevBtn.onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    };

    async function checkPreviousAttempt(quizId) {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (e) { console.error('Error checking attempt:', e); }
        return null;
    }

    async function saveAttempt(completed) {
        const xpEarned = completed ? Math.round((currentQuiz.xp_reward || 20) * (score / currentQuiz.questions.length)) : 0;
        try {
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
                    answers: userAnswers.filter(a => a !== undefined)
                })
            });
            const result = await response.json();
            if (response.ok && completed && result.rewards) {
                const stats = JSON.parse(localStorage.getItem('stats') || '{}');
                stats.xp = (stats.xp || 0) + (result.rewards.xp || 0);
                stats.tokens = (stats.tokens || 0) + (result.rewards.tokens || 0);
                localStorage.setItem('stats', JSON.stringify(stats));
                window.dispatchEvent(new Event('statsUpdated'));
            }
        } catch (e) { console.error('Error saving attempt:', e); }
    }

    async function finishQuiz() {
        if (timerInterval) clearInterval(timerInterval);
        if (quizLoader) {
            quizLoader.style.display = 'flex';
            quizLoader.querySelector('p').textContent = "Finishing your quiz...";
        }
        await saveAttempt(true);
        showResults(false);
    }

    function showResults(isPrevious) {
        if (timerInterval) clearInterval(timerInterval);
        const total = (currentQuiz.questions && currentQuiz.questions.length) || 0;
        const xpEarned = total > 0 ? Math.round((currentQuiz.xp_reward || 20) * (score / total)) : 0;

        if (quizLoader) quizLoader.style.display = 'none';
        const quizLayout = document.querySelector('.quiz-layout');
        // Hide sidebar and main column to show results clearly
        if (quizLayout) {
            const sidebar = document.querySelector('.quiz-sidebar');
            const mainCol = document.querySelector('.quiz-main-column');
            if (sidebar) sidebar.style.display = 'none';
            // Results is already inside mainCol, so we just hide other things in mainCol
            document.getElementById('quiz-container').style.display = 'none';
        }
        
        const results = document.getElementById('results-container');
        if (results) results.style.display = 'flex';
        
        if (document.getElementById('final-score')) document.getElementById('final-score').textContent = score;
        if (document.getElementById('final-total')) document.getElementById('final-total').textContent = `/ ${total}`;
        if (document.getElementById('final-xp')) document.getElementById('final-xp').textContent = `+${xpEarned}`;
        
        const titleEl = document.getElementById('results-title');
        const msgEl = document.getElementById('results-message');

        if (isPrevious) {
            if (titleEl) titleEl.textContent = "Quiz Already Completed";
            if (msgEl) msgEl.textContent = "You have already finished this quiz. Here is your recorded score:";
        } else {
            if (msgEl) {
                if (score === total && total > 0) msgEl.textContent = "Perfect Score! You're a true geography expert!";
                else if (score >= total / 2) msgEl.textContent = "Good job! You've got a solid understanding of this country.";
                else msgEl.textContent = "Keep practicing! You'll get better with each try.";
            }
        }
    }

    loadQuiz();
});

