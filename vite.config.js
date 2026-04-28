import { defineConfig } from 'vite'

export default defineConfig({
    publicDir: 'public',   // ✅ CORRECT PLACE

    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                login: 'login.html',
                register: 'register.html',
                map: 'map.html',
                passport: 'passport.html',
                quiz: 'quiz.html',
                landing: 'landing.html',
                stories: 'stories.html',
                details: 'details.html',
                map1: 'map1.html',
                achievements: 'achievements.html',
                dashboard: 'dashboard.html',
                profile: 'profile.html',
                storyDetails: 'story-details.html',
                portalSelection: 'portal-selection.html',
                teenLogin: 'teen-login.html',
                teenDashboard: 'teen-dashboard.html',
                teenMap: 'teen-map.html',
                teenQuiz: 'teen-quiz.html',
                teenStories: 'teen-stories.html',
                teenStoryDetails: 'teen-story-details.html',
                teenLeaderboard: 'teen-leaderboard.html',
            }
        }
    }
})