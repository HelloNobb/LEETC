#!/bin/bash
# Stage 0 check: problem query, Run, Submit through the Worker. Usage: ./verify.sh [base_url]
# Submit really submits a correct Two Sum (Python3) to your account.
BASE=${1:-http://localhost:8787}
SLUG=two-sum
CODE='class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i'

poll() {
  for _ in $(seq 1 20); do
    sleep 1
    RESULT=$(curl -s "$BASE/check/$1?slug=$SLUG")
    STATE=$(echo "$RESULT" | jq -r '(.body | objects | .state) // empty')
    [ "$STATE" = "SUCCESS" ] && break
    [ -z "$STATE" ] && break
  done
  echo "$RESULT" | jq '{status, cfMitigated, state: .body.state, status_msg: .body.status_msg, code_answer: .body.code_answer, expected: .body.expected_code_answer, runtime: .body.status_runtime, memory: .body.status_memory, error: .body.full_compile_error}'
}

echo "== 1. GraphQL problem =="
PROBLEM=$(curl -s "$BASE/problem/$SLUG")
echo "$PROBLEM" | jq '{status, server, cfMitigated, questionId: .body.data.question.questionId, langs: [.body.data.question.codeSnippets[]?.langSlug] | length, exampleTestcases: .body.data.question.exampleTestcases, contentChars: (.body.data.question.content | length)}'
QID=$(echo "$PROBLEM" | jq -r '.body.data.question.questionId')
TESTS=$(echo "$PROBLEM" | jq -r '.body.data.question.exampleTestcases')

echo "== 2. Run (interpret_solution) =="
RUN=$(jq -n --arg q "$QID" --arg c "$CODE" --arg d "$TESTS" '{lang:"python3", question_id:$q, typed_code:$c, data_input:$d}' \
  | curl -s -X POST "$BASE/run/$SLUG" -H 'Content-Type: application/json' --data-binary @-)
echo "$RUN" | jq '{status, server, cfMitigated, location, body: (.body | if type=="string" then .[0:300] else . end)}'
RUN_ID=$(echo "$RUN" | jq -r '(.body | objects | .interpret_id) // empty')
[ -n "$RUN_ID" ] && poll "$RUN_ID"

echo "== 3. Submit =="
SUBMIT=$(jq -n --arg q "$QID" --arg c "$CODE" '{lang:"python3", question_id:$q, typed_code:$c}' \
  | curl -s -X POST "$BASE/submit/$SLUG" -H 'Content-Type: application/json' --data-binary @-)
echo "$SUBMIT" | jq '{status, server, cfMitigated, location, body: (.body | if type=="string" then .[0:300] else . end)}'
SUBMIT_ID=$(echo "$SUBMIT" | jq -r '(.body | objects | .submission_id) // empty')
[ -n "$SUBMIT_ID" ] && poll "$SUBMIT_ID"
