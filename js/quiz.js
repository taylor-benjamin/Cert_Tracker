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

  getAvailableCertifications() {
    return Object.keys(QUIZ_QUESTIONS).map(certId => {
      const cert = store.state.certifications.find(c => c.id === certId);
      const questionCount = QUIZ_QUESTIONS[certId]?.length || 0;
      return {
        id: certId,
        name: cert ? cert.name : certId.toUpperCase(),
        code: cert ? cert.code : '',
        questionCount
      };
    });
  }

  startQuiz(certId, domainFilter = null) {
    let questions = QUIZ_QUESTIONS[certId] || [];
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
