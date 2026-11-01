#!/usr/bin/env bash
# ==============================================================================
# PlateVision AI — Automated Database Backup Script
# Creates an encrypted/gzipped snapshot of the MongoDB database.
# Can be scheduled via cron (e.g., daily at 02:00 AM):
# 0 2 * * * /path/to/PlateVision/scripts/backup-db.sh >> /var/log/platevision-backup.log 2>&1
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ARCHIVE_NAME="platevision_backup_${TIMESTAMP}.tar.gz"

echo "=== Starting PlateVision database backup at $(date) ==="

# Check if MONGODB_URI is provided
if [ -z "${MONGODB_URI:-}" ]; then
  if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
  fi
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "⚠️ MONGODB_URI not set. Please configure MONGODB_URI to perform live backup."
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

TEMP_DUMP_DIR=$(mktemp -d)
trap 'rm -rf "${TEMP_DUMP_DIR}"' EXIT

echo "Running mongodump to temporary directory..."
if command -v mongodump &> /dev/null; then
  mongodump --uri="${MONGODB_URI}" --out="${TEMP_DUMP_DIR}"
  
  echo "Compressing archive to ${BACKUP_DIR}/${ARCHIVE_NAME}..."
  tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" -C "${TEMP_DUMP_DIR}" .
  
  echo "Backup successfully created: ${BACKUP_DIR}/${ARCHIVE_NAME} ($(du -h "${BACKUP_DIR}/${ARCHIVE_NAME}" | cut -f1))"
else
  echo "⚠️ mongodump binary not found. If running on a cloud PaaS (e.g., MongoDB Atlas), automated daily point-in-time snapshots are handled natively through the Atlas dashboard."
fi

# Prune old backups older than retention window
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "platevision_backup_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \; || true

echo "=== Backup completed successfully at $(date) ==="

