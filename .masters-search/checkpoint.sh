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
  for dir in "$WFBASE"/wf_*; do
    [ -d "$dir" ] || continue
    local run; run=$(basename "$dir")
    local src="$dir/journal.jsonl"
    [ -f "$src" ] || continue
    if ! cmp -s "$src" "$DEST/$run-journal.jsonl" 2>/dev/null; then
      cp "$src" "$DEST/$run-journal.jsonl"
      changed=1
    fi
  done
  if [ "$changed" = 1 ]; then
    cd "$REPO" || return
    git add .masters-search/ 2>/dev/null
    git -c user.name="Claude" -c user.email="aziz.dardouri1301@gmail.com" \
      commit -q -m "checkpoint: search progress snapshot $(date -u +%H:%M)" 2>/dev/null && \
      git push -q origin claude/skills-download-verify-i2xz4z 2>/dev/null
  fi
}

for i in $(seq 1 36); do
  snapshot
  sleep 300
done
snapshot
echo "checkpoint loop ended (timeout)"
