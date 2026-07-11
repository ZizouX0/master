#!/bin/bash
# Checkpoint loop: snapshot workflow journals into the repo and push, so partial
# search results survive session/container death. Runs until both workflows have
# final "return" entries or ~2h elapses.
set -u
REPO=/home/user/master
WFBASE=/root/.claude/projects/-home-user-master/8f162b98-27f5-5264-a4b4-07668aac85f1/subagents/workflows
DEST=$REPO/.masters-search/checkpoints
mkdir -p "$DEST"

snapshot() {
  local changed=0
  for run in wf_115032de-39e wf_f2cf9994-a1a; do
    local src="$WFBASE/$run/journal.jsonl"
    [ -f "$src" ] || continue
    if ! cmp -s "$src" "$DEST/$run-journal.jsonl" 2>/dev/null; then
      cp "$src" "$DEST/$run-journal.jsonl"
      changed=1
    fi
  done
  if [ "$changed" = 1 ]; then
    cd "$REPO" || return
    git add .masters-search/checkpoints .masters-search/STATE.md 2>/dev/null
    git -c user.name="Claude" -c user.email="aziz.dardouri1301@gmail.com" \
      commit -q -m "checkpoint: search progress snapshot $(date -u +%H:%M)" 2>/dev/null && \
      git push -q origin claude/skills-download-verify-i2xz4z 2>/dev/null
  fi
}

for i in $(seq 1 24); do
  snapshot
  # stop early if both journals contain a final workflow return marker
  done_count=0
  for run in wf_115032de-39e wf_f2cf9994-a1a; do
    grep -q '"type":"workflow_result"\|"type":"return"\|"type":"completed"' "$WFBASE/$run/journal.jsonl" 2>/dev/null && done_count=$((done_count+1))
  done
  [ "$done_count" = 2 ] && { snapshot; echo "both workflows complete; final checkpoint done"; exit 0; }
  sleep 300
done
snapshot
echo "checkpoint loop ended (timeout)"
