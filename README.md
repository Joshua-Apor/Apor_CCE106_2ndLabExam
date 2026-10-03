# CCE106 Practical Laboratory Examination

## Student Service Portal

### Student Information

Name: Joshua Benedict T. Apor

Section: CCE106 - 2063

Date: October 1, 2026

### Required Features

- [ ] Login
- [ ] Authentication state
- [ ] Secure token storage
- [ ] Protected navigation
- [ ] Dashboard
- [ ] Student API request
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Search/filter
- [ ] Dynamic student details
- [ ] Profile
- [ ] Session restoration
- [ ] Logout

### API

Base URL: `REPLACE_WITH_EXAM_API` (set in `constants/api.ts`)

POST /login

GET /students

GET /students/{id}

GET /profile

Use the instructor's API documentation for payloads and response fields.

### How to Run

```sh
npm install
npx expo start
```

Press `w` for web, or run `npm run web` directly.

The starter opens the dashboard without authentication so its screens can be inspected.
Use **Open Sign In** to preview the login screen. Login, logout, and View Details
buttons intentionally do nothing until their TODOs are completed. Student screens
initially show loading until students implement the loaders. Preview the detail
layout on web at `/student/1`; this does not create a sample API record.

Search for `TODO EXAM` throughout the project. No requests or credentials are
provided. Protect both the application tabs and the student detail route.

Expo SecureStore is used only in `context/AuthContext.tsx`. Its methods are not
implemented in this starter. SecureStore supports native platforms, not web;
check availability before calling it and verify secure session persistence on
Android/iOS. See the [Expo SDK 54 SecureStore documentation](https://docs.expo.dev/versions/v54.0.0/sdk/securestore/).

Compiler and lint checks:

```sh
npx tsc --noEmit
npm run lint
```

### Required Git Commits

Students must create at least five meaningful commits.

Suggested examples:

- `exam: setup navigation`
- `exam: implement login`
- `exam: integrate student api`
- `exam: add dynamic student details`
- `exam: implement session and logout`

### Submission

Submit the GitHub repository URL according to the instructor's instructions.
