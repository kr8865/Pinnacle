import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiClock, FiCheckSquare, FiPlay, FiAward, FiBarChart2, FiAlertTriangle,
  FiTrendingUp, FiTrendingDown, FiArrowLeft,
} from 'react-icons/fi';
import testsService from '../../services/tests.service';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Extracts a usable id from either a populated object or a raw ObjectId string.
 */
function idOf(value) {
  return String(value?._id || value?.id || value || '');
}

/**
 * Normalizes the payload returned by `GET /results/my`. The exact shape
 * isn't pinned down in the API contract beyond "history + chapter-wise
 * performance + weak/strong chapters", so we defensively read several
 * likely key names and always fall back to empty arrays.
 */
function normalizeMyResults(raw) {
  const data = raw || {};
  const history = data.history || data.results || (Array.isArray(data) ? data : []) || [];
  const chapterWise = data.chapterWisePerformance || data.chapterWise || [];
  const weakChapters = data.weakChapters || data.weak || [];
  const strongChapters = data.strongChapters || data.strong || [];
  return { history, chapterWise, weakChapters, strongChapters };
}

function ResultSummary({ result, test, onViewLeaderboard, onBack }) {
  if (!result) return null;
  const percentage = result.percentage ?? (result.totalMarks ? (result.score / result.totalMarks) * 100 : 0);
  return (
    <div className="space-y-6">
      <div className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-warm-glow opacity-30 blur-3xl" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <FiAward className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-ink dark:text-ink-light">
            {result.status === 'auto-submitted' ? 'Time up — test auto-submitted' : 'Test submitted!'}
          </h2>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
            {test?.title || result.test?.title || 'Your result'}
          </p>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
              <p className="text-xs uppercase tracking-wide text-ink-lightMuted">Score</p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-ink-light">
                {result.score ?? 0} / {result.totalMarks ?? test?.totalMarks ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
              <p className="text-xs uppercase tracking-wide text-ink-lightMuted">Percentage</p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-ink-light">{Number(percentage || 0).toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
              <p className="text-xs uppercase tracking-wide text-ink-lightMuted">Rank</p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-ink-light">{result.rank ?? '—'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className="btn-secondary" onClick={onViewLeaderboard}>
              <FiBarChart2 className="h-4 w-4" /> View Leaderboard
            </button>
            <button type="button" className="btn-primary" onClick={onBack}>
              <FiArrowLeft className="h-4 w-4" /> Back to Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterChips({ title, icon: Icon, tone, chapters }) {
  if (!chapters?.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink dark:text-ink-light">
        <Icon className={`h-4 w-4 ${tone}`} /> {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {chapters.map((c, i) => (
          <span
            key={c._id || c.chapter || c.name || i}
            className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-muted dark:bg-white/5 dark:text-ink-lightMuted"
          >
            {c.name || c.title || c.chapter?.title || `Chapter ${i + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Tests() {
  const [view, setView] = useState('list'); // 'list' | 'exam' | 'result'

  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);

  const [myResults, setMyResults] = useState({ history: [], chapterWise: [], weakChapters: [], strongChapters: [] });
  const [myResultsLoading, setMyResultsLoading] = useState(true);

  const [starting, setStarting] = useState(null);

  const [activeTest, setActiveTest] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examMeta, setExamMeta] = useState(null); // { resultId, startedAt, durationMinutes }
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const submitLockRef = useRef(false);

  const loadTests = useCallback(async () => {
    try {
      setTestsLoading(true);
      const res = await testsService.list();
      const data = res?.data?.data;
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load tests');
    } finally {
      setTestsLoading(false);
    }
  }, []);

  const loadMyResults = useCallback(async () => {
    try {
      setMyResultsLoading(true);
      const res = await testsService.myResults();
      setMyResults(normalizeMyResults(res?.data?.data));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load your results');
    } finally {
      setMyResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
    loadMyResults();
  }, [loadTests, loadMyResults]);

  const resultsByTest = useMemo(() => {
    const map = new Map();
    myResults.history.forEach((r) => {
      const testId = idOf(r.test);
      if (testId) map.set(testId, r);
    });
    return map;
  }, [myResults.history]);

  const handleStart = async (test) => {
    try {
      setStarting(test._id);
      const res = await testsService.start(test._id);
      const payload = res?.data?.data || res?.data || {};
      const questions = payload.questions || payload.test?.questions || [];
      const resultId = payload.resultId || payload.result?._id || payload._id || null;
      const startedAt = payload.startedAt || payload.result?.startedAt || payload.serverTime || new Date().toISOString();
      const durationMinutes = payload.durationMinutes || payload.test?.durationMinutes || test.durationMinutes || 30;

      submitLockRef.current = false;
      setActiveTest({ ...test, durationMinutes, type: payload.test?.type || test.type });
      setExamQuestions(questions);
      setExamMeta({ resultId, startedAt, durationMinutes });
      setAnswers({});
      setSubmittedResult(null);
      setView('exam');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start test');
    } finally {
      setStarting(null);
    }
  };

  const handleViewResult = (test) => {
    const result = resultsByTest.get(String(test._id));
    setActiveTest(test);
    setSubmittedResult(result || null);
    setView('result');
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting || !activeTest) return;
    try {
      setSubmitting(true);
      const payloadAnswers = examQuestions.map((q) => ({
        questionId: q._id,
        selected: answers[q._id] !== undefined ? answers[q._id] : null,
      }));
      const res = await testsService.submit(activeTest._id, { answers: payloadAnswers });
      const result = res?.data?.data || null;
      setSubmittedResult(result);
      setView('result');
      toast.success(auto ? 'Time is up — your test was auto-submitted' : 'Test submitted successfully');
      loadMyResults();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit test');
      submitLockRef.current = false;
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }, [submitting, activeTest, examQuestions, answers, loadMyResults]);

  // Countdown timer keyed off durationMinutes + server start time. Auto-submits at zero.
  useEffect(() => {
    if (view !== 'exam' || !examMeta) return undefined;
    const endTime = new Date(examMeta.startedAt).getTime() + examMeta.durationMinutes * 60000;

    const tick = () => {
      const remaining = endTime - Date.now();
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0 && !submitLockRef.current) {
        submitLockRef.current = true;
        handleSubmit(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [view, examMeta, handleSubmit]);

  const openLeaderboard = async () => {
    if (!activeTest) return;
    setLeaderboardOpen(true);
    setLeaderboardLoading(true);
    try {
      const res = await testsService.leaderboard(activeTest._id);
      const data = res?.data?.data;
      setLeaderboardData(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setActiveTest(null);
    setExamQuestions([]);
    setExamMeta(null);
    setAnswers({});
    setSubmittedResult(null);
  };

  const answeredCount = examQuestions.filter((q) => answers[q._id] !== undefined && answers[q._id] !== '').length;

  const columns = [
    { key: 'title', label: 'Test', render: (row) => (
      <div>
        <p className="font-semibold text-ink dark:text-ink-light">{row.title}</p>
        <p className="text-xs text-ink-muted dark:text-ink-lightMuted">{row.course?.name || row.course?.title || 'Course'}</p>
      </div>
    ) },
    { key: 'type', label: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'durationMinutes', label: 'Duration', render: (row) => `${row.durationMinutes} min` },
    { key: 'status', label: 'Status', render: (row) => {
      const attempted = resultsByTest.get(String(row._id));
      return <StatusPill status={attempted ? 'completed' : row.status || 'published'} />;
    } },
    { key: 'action', label: '', render: (row) => {
      const attempted = resultsByTest.get(String(row._id));
      if (attempted) {
        return (
          <button type="button" className="btn-secondary py-1.5 px-4 text-xs" onClick={() => handleViewResult(row)}>
            View Result
          </button>
        );
      }
      return (
        <button
          type="button"
          className="btn-primary py-1.5 px-4 text-xs"
          disabled={starting === row._id}
          onClick={() => handleStart(row)}
        >
          <FiPlay className="h-3.5 w-3.5" /> {starting === row._id ? 'Starting…' : 'Start Test'}
        </button>
      );
    } },
  ];

  if (view === 'result') {
    return (
      <div className="space-y-6">
        <ResultSummary result={submittedResult} test={activeTest} onViewLeaderboard={openLeaderboard} onBack={backToList} />
        <Modal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} title="Leaderboard" size="md">
          {leaderboardLoading ? (
            <SkeletonTable rows={5} cols={3} />
          ) : leaderboardData.length ? (
            <div className="divide-y divide-surface-border dark:divide-surface-darkBorder">
              {leaderboardData.map((row, i) => (
                <div key={row._id || row.student?._id || i} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-ink dark:text-ink-light">#{row.rank ?? i + 1} {row.student?.name || row.name || 'Student'}</span>
                  <span className="text-ink-muted dark:text-ink-lightMuted">{row.score ?? 0} pts · {Number(row.percentage ?? 0).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No leaderboard data yet" />
          )}
        </Modal>
      </div>
    );
  }

  if (view === 'exam' && activeTest && examMeta) {
    const isUrgent = timeLeft < 60000;
    return (
      <div className="space-y-6">
        <div className="card sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold text-ink dark:text-ink-light">{activeTest.title}</h2>
            <p className="text-xs text-ink-muted dark:text-ink-lightMuted">
              {answeredCount} / {examQuestions.length} answered
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isUrgent ? 'bg-danger/10 text-danger' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'}`}>
            <FiClock className="h-4 w-4" /> {formatClock(timeLeft)}
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-500"
            style={{ width: `${examQuestions.length ? (answeredCount / examQuestions.length) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-4">
          {examQuestions.map((q, i) => (
            <div key={q._id || i} className="card p-5">
              <p className="mb-3 font-medium text-ink dark:text-ink-light">
                <span className="mr-2 text-ink-muted dark:text-ink-lightMuted">Q{i + 1}.</span>{q.text}
                {q.marks != null && (
                  <span className="ml-2 text-xs font-normal text-ink-lightMuted">({q.marks} marks)</span>
                )}
              </p>

              {activeTest.type === 'subjective' || !q.options?.length ? (
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="Write your answer here…"
                  disabled={submitting}
                  value={answers[q._id] || ''}
                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${
                        answers[q._id] === oi
                          ? 'border-brand-500 bg-brand-500/5'
                          : 'border-surface-border dark:border-surface-darkBorder hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        className="h-4 w-4 accent-brand-500"
                        disabled={submitting}
                        checked={answers[q._id] === oi}
                        onChange={() => handleAnswerChange(q._id, oi)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn-primary" disabled={submitting} onClick={() => setConfirmOpen(true)}>
            <FiCheckSquare className="h-4 w-4" /> Submit Test
          </button>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => handleSubmit(false)}
          title="Submit test?"
          message={`You've answered ${answeredCount} of ${examQuestions.length} questions. Once submitted, you cannot change your answers.`}
          confirmLabel="Submit"
          loading={submitting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            Tests
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
            Attempt available tests and track your performance over time.
          </p>
        </motion.div>
      </div>

      {testsLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : tests.length === 0 ? (
        <EmptyState icon={FiCheckSquare} title="No tests available" description="Check back once your teachers publish new tests." />
      ) : (
        <DataTable columns={columns} data={tests} rowKey={(row) => row._id} />
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-ink dark:text-ink-light">Your Performance</h3>
        {myResultsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : myResults.history.length === 0 ? (
          <EmptyState title="No test history yet" description="Attempt a test to see your score trend and chapter-wise performance here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h4 className="mb-3 text-sm font-semibold text-ink dark:text-ink-light">Recent Scores</h4>
              <div className="divide-y divide-surface-border dark:divide-surface-darkBorder">
                {myResults.history.slice(0, 6).map((r, i) => (
                  <div key={r._id || i} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink dark:text-ink-light">{r.test?.title || 'Test'}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-lightMuted">{formatDate(r.submittedAt || r.createdAt)}</p>
                    </div>
                    <span className="font-semibold text-ink dark:text-ink-light">
                      {Number(r.percentage ?? (r.totalMarks ? (r.score / r.totalMarks) * 100 : 0)).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-5 p-5">
              <ChapterChips title="Strong Chapters" icon={FiTrendingUp} tone="text-success" chapters={myResults.strongChapters} />
              <ChapterChips title="Weak Chapters" icon={FiTrendingDown} tone="text-danger" chapters={myResults.weakChapters} />
              {!myResults.strongChapters?.length && !myResults.weakChapters?.length && (
                <div className="flex items-center gap-2 text-sm text-ink-muted dark:text-ink-lightMuted">
                  <FiAlertTriangle className="h-4 w-4" /> Not enough data yet to determine chapter strengths.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
