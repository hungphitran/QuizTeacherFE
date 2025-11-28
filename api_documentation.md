# API Documentation for QuizTeacher

## Overview
This document provides the API endpoints for the QuizTeacher application. The backend is built using NestJS with a microservices architecture. The API Gateway exposes RESTful endpoints that communicate with the `user-service` and `quiz-service`.

## Base URL
All endpoints are prefixed with `/api`.
Example: `http://localhost:3000/api` (assuming the gateway runs on port 3000)

## Authentication
Currently, the API endpoints do not enforce authentication. The following header is documented for future use but is not currently required by the backend:
- **Header**: `Authorization: Bearer <token>`

---

## 1. User Service (Authentication)

### Login
- **Endpoint**: `POST /api/users/login`
- **Description**: Authenticate a user and receive access tokens.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatar": "http://example.com/avatar.jpg",
      "role": "USER",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    },
    "message": "Login successfully"
  }
  ```

### Register
- **Endpoint**: `POST /api/users/register`
- **Description**: Register a new user.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "avatar": "http://example.com/avatar.jpg", // Optional
    "role": "USER" // "USER", "ADMIN", "TEACHER"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatar": "http://example.com/avatar.jpg",
      "role": "USER",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z"
    },
    "tokens": { ... },
    "message": "Register successfully"
  }
  ```

---

## 2. Quiz Service (Quizzes)

### Get All Quizzes
- **Endpoint**: `GET /api/quizzes?page=1&limit=10`
- **Description**: Retrieve a list of all available quizzes.
- **Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Math Quiz",
        "description": "Basic algebra",
        "slug": "math-quiz",
        "coverImage": "http://example.com/cover.jpg",
        "status": "PUBLISHED",
        "timeLimit": 60,
        "creatorId": 1,
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### Get Quiz by ID
- **Endpoint**: `GET /api/quizzes/:id`
- **Description**: Retrieve details of a specific quiz, including its questions and options.
- **Params**: `id` (Quiz ID)
- **Response**:
  ```json
  {
    "id": 1,
    "title": "Math Quiz",
    "description": "Basic algebra",
    "slug": "math-quiz",
    "coverImage": "http://example.com/cover.jpg",
    "status": "PUBLISHED",
    "timeLimit": 60,
    "creatorId": 1,
    "createdAt": "2023-10-27T10:00:00Z",
    "updatedAt": "2023-10-27T10:00:00Z",
    "questions": [
      {
        "id": 101,
        "content": "What is 2 + 2?",
        "points": 1,
        "order": 0,
        "type": "SINGLE_CHOICE",
        "options": [
          { "id": 1, "content": "3", "isCorrect": false, "order": 0 },
          { "id": 2, "content": "4", "isCorrect": true, "order": 1 }
        ]
      }
    ]
  }
  ```

### Create Quiz
- **Endpoint**: `POST /api/quizzes`
- **Description**: Create a new quiz.
- **Request Body**:
  ```json
  {
    "title": "New Quiz",
    "description": "Quiz description",
    "coverImage": "http://...",
    "timeLimit": 30, // in minutes
    "status": "DRAFT", // "DRAFT", "PUBLISHED", "ARCHIVED"
    "creatorId": 1
  }
  ```
- **Response**: Created quiz object.

### Update Quiz
- **Endpoint**: `PATCH /api/quizzes/:id`
- **Description**: Update an existing quiz.
- **Params**: `id` (Quiz ID)
- **Request Body**: Partial object of Create Quiz.
- **Response**: Updated quiz object.

### Delete Quiz
- **Endpoint**: `DELETE /api/quizzes/:id`
- **Description**: Delete a quiz.
- **Params**: `id` (Quiz ID)
- **Response**: Deletion confirmation.

---

## 3. Quiz Service (Questions)

### Get All Questions for a Quiz
- **Endpoint**: `GET /api/quiz/:id/questions?page=1&limit=10`
- **Description**: Retrieve all questions for a specific quiz, including options.
- **Params**:
  - `id`: Quiz ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": 101,
        "content": "What is 2 + 2?",
        "points": 1,
        "order": 0,
        "type": "SINGLE_CHOICE",
        "options": [...]
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### Get Question by ID
- **Endpoint**: `GET /api/quiz/:id/questions/:questionId`
- **Description**: Retrieve a specific question with options.
- **Params**:
  - `id`: Quiz ID
  - `questionId`: Question ID
- **Response**: Question object with options.

### Create Question
- **Endpoint**: `POST /api/quiz/:id/questions`
- **Description**: Create a new question for a quiz.
- **Params**: `id` (Quiz ID)
- **Request Body**:
  ```json
  {
    "content": "What is 2 + 2?",
    "points": 1,
    "order": 0,
    "type": "SINGLE_CHOICE", // "SINGLE_CHOICE", "TRUE_FALSE"
    "options": {
      "create": [
        { "content": "3", "isCorrect": false, "order": 0 },
        { "content": "4", "isCorrect": true, "order": 1 }
      ]
    }
  }
  ```
- **Response**: Created question object.

### Update Question
- **Endpoint**: `PATCH /api/quiz/:id/questions/:questionId`
- **Description**: Update a question. If `options` are provided, existing options are replaced.
- **Params**:
  - `id`: Quiz ID
  - `questionId`: Question ID
- **Request Body**:
  ```json
  {
    "content": "Updated content",
    "points": 2,
    "options": {
      "create": [
        { "content": "New Option A", "isCorrect": true },
        { "content": "New Option B", "isCorrect": false }
      ]
    }
  }
  ```
- **Response**: Updated question object.

### Delete Question
- **Endpoint**: `DELETE /api/quiz/:id/questions/:questionId`
- **Description**: Delete a question.
- **Params**:
  - `id`: Quiz ID
  - `questionId`: Question ID
- **Response**: Deletion confirmation.

---

## 4. Quiz Service (Attempts & Answers)

### Start Quiz Attempt
- **Endpoint**: `POST /api/quiz_attempts`
- **Description**: Start a new attempt for a quiz.
- **Request Body**:
  ```json
  {
    "studentId": 1,
    "quizId": 1
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "studentId": 1,
    "quizId": 1,
    "score": null,
    "startedAt": "2023-10-27T10:00:00Z",
    "finishedAt": null
  }
  ```

### Submit Answer
- **Endpoint**: `POST /api/submit_answer`
- **Description**: Submit an answer for a question in an attempt.
- **Request Body**:
  ```json
  {
    "attemptId": 1,
    "questionId": 101,
    "selectedOptionId": 5
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "attemptId": 1,
    "questionId": 101,
    "selectedOptionId": 5,
    "createdAt": "2023-10-27T10:05:00Z"
  }
  ```

### Get Quiz Attempt Details
- **Endpoint**: `GET /api/quiz_attempts/:id`
- **Description**: Get details of a specific attempt.
- **Params**: `id` (Attempt ID)

### Get Student's Attempts
- **Endpoint**: `GET /api/quiz_attempts_by_student_id/:studentId?page=1&limit=10`
- **Description**: Get all attempts by a student.
- **Params**:
  - `studentId`: Student ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: Paginated list of attempts (see Get All Quizzes format).

### Get Quiz Attempts by Quiz ID
- **Endpoint**: `GET /api/quiz_attempts_by_quiz_id/:quizId?page=1&limit=10`
- **Description**: Get all attempts for a specific quiz.
- **Params**:
  - `quizId`: Quiz ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: Paginated list of attempts.

### Get Attempts by Student and Quiz
- **Endpoint**: `GET /api/quiz_attempts_by_student_id_and_quiz_id/:studentId/:quizId?page=1&limit=10`
- **Description**: Get attempts for a specific quiz by a specific student.
- **Params**:
  - `studentId`: Student ID
  - `quizId`: Quiz ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: Paginated list of attempts.

### Get Student Answers for an Attempt
- **Endpoint**: `GET /api/student_answers/:attemptId?page=1&limit=10`
- **Description**: Get all answers submitted for a specific attempt.
- **Params**:
  - `attemptId`: Attempt ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: Paginated list of answers.
