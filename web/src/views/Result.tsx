import type { CheckResult } from '../api';

export type Outcome =
  | { kind: 'run' | 'submit'; data: CheckResult; testcases: string }
  | { kind: 'run' | 'submit'; error: string; authExpired: boolean };

const ACCEPTED = 10;

function Block({ title, text }: { title: string; text?: string }) {
  if (text === undefined || text === null || text === '') return null;
  return (
    <div class="block">
      <div class="block-title">{title}</div>
      <pre>{text}</pre>
    </div>
  );
}

// Run returns one answer per case; split the raw input back into cases to show them side by side.
function RunCases({ data, testcases }: { data: CheckResult; testcases: string }) {
  const answers: string[] = data.code_answer ?? [];
  const expected: string[] = data.expected_code_answer ?? [];
  const stdout: string[] = data.std_output_list ?? [];
  const total: number = data.total_testcases ?? 0;
  const lines = testcases.split('\n');
  const linesPerCase = total > 0 && lines.length % total === 0 ? lines.length / total : 0;

  return (
    <>
      {Array.from({ length: total }, (_, index) => {
        const passed = data.compare_result?.[index] === '1';
        return (
          <div class={`case ${passed ? 'pass' : 'fail'}`} key={index}>
            <div class="case-title">
              {passed ? '✓' : '✗'} 케이스 {index + 1}
            </div>
            {linesPerCase > 0 && <Block title="입력" text={lines.slice(index * linesPerCase, (index + 1) * linesPerCase).join('\n')} />}
            <Block title="출력" text={answers[index]} />
            <Block title="기대값" text={expected[index]} />
            <Block title="stdout" text={stdout[index]} />
          </div>
        );
      })}
    </>
  );
}

export function Result({ outcome }: { outcome: Outcome }) {
  if ('error' in outcome) {
    return <div class={`result-banner ${outcome.authExpired ? 'auth' : 'bad'}`}>{outcome.error}</div>;
  }

  const { kind, data, testcases } = outcome;
  // Run reports status_msg "Accepted" even for wrong output; correct_answer is the real verdict.
  const wrongRun = kind === 'run' && data.status_code === ACCEPTED && !data.correct_answer;
  const accepted = data.status_code === ACCEPTED && !wrongRun;
  const status = wrongRun ? 'Wrong Answer' : data.status_msg;
  const compileError = data.full_compile_error || data.compile_error;
  const runtimeError = data.full_runtime_error || data.runtime_error;

  return (
    <div class="result">
      <div class={`result-banner ${accepted ? 'good' : 'bad'}`}>
        <b>{status}</b>
        {kind === 'submit' && data.total_testcases != null && (
          <span>
            {' '}
            {data.total_correct} / {data.total_testcases} 통과
          </span>
        )}
      </div>

      {!compileError && (
        <div class="stats">
          <span>시간 {data.status_runtime}</span>
          <span>메모리 {data.status_memory}</span>
        </div>
      )}

      <Block title="컴파일 에러" text={compileError} />
      <Block title="런타임 에러" text={runtimeError} />

      {kind === 'run' && !compileError && <RunCases data={data} testcases={testcases} />}

      {kind === 'submit' && !accepted && (
        <>
          <Block title="입력" text={data.input_formatted ?? data.last_testcase} />
          <Block title="출력" text={data.code_output} />
          <Block title="기대값" text={data.expected_output} />
          <Block title="stdout" text={data.std_output} />
        </>
      )}
    </div>
  );
}
