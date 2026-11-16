#!/bin/bash
# Worker check: guards, problem query, Run, and (with SUBMIT=1) a real Two Sum submission.
# Usage: ./verify.sh [base_url]   token is read from .dev.vars unless ACCESS_TOKEN is set.
BASE=${1:-http://localhost:8787}
TOKEN=${ACCESS_TOKEN:-$(grep '^ACCESS_TOKEN=' "$(dirname "$0")/.dev.vars" | cut -d= -f2-)}
AUTH="Authorization: Bearer $TOKEN"
SLUG=two-sum
CODE='class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i'

poll() {
  for _ in $(seq 1 30); do
    sleep 1
    RESULT=$(curl -s -H "$AUTH" "$BASE/check/$1?slug=$SLUG")
    [ "$(echo "$RESULT" | jq -r '.state // .error')" != "PENDING" ] && [ "$(echo "$RESULT" | jq -r '.state // .error')" != "STARTED" ] && break
  done
  echo "$RESULT" | jq -c '{state, status_msg, correct_answer, status_runtime, status_memory, error}'
}

echo "== guards (expect 401, 403) =="
curl -s -o /dev/null -w "no token: %{http_code}\n" "$BASE/problem/$SLUG"
curl -s -o /dev/null -w "bad origin: %{http_code}\n" -H "$AUTH" -H 'Origin: https://evil.example' "$BASE/problem/$SLUG"

echo "== problem =="
PROBLEM=$(curl -s -H "$AUTH" "$BASE/problem/$SLUG")
echo "$PROBLEM" | jq -c '{questionId, title, langs: [.codeSnippets[]?.langSlug], error}'
QID=$(echo "$PROBLEM" | jq -r '.questionId')
TESTS=$(echo "$PROBLEM" | jq -r '.exampleTestcases')

echo "== run =="
RUN=$(jq -n --arg q "$QID" --arg c "$CODE" --arg t "$TESTS" '{lang:"python3", questionId:$q, code:$c, testcases:$t}' \
  | curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$BASE/run/$SLUG")
echo "$RUN"
RUN_ID=$(echo "$RUN" | jq -r '.id // empty')
[ -n "$RUN_ID" ] && poll "$RUN_ID"

[ "$SUBMIT" = "1" ] || exit 0
echo "== submit =="
SUBMITTED=$(jq -n --arg q "$QID" --arg c "$CODE" '{lang:"python3", questionId:$q, code:$c}' \
  | curl -s -X POST -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$BASE/submit/$SLUG")
echo "$SUBMITTED"
SUBMIT_ID=$(echo "$SUBMITTED" | jq -r '.id // empty')
[ -n "$SUBMIT_ID" ] && poll "$SUBMIT_ID"
