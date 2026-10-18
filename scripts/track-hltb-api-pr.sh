#!/usr/bin/env bash
set -euo pipefail

branch=monitor/hltb-api
repo=$GITHUB_REPOSITORY
owner=${repo%%/*}
base=$GITHUB_REF_NAME
run_url="$GITHUB_SERVER_URL/$repo/actions/runs/$GITHUB_RUN_ID"

# Include closed PRs so a later outage reopens the same PR instead of creating another.
record=$(gh pr list --repo "$repo" --state all --head "$owner:$branch" --base "$base" \
    --json number,state --jq 'map(select(.state != "MERGED")) | first | if . then "\(.number) \(.state)" else "" end')
pr=${record%% *}
state=${record#* }

if [[ $CHECK_RESULT == success ]]; then
    if [[ $state == OPEN ]]; then
        gh pr close "$pr" --repo "$repo" --comment "The API check recovered: $run_url"
    fi
    exit 0
fi

if [[ $state == OPEN ]]; then
    echo "Tracking PR #$pr is already open"
elif [[ $state == CLOSED ]]; then
    gh pr reopen "$pr" --repo "$repo" --comment "The API check failed again: $run_url"
else
    # This branch belongs only to the monitor. Leave its PR open until recovery.
    git switch -c "$branch"
    printf '# HLTB API check failure\n\nThe live auth, search, or game-data check failed. [View the failing run](%s) for details.\n\nDo not merge this PR. The scheduled check closes it when the API works again.\n' "$run_url" > .github/HLTB-API-CHECK.md
    git add .github/HLTB-API-CHECK.md
    git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
        commit -m 'ci: report HLTB API check failure'
    git push origin "HEAD:refs/heads/$branch"
    gh pr create --repo "$repo" --base "$base" --head "$branch" \
        --title 'HLTB API check is failing' \
        --body "The live HLTB API check failed: $run_url

This PR closes when a scheduled or manual check succeeds. Do not merge it."
    pr=$(gh pr view "$branch" --repo "$repo" --json number --jq .number)
fi

# The report contains only stable findings; do not repeat the same diagnosis hourly.
if [[ -n ${HLTB_REPORT_PATH:-} && -f $HLTB_REPORT_PATH ]]; then
    signature=$(sha256sum "$HLTB_REPORT_PATH" | cut -d' ' -f1)
    findings=$(jq -r '.findings[] | "- " + .' "$HLTB_REPORT_PATH")
else
    signature=unavailable
    findings='- Diagnostic report unavailable; inspect the workflow log.'
fi
marker="<!-- hltb-api-diagnostics:$signature -->"
last_marker=$(gh api "repos/$repo/issues/$pr/comments?per_page=100" --paginate --slurp |
    jq -r '[.[][] | select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- hltb-api-diagnostics:"))) | .body | split("\n")[0]] | last // ""')
if [[ $last_marker == "$marker" ]]; then
    echo "Diagnostic findings have not changed"
    exit 0
fi

body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf '%s\n\nObserved changes from the plugin contract:\n%s\n\n[View the failing run](%s). HTTP 403 and timeouts may be access or network failures, not API changes.\n' \
    "$marker" "$findings" "$run_url" > "$body"
gh pr comment "$pr" --repo "$repo" --body-file "$body"
