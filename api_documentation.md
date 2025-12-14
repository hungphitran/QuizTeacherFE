export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',

    AUTH: {
        LOGIN: {
            url: '/users/login',
            method: 'POST',
            body: {
                email: 'string',
                password: 'string'
            }
        },
        REGISTER: {
            url: '/users/register',
            method: 'POST',
            body: {
                email: 'string',
                password: 'string',
                fullName: 'string',
                role: 'string (optional)'
            }
        }
    },

    QUIZZES: {
        GET_ALL: {
            url: '/quizzes',
            method: 'GET',
            query: {
                page: 'number (optional, default 1)',
                limit: 'number (optional, default 10)',
                search: 'string (optional)'
            }
        },
        GET_ONE: {
            url: (id: number | string) => `/quizzes/${id}`,
            method: 'GET',
        },
        CREATE: {
            url: '/quizzes',
            method: 'POST',
            body: {
                title: 'string',
                description: 'string (optional)',
                timeLimit: 'number (optional)',
                status: 'string (DRAFT | PUBLISHED)'
            }
        },
        UPDATE: {
            url: (id: number | string) => `/quizzes/${id}`,
            method: 'PATCH',
            body: {
                title: 'string (optional)',
                description: 'string (optional)',
                // ... any other fields
            }
        },
        DELETE: {
            url: (id: number | string) => `/quizzes/${id}`,
            method: 'DELETE',
        }
    },

    QUESTIONS: {
        GET_ALL_BY_QUIZ: {
            url: (quizId: number | string) => `/quiz/${quizId}/questions`,
            method: 'GET',
            query: {
                page: 'number',
                limit: 'number'
            }
        },
        GET_ONE: {
            url: (quizId: number | string, questionId: number | string) => `/quiz/${quizId}/questions/${questionId}`,
            method: 'GET',
        },
        CREATE: {
            url: (quizId: number | string) => `/quiz/${quizId}/questions`,
            method: 'POST',
            body: {
                content: 'string',
                type: 'string (SINGLE_CHOICE | TRUE_FALSE)',
                points: 'number (default 1)',
                order: 'number',
                options: [
                    {
                        content: 'string',
                        isCorrect: 'boolean',
                        order: 'number'
                    }
                ]
            }
        },
        UPDATE: {
            url: (quizId: number | string, questionId: number | string) => `/quiz/${quizId}/questions/${questionId}`,
            method: 'PATCH',
            body: {
                content: 'string (optional)',
                options: 'Updated options array (optional)'
            }
        },
        DELETE: {
            url: (quizId: number | string, questionId: number | string) => `/quiz/${quizId}/questions/${questionId}`,
            method: 'DELETE',
        }
    },

    ATTEMPTS: {
        CREATE: {
            url: '/quiz_attempts',
            method: 'POST',
            body: {
                quizId: 'number',
                studentName: 'string',
                dateOfBirth: 'string (ISO Date)',
                className: 'string (optional)'
            }
        },
        SUBMIT_ANSWER: {
            url: '/submit_answer',
            method: 'POST',
            body: {
                attemptId: 'number',
                questionId: 'number',
                selectedOptionId: 'number'
            }
        },
        GET_ONE: {
            url: (id: number | string) => `/quiz_attempts/${id}`,
            method: 'GET'
        },
        GET_BY_STUDENT: {
            url: (studentId: number | string) => `/quiz_attempts_by_student_id/${studentId}`,
            method: 'GET',
            query: { page: 'number', limit: 'number' }
        },
        GET_BY_QUIZ: {
            url: (quizId: number | string) => `/quiz_attempts_by_quiz_id/${quizId}`,
            method: 'GET',
            query: { page: 'number', limit: 'number', keyword: 'string' }
        },
        GET_BY_STUDENT_AND_QUIZ: {
            url: (studentId: number | string, quizId: number | string) => `/quiz_attempts_by_student_id_and_quiz_id/${studentId}/${quizId}`,
            method: 'GET',
            query: { page: 'number', limit: 'number' }
        },
        GET_BY_CLASS_AND_QUIZ: {
            url: (className: string, quizId: number | string) => `/quiz_attempts_by_class_name_and_quiz_id/${className}/${quizId}`,
            method: 'GET',
            query: { page: 'number', limit: 'number' }
        },
        GET_STUDENT_ANSWERS: {
            url: (attemptId: number | string) => `/student_answers/${attemptId}`,
            method: 'GET',
            query: { page: 'number', limit: 'number' }
        }
    }
};
