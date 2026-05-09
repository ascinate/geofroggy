# Database Structure & Admin UI Implementation Plan

Based on the analysis of the `geofroggy-api` routes and database interactions, here is an overview of the current database structure and the corresponding administrative pages that need to be developed to manage the ecosystem.

## 1. Database Schema Overview (Inferred)

The application uses **Supabase** with the following primary tables and relationships:

### Core User Data
- **`auth.users`**: Core authentication (managed by Supabase Auth).
- **`user_stats`**: Tracks `user_id`, `xp` points, and `last_active` date.
- **`user_profiles`**: Personal details like `username`, `avatar_url`, and `role`.

### Content & Gamification
- **`missions`**: Core mission data (`id`, `title`, `description`, `xp_reward`, `is_active`).
- **`stories`**: Educational content linked to geography (`id`, `title`, `country_id`, `xp_reward`).
- **`quizzes`**: Assessments linked to stories or countries (`id`, `title`, `passing_score`).
- **`questions` / `answers`**: Quiz content structure.
- **`countries`**: Geographic entities used for the map and story categorization.
- **`projects`**: High-level initiatives or challenges.

### Progress Tracking
- **`teen_mission_progress`**: Tracks user progress on missions (`status`, `progress %`, `started_at`, `completed_at`).
- **`user_story_progress`**: Simple completion tracking for stories.
- **`user_map_progress`**: Aggregated progress per country (`unlocked`, `progress %`, `completed`).

---

## 2. Required Admin Pages

To fully manage the Geofroggy ecosystem, the following pages are recommended for the admin dashboard:

### ✅ Implemented
- **`admin-login.html`**: Secure access for administrators.
- **`admin-dashboard.html`**: Overview of platform health, total users, and recent activity.
- **`admin-users.html`**: Comprehensive management of normal users and staff members (Admins).

### ⏳ To Be Created

#### 1. Mission Management (`admin-missions.html`)
- **Purpose**: Create and edit missions that users can participate in.
- **Features**: 
  - List all missions with "Active" toggle.
  - Form to set XP rewards and descriptions.
  - Analytics on mission completion rates.

#### 2. Story & Geography Manager (`admin-stories.html`)
- **Purpose**: Manage the educational "Stories" and their linkage to the world map.
- **Features**:
  - Assign stories to specific countries.
  - Rich text editor for story content.
  - Upload tool for story images/media.

#### 3. Quiz & Assessment Center (`admin-quizzes.html`)
- **Purpose**: Manage the question bank and quiz structures.
- **Features**:
  - Interactive quiz builder (Add questions, set correct answers).
  - Difficulty settings and passing criteria management.

#### 4. Map & Country Configuration (`admin-map.html`)
- **Purpose**: Configure which countries are "unlocked" by default or via specific missions.
- **Features**:
  - Visual list of supported countries.
  - Metadata management for regions (continent, difficulty level).

#### 5. Project Management (`admin-projects.html`)
- **Purpose**: Oversight of user-submitted projects and platform-wide initiatives.
- **Features**:
  - Review system for user projects.
  - Category management for different project types.

---

## 3. Recommended Priorities

1.  **Missions Management**: Since missions are the primary driver for XP and engagement.
2.  **Story & Quiz Management**: The core content that makes the app educational.
3.  **Map Configuration**: Crucial for the "Geofroggy" geographic theme.

---

*This report is generated based on the current codebase of `geofroggy-api` and the existing frontend structure.*
