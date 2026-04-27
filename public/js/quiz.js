document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryId = urlParams.get('id');

    if (!countryId) {
        showError('No country specified. Please return to the map.');
        return;
    }

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/country/${countryId}`);
        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const quizzes = await response.json();
        if (!quizzes || quizzes.length === 0) {
            showError('No quizzes found for this country yet.');
            return;
        }

        const quizData = quizzes[0];
        console.log("quiz Data: ", quizData);
        // Check for previous attempt
        const previousAttempt = await checkPreviousAttempt(quizData.id);
        if (previousAttempt && previousAttempt.id) {
            if (previousAttempt.completed) {
                initializeQuiz(quizData, true);
                score = previousAttempt.score;
                showResults(true);
                return;
            } else {
                // Resume from where we left off
                score = previousAttempt.score || 0;
                userAnswers = Array.isArray(previousAttempt.answers) ? previousAttempt.answers : [];
                currentQuestionIndex = userAnswers.length;

                // If they somehow finished but it's marked incomplete, show results
                if (currentQuestionIndex >= quizData.questions.length) {
                    initializeQuiz(quizData, true);
                    showResults(false); // Mark it as just finished
                    return;
                }

                initializeQuiz(quizData);
                return;
            }
        }

        initializeQuiz(quizData);
    } catch (error) {
        console.error('Quiz error:', error);
        showError('Could not load quiz. Please try again later.');
    }
});

let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let isQuizCompleted = false;

function initializeQuiz(quizData, isCompleted = false) {
    currentQuiz = quizData;
    isQuizCompleted = isCompleted;
    currentQuiz.questions = currentQuiz.questions.map(q => {
        // Parse the stringified JSON question if it's a string
        if (typeof q.question === 'string') {
            try {
                return { ...q, data: JSON.parse(q.question) };
            } catch (e) {
                console.error('Failed to parse question JSON:', q.question);
                return { ...q, data: { question: 'Invalid question format', options: {}, correct: '' } };
            }
        }
        return { ...q, data: q.question }; // Already an object?
    });

    document.getElementById('quiz-title-main').textContent = currentQuiz.title;
    document.getElementById('quiz-title-ribbon').textContent = currentQuiz.title;
    document.getElementById('quiz-xp-reward').textContent = currentQuiz.xp_reward || 20;

    // Try to fetch flag for the country
    fetchFlag(currentQuiz.country_id);

    if (!isCompleted) {
        renderQuestion();
    }
}

async function fetchFlag(countryId) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/country`);
        if (!response.ok) return;

        const countries = await response.json();
        const country = countries.find(c => c.id === countryId);

        if (!country) return;

        const miniFlag = document.getElementById('mini-flag');
        const mainFlag = document.getElementById('main-flag');

        if (country.code) {
            const flagUrl = `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
            if (miniFlag) { miniFlag.src = flagUrl; miniFlag.style.display = 'block'; }
            if (mainFlag) { mainFlag.src = flagUrl; mainFlag.style.display = 'block'; }
        } else {
            // Fallback to RestCountries search by name
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country.name)}?fullText=true`);
            const data = await res.json();
            if (data && data[0] && data[0].flags) {
                const flagUrl = data[0].flags.png || data[0].flags.svg;
                if (miniFlag) { miniFlag.src = flagUrl; miniFlag.style.display = 'block'; }
                if (mainFlag) { mainFlag.src = flagUrl; mainFlag.style.display = 'block'; }
            }
        }
    } catch (e) {
        console.error('Error loading flags:', e);
    }
}

function renderQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    if (!question) return;

    const qData = question.data;

    // Update indices
    const total = currentQuiz.questions.length;
    document.getElementById('question-index-top').textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
    document.getElementById('question-index-bottom').textContent = `Question ${currentQuestionIndex + 1} of ${total}`;

    // Update question text
    document.getElementById('question-text').textContent = qData.question;

    // Render choices
    const container = document.getElementById('choices-container');
    container.innerHTML = '';

    Object.entries(qData.options).forEach(([letter, text]) => {
        const choiceDiv = document.createElement('div');
        choiceDiv.className = 'quiz-choice';
        choiceDiv.innerHTML = `<span class="choice-letter">${letter})</span> ${text}`;
        choiceDiv.onclick = () => selectChoice(choiceDiv, letter);
        container.appendChild(choiceDiv);
    });

    // Reset UI states
    document.getElementById('success-banner').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('finish-btn').style.display = 'none';

    // Update step indicators
    renderStepIndicators();
}

async function selectChoice(element, letter) {
    const qData = currentQuiz.questions[currentQuestionIndex].data;
    const choices = document.querySelectorAll('.quiz-choice');

    // Disable further clicks
    choices.forEach(c => c.onclick = null);

    const isCorrect = letter === qData.correct;

    // Store user answer
    userAnswers.push({
        question_id: currentQuiz.questions[currentQuestionIndex].id,
        selected_option: letter,
        is_correct: isCorrect
    });

    // Update UI immediately
    if (isCorrect) {
        element.classList.add('correct');
        score++;
    } else {
        element.classList.add('incorrect');
        // Highlight correct one
        choices.forEach(c => {
            if (c.textContent.trim().startsWith(qData.correct + ')')) {
                c.classList.add('correct');
            }
        });
    }

    // Show feedback and update progress indicators immediately
    renderStepIndicators();
    showFeedback(isCorrect, qData);

    // Save progress in the background (Upload and Update)
    const xpMsg = document.getElementById('xp-message');
    const originalMsg = xpMsg.innerHTML;
    xpMsg.innerHTML = '<i class="fa-solid fa-cloud-upload" style="color: #3B82F6;"></i> Saving progress...';

    try {
        await saveAttempt(currentQuiz.id, score, false);
    } catch (e) {
        console.error('Failed to save progress:', e);
    } finally {
        xpMsg.innerHTML = originalMsg;
    }
}

function showFeedback(isCorrect, qData) {
    const banner = document.getElementById('success-banner');
    const feedbackText = document.getElementById('feedback-text');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');

    banner.style.display = 'flex';
    banner.style.backgroundColor = isCorrect ? '#ecfdf5' : '#fef2f2';

    if (isCorrect) {
        feedbackText.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #059669;"></i> Correct! ${qData.question.includes('capital') ? 'The answer is <strong>' + qData.options[qData.correct] + '</strong>.' : 'Great job!'}`;
    } else {
        feedbackText.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Oops! The correct answer was <strong>${qData.correct}: ${qData.options[qData.correct]}</strong>.`;
    }

    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => {
            currentQuestionIndex++;
            renderQuestion();
        };
    } else {
        finishBtn.style.display = 'block';
        finishBtn.onclick = () => showResults();
    }
}

function renderStepIndicators() {
    const container = document.getElementById('quiz-steps');
    container.innerHTML = '';
    const total = currentQuiz.questions.length;

    for (let i = 0; i < total; i++) {
        const step = document.createElement('div');
        step.style.width = '30px';
        step.style.height = '35px';
        step.style.borderRadius = '4px';
        step.style.display = 'flex';
        step.style.justifyContent = 'center';
        step.style.alignItems = 'center';
        step.style.border = '1px solid white';

        if (i < userAnswers.length) {
            step.style.background = '#8AC63C';
            step.innerHTML = '<i class="fa-solid fa-check" style="color: white; font-size: 12px;"></i>';
        } else if (i === userAnswers.length) {
            step.style.background = '#FBBF24';
            step.innerHTML = '<i class="fa-solid fa-star" style="color: white; font-size: 12px;"></i>';
        } else {
            step.style.background = 'rgba(226, 232, 240, 0.8)';
            step.innerHTML = '<i class="fa-solid fa-lock" style="color: #94A3B8;"></i>';
        }

        container.appendChild(step);
    }
}

async function showResults(isPrevious = false) {
    const total = currentQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);
    const xpEarned = Math.round((currentQuiz.xp_reward || 20) * (score / total));

    // Save attempt if not already saved
    if (!isPrevious) {
        try {
            await saveAttempt(currentQuiz.id, score, true, xpEarned);
        } catch (e) {
            console.error('Final save failed:', e);
        }
    }

    const wrapper = document.querySelector('.quiz-wrapper');
    wrapper.innerHTML = `
        <div style="text-align: center; padding: 40px; position: relative; z-index: 2;">
            <div style="font-size: 64px; margin-bottom: 20px;">${isPrevious ? '📖' : '🎉'}</div>
            <h2 style="font-size: 32px; font-weight: 800; color: #26170a;">${isPrevious ? 'Quiz Already Completed' : 'Quiz Completed!'}</h2>
            <p style="color: #64748B; margin-bottom: 20px;">${isPrevious ? 'You have already finished this quiz. Here is your recorded score:' : 'Great job! Your score has been recorded.'}</p>
            <div style="font-size: 20px; margin: 20px 0; font-weight: 700;">
                You scored <span style="color: #8AC63C;">${score}/${total}</span> (${percentage}%)
            </div>
            <div style="background: #FFFBEB; padding: 20px; border-radius: 12px; border: 1px solid #FEF3C7; display: inline-block; margin-bottom: 30px;">
                <div style="color: #92400E; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">XP Gained</div>
                <div style="font-size: 36px; font-weight: 900; color: #D97706;">+${xpEarned}</div>
            </div>
            <div>
                <a href="map1.html" class="btn-blue-glow" style="display: inline-block; text-decoration: none; padding: 12px 30px; border-radius: 30px;">Return to Map</a>
            </div>
        </div>
        <div style="position: absolute; right: 0; top: 0; height: 100%; width: 100%; background: url('./assets/world_map_bg.png') no-repeat center center; background-size: cover; z-index: 0; opacity: 0.1;"></div>
    `;
}

async function checkPreviousAttempt(quizId) {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response) {
            const data = await response.json();
            console.log('Previous attempt found:', data);
            return data;
        }
        console.warn('No previous attempt found or error:', response.status);
    } catch (error) {
        console.error('Error checking attempt:', error);
    }
    return null;
}

async function saveAttempt(quizId, score, completed, xpEarned = 0) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/quiz/attempt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                quiz_id: quizId,
                score,
                completed,
                xp_earned: xpEarned,
                answers: userAnswers
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to save quiz attempt:', errorData.error || 'Unknown error');
        } else {
            console.log(completed ? 'Quiz finalized!' : 'Progress saved...');
        }
    } catch (error) {
        console.error('Error saving attempt:', error);
    }
}

function showError(message) {
    const wrapper = document.querySelector('.quiz-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div style="text-align: center; padding: 50px; position: relative; z-index: 2;">
                <i class="ri-error-warning-line" style="font-size: 48px; color: #ef4444;"></i>
                <h3 style="margin-top: 16px;">Oops!</h3>
                <p style="color: #64748B;">${message}</p>
                <a href="map1.html" class="btn-blue-glow" style="display: inline-block; margin-top: 20px; text-decoration: none;">Back to Map</a>
            </div>
        `;
    }
}
