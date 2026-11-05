"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  calculatePersonalityResult,
  savePersonalityResult,
} from "@/app/actions/personality";
import { PersonalityResultView } from "@/components/PersonalityResultView";
import personalityData from "@/lib/personality-data.json";
import { calculatePersonality, type PersonalityCharacter } from "@/lib/personality";

type QuizState = "welcome" | "quiz" | "result";
const PENDING_ANSWERS_KEY = "butterflies-personality-pending-answers";

const questions = personalityData.questions;
const labels = personalityData.LIKERT_LABELS;
const roleData = personalityData.roleData as Record<string, PersonalityCharacter>;

export function PersonalityQuiz({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [screen, setScreen] = useState<QuizState>("welcome");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => Array(questions.length).fill(null)
  );
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [lastAnswers, setLastAnswers] = useState<number[] | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const character = resultKey ? roleData[resultKey] : null;

  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = sessionStorage.getItem(PENDING_ANSWERS_KEY);
    if (!stored) return;

    let restoredAnswers: unknown;
    try {
      restoredAnswers = JSON.parse(stored);
    } catch {
      sessionStorage.removeItem(PENDING_ANSWERS_KEY);
      setError("未能恢复待保存的测试答案，请重新测试。");
      return;
    }

    if (
      !Array.isArray(restoredAnswers) ||
      restoredAnswers.length !== questions.length ||
      restoredAnswers.some(
        (answer) => !Number.isInteger(answer) || answer < 1 || answer > 5
      )
    ) {
      sessionStorage.removeItem(PENDING_ANSWERS_KEY);
      setError("待保存的测试答案无效，请重新测试。");
      return;
    }

    sessionStorage.removeItem(PENDING_ANSWERS_KEY);
    setAnswers(restoredAnswers);
    setLastAnswers(restoredAnswers);
    setError("");
    startTransition(async () => {
      const state = await savePersonalityResult(restoredAnswers);
      if (state.error) {
        setError(state.error);
        setScreen("result");
        setResultKey(calculatePersonality(restoredAnswers).resultKey);
        return;
      }
      if (!state.result) {
        setError("保存测试结果失败，请稍后重试。");
        setScreen("result");
        setResultKey(calculatePersonality(restoredAnswers).resultKey);
        return;
      }
      setResultKey(state.result.resultKey);
      setScreen("result");
      router.refresh();
    });
  }, [isAuthenticated, router]);

  function submitAnswers(nextAnswers: Array<number | null>) {
    if (nextAnswers.some((answer) => answer === null)) {
      setError("请完成全部题目后查看结果。");
      return;
    }
    const completeAnswers = nextAnswers.filter(
      (answer): answer is number => answer !== null
    );

    setError("");
    setLastAnswers(completeAnswers);
    startTransition(async () => {
      const state = isAuthenticated
        ? await savePersonalityResult(completeAnswers)
        : await calculatePersonalityResult(completeAnswers);
      if (state.error) {
        setError(state.error);
        return;
      }
      if (!state.result) {
        setError("保存测试结果失败，请稍后重试。");
        return;
      }
      setResultKey(state.result.resultKey);
      setScreen("result");
      if (isAuthenticated) router.refresh();
    });
  }

  function chooseAnswer(value: number) {
    const nextAnswers = [...answers];
    nextAnswers[current] = value;
    setAnswers(nextAnswers);
    setError("");
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }
    submitAnswers(nextAnswers);
  }

  function restart() {
    setAnswers(Array(questions.length).fill(null));
    setCurrent(0);
    setResultKey(null);
    setError("");
    setScreen("quiz");
  }

  return (
    <section className="personality-quiz">
      {screen === "welcome" && (
        <article className="panel">
          <p className="eyebrow">A CHARACTER TEST · 24 QUESTIONS</p>
          <h2>测测你是《蝶》里的哪个人</h2>
          <p className="muted">
            一份以《蝶》角色气质为灵感的人格测试。无需登录即可查看结果；登录后可将结果保存到账号。
          </p>
          <ul className="personality-intro-list">
            <li>共 24 题，每题选择最符合你的程度</li>
            <li>预计用时 3–5 分钟</li>
            <li>结果包含角色故事、气质分析与点题台词</li>
          </ul>
          <button className="btn" type="button" onClick={restart}>
            开始测试
          </button>
        </article>
      )}

      {screen === "quiz" && (
        <article className="panel">
          <div className="personality-progress-heading">
            <span>第 {current + 1} / {questions.length} 题</span>
            <span>{Math.round(((current + 1) / questions.length) * 100)}%</span>
          </div>
          <div
            className="personality-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={current + 1}
            aria-label={`第 ${current + 1} 题，共 ${questions.length} 题`}
          >
            <span style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          <p className="muted">请选择你对这句话的同意程度</p>
          <h2 className="personality-question">{questions[current].text}</h2>
          <div className="personality-options">
            {labels.map(({ value, label }) => (
              <button
                className={`personality-option${answers[current] === value ? " selected" : ""}`}
                type="button"
                key={value}
                disabled={isPending}
                aria-pressed={answers[current] === value}
                onClick={() => chooseAnswer(value)}
              >
                <span>{value}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          {current > 0 && (
            <button
              className="btn secondary"
              type="button"
              disabled={isPending}
              onClick={() => {
                setError("");
                setCurrent(current - 1);
              }}
            >
              上一题
            </button>
          )}
          {isPending && <p className="muted" role="status">正在计算并保存结果…</p>}
          {current === questions.length - 1 &&
            answers[current] !== null &&
            !isPending && (
              <button
                className="btn"
                type="button"
                style={{ marginTop: "1rem" }}
                onClick={() => submitAnswers(answers)}
              >
                保存并查看结果
              </button>
            )}
        </article>
      )}

      {screen === "result" && character && (
        <div className="grid">
          <PersonalityResultView character={character} />
          {!isAuthenticated && lastAnswers && (
            <article className="panel">
              <p className="muted">
                登录或注册后，可将「{character.role}」测试结果保存到账号，之后随时查看。
              </p>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (lastAnswers) {
                    sessionStorage.setItem(
                      PENDING_ANSWERS_KEY,
                      JSON.stringify(lastAnswers)
                    );
                  }
                  router.push("/account?next=%2Fpersonality");
                }}
              >
                登录并保存测试结果
              </button>
            </article>
          )}
          <button className="btn secondary" type="button" onClick={restart}>
            再测一次
          </button>
        </div>
      )}
    </section>
  );
}
