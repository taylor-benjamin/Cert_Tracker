// Practice Quiz Engine: Test runner, Scoring, and History Tracker
import { QUIZ_QUESTIONS } from './data/quizQuestions.js';
import { store } from './state.js';

class QuizManager {
  constructor() {
    this.currentQuiz = null;
    this.currentIndex = 0;
    this.userAnswers = [];
    this.submitted = false;
  }

  getQuestionBank(certId) {
    const base = QUIZ_QUESTIONS[certId] || [];
    const generated = store.state.generatedQuestions?.[certId] || [];
    return [...base, ...generated];
  }

  getAvailableCertifications() {
    return Object.keys(QUIZ_QUESTIONS).map(certId => {
      const cert = store.state.certifications.find(c => c.id === certId);
      const questionCount = this.getQuestionBank(certId).length;
      return {
        id: certId,
        name: cert ? cert.name : certId.toUpperCase(),
        code: cert ? cert.code : '',
        questionCount
      };
    });
  }

  /**
   * Simulates an AI-generated question bank expansion for a certification/domain.
   * A real implementation would call an LLM API from a secured backend (never
   * directly from the browser, to avoid exposing API keys) — this local
   * template generator stands in for that call so the feature is usable offline.
   */
  generateQuestionsForCert(certId, domainName = null) {
    const cert = store.state.certifications.find(c => c.id === certId);
    if (!cert) return [];

    const domains = domainName
      ? cert.domains.filter(d => d.name === domainName)
      : cert.domains;

    const templates = [
      d => ({
        question: `Which of the following best reflects a core best practice within "${d.name}" for the ${cert.code} exam?`,
        options: [
          `Following documented ${cert.provider} guidance and validated design patterns`,
          'Skipping documentation review to save study time',
          'Relying solely on anecdotal exam-dump answers',
          'Ignoring exam blueprint weighting when studying'
        ],
        answerIndex: 0,
        explanation: `Official ${cert.provider} guidance and validated patterns are the most reliable basis for "${d.name}" exam scenarios.`
      }),
      d => ({
        question: `A candidate is prioritizing study time across exam domains. Given "${d.name}" carries meaningful exam weight, what is the recommended approach?`,
        options: [
          'Allocate study time proportional to domain weighting and personal weak spots',
          'Study every domain for an identical number of hours regardless of weight',
          'Skip the domain entirely if it seems unfamiliar',
          'Only review it the night before the exam'
        ],
        answerIndex: 0,
        explanation: 'Effective exam prep allocates time proportionally to domain weight and to the candidate\'s own knowledge gaps.'
      }),
      d => ({
        question: `Which study method is most effective for reinforcing scenario-based questions in "${d.name}"?`,
        options: [
          'Timed practice questions followed by reviewing explanations for missed answers',
          'Passive re-reading of notes without self-testing',
          'Memorizing answer letter positions from a single practice set',
          'Avoiding practice questions until the final week'
        ],
        answerIndex: 0,
        explanation: 'Active recall via timed practice questions, followed by reviewing rationale, builds durable scenario-based understanding.'
      })
    ];

    const newQuestions = domains.map((d, idx) => {
      const template = templates[idx % templates.length](d);
      return {
        domain: d.name,
        generated: true,
        generatedAt: new Date().toISOString(),
        ...template
      };
    });

    if (newQuestions.length > 0) {
      store.addGeneratedQuestions(certId, newQuestions);
    }
    return newQuestions;
  }

  startQuiz(certId, domainFilter = null) {
    let questions = this.getQuestionBank(certId);
    if (domainFilter && domainFilter !== 'all') {
      questions = questions.filter(q => q.domain === domainFilter);
    }

    if (questions.length === 0) {
      // Fallback: take any available
      questions = QUIZ_QUESTIONS['aws-saa'] || [];
    }

    // Shuffle and pick up to 5 questions
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    this.currentQuiz = {
      certId,
      certName: store.state.certifications.find(c => c.id === certId)?.name || 'Certification',
      questions: selected,
      total: selected.length,
      startedAt: new Date()
    };
    this.currentIndex = 0;
    this.userAnswers = new Array(selected.length).fill(null);
    this.submitted = false;

    return this.getCurrentQuestion();
  }

  getCurrentQuestion() {
    if (!this.currentQuiz || this.currentIndex >= this.currentQuiz.questions.length) {
      return null;
    }
    const q = this.currentQuiz.questions[this.currentIndex];
    return {
      index: this.currentIndex,
      total: this.currentQuiz.total,
      certName: this.currentQuiz.certName,
      domain: q.domain,
      question: q.question,
      options: q.options,
      selectedAnswer: this.userAnswers[this.currentIndex],
      isLast: this.currentIndex === this.currentQuiz.total - 1,
      isFirst: this.currentIndex === 0
    };
  }

  selectAnswer(answerIndex) {
    if (this.submitted) return;
    this.userAnswers[this.currentIndex] = answerIndex;
  }

  nextQuestion() {
    if (this.currentIndex < this.currentQuiz.total - 1) {
      this.currentIndex++;
      return this.getCurrentQuestion();
    }
    return null;
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentQuestion();
    }
    return null;
  }

  submitQuiz() {
    if (!this.currentQuiz || this.submitted) return null;
    this.submitted = true;

    let correctCount = 0;
    const review = this.currentQuiz.questions.map((q, idx) => {
      const selected = this.userAnswers[idx];
      const isCorrect = selected === q.answerIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        domain: q.domain,
        options: q.options,
        selected,
        correctIndex: q.answerIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctCount / this.currentQuiz.total) * 100);

    // Record in global state
    const attempt = store.addQuizAttempt({
      certId: this.currentQuiz.certId,
      certName: this.currentQuiz.certName,
      score,
      correct: correctCount,
      total: this.currentQuiz.total
    });

    return {
      score,
      correctCount,
      totalCount: this.currentQuiz.total,
      passed: score >= 70,
      certName: this.currentQuiz.certName,
      review,
      attempt
    };
  }
}

export const quizManager = new QuizManager();
