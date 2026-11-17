#!/usr/bin/env bash
# robweb: keep the site server alive in a detached screen session (robweb), port 6980, for robweb.wolf.uk.com.
#   ./start.sh            start (no-op if running)
#   ./start.sh restart    stop then start
#   ./start.sh stop | status | logs
set -u
cd "$(dirname "$0")"
NAME=robweb PORT=6980 LOG=/root/robweb/robweb.log
running() { screen -ls | grep -q "\.$NAME[[:space:]]"; }
case "${1:-start}" in
  stop) running && screen -S "$NAME" -X quit; fuser -k "$PORT/tcp" 2>/dev/null; echo "stopped" ;;
  restart) "$0" stop; sleep 1; "$0" start ;;
  status) running && echo "running (screen $NAME, port $PORT)" || echo "stopped" ;;
  logs) tail -n 50 "$LOG" ;;
  start)
    if running; then echo "already running"; exit 0; fi
    screen -dmS "$NAME" bash -c "while true; do PORT=$PORT node serve.mjs >> $LOG 2>&1; echo restart >> $LOG; sleep 2; done"
    sleep 1; echo "started screen $NAME on port $PORT" ;;
esac
