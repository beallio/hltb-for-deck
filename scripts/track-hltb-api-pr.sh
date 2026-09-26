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
    exit 0
fi
if [[ $state == CLOSED ]]; then
    gh pr reopen "$pr" --repo "$repo" --comment "The API check failed again: $run_url"
    exit 0
fi

# This branch belongs only to the monitor. Leave its PR open until the next healthy run.
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
