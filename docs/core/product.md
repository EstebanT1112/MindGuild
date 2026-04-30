# CLAUDE.md — Braimind Master Context

## Project Name

Braimind (temporary name)

## Product Vision

Braimind is a mobile app that transforms studying into an engaging experience through:

* healthy competition
* social accountability
* weekly rankings
* streaks
* visual progress
* gamification
* collaborative learning

This is NOT just a timer app.

It is a study motivation platform.

---

# Target Users

* university students
* high school students
* exam preparation users
* study groups
* friends who want accountability

---

# Core Principles

Always prioritize:

1. simplicity
2. retention
3. practical execution
4. mobile UX quality
5. scalable architecture
6. fast shipping for small team

Avoid unnecessary complexity.

---

# Team Reality

* team of 3 developers
* limited time
* startup style execution
* need pragmatic decisions
* prefer shipping over perfection

---

# Tech Stack

## Mobile

* React Native
* Expo
* TypeScript

## State

* Zustand

## Backend

* Supabase

## Database

* PostgreSQL

## Visual Village

* React Native Skia
* Reanimated

---

# Delivery Roadmap

## E1 (MVP)

Must include:

* auth
* profile
* private rooms
* join by code
* room members
* study timer
* study sessions
* weekly room ranking by time
* daily missions
* achievements
* notifications
* basic village level
* mobile navigation
* persistence

## E2

Add:

* friends system
* collaborative questions
* quizzes
* academic ranking
* village objects
* inventory
* social notifications

## E3

Add:

* weekly boss system
* teams
* analytics intelligence
* heatmaps
* advanced personalization
* day/night weather
* advanced competition systems

---

# Room Modes (Very Important)

Rooms table contains `mode`.

## survival

Simple focus mode.

Includes:

* timer
* sessions
* weekly time ranking
* streaks
* missions
* achievements

Excludes:

* quizzes
* questions
* academic ranking
* boss system

## battle_royale

Competitive full mode.

Includes:

* everything from survival
* user questions
* validations
* weekly quiz
* quiz ranking
* academic ranking
* boss system later
* teams later

All backend/frontend logic must respect room mode.

---

# Study Logic

Users can study as long as they want.

Modes:

* pomodoro
* free mode

After session:

User may upload:

* study environment photo (optional)
* summary text

Then teammates validate.

If majority approves:

* valid session
* counts for ranking
* counts for progress

If rejected:

* no ranking progress

---

# Global Rankings

1. streak
2. weekly study time
3. academic score
4. boss count

---

# Room Rankings

## survival

* weekly time only

## battle_royale

* time
* quiz
* academic
* boss (future)

---

# Friends System

Bidirectional.

Flow:

* search username
* send request
* accept/reject
* friend list
* visit profile
* visit village

---

# Questions System

Users can create:

* multiple choice
* open text

For open text:

User submits:

* question
* correct answer

Another user answers.

Peers validate:

* question quality
* expected answer
* user answer

If original question is invalid:

* all related actions invalidated

---

# Weekly Quiz

Battle Royale only.

Generated from approved room questions.

---

# Weekly Boss (E3)

Boss is one room member.

First room week may have no boss.

---

# Village System

Important emotional reward layer.

Not static image.

Features:

* zoom
* evolving central object
* purchasable decorations
* inventory
* repeatable items
* friend visits
* future weather
* future night mode

---

# Economy

Coins earned from:

* missions
* achievements
* events

Coins used for:

* village objects
* streak shield

## Streak Shield

Protects one missed day.

---

# Development Rules

## Architecture

Use modular feature-based structure.

## Backend

All sensitive logic server-side:

* rankings
* rewards
* validations
* permissions
* active session rules

Never trust frontend.

## Frontend

Only expose features enabled for user mode / roadmap phase.

## Database

Prefer scalable schemas.

Avoid duplicate data unless intentional caching.

Use indexes.

---

# Coding Rules

When generating code:

* production-ready
* typed TypeScript
* maintainable
* readable
* reusable
* simple over clever

---

# Product Decision Rules

When suggesting features always evaluate:

1. retention impact
2. complexity cost
3. E1/E2/E3 fit
4. mobile UX impact
5. worth building now?

---

# What To Optimize First

1. onboarding
2. timer reliability
3. ranking excitement
4. streak motivation
5. room social loops
6. village delight

---

# What To Avoid

* feature bloat
* overengineering
* desktop-first UX
* unnecessary animations
* premature microservices
* weak retention loops

---

# If Uncertain

Choose the simplest scalable solution for a 3-person startup team.

---
