#!/usr/bin/env python3
"""
Ghost Data Still Exists - Deletion Audit Engine
HackerRank Orchestrate October 2026
"""

import csv
import json
import os
import re
from datetime import datetime

# Operation ordering rules per problem statement
FINDING_ORDER = [
    "REPORT_REMAINING_RECORD",
    "REPORT_EXPOSED_PII",
    "REPORT_ACTIVE_DATA_FLOW",
    "REPORT_RESTORE_RISK"
]

REMEDIATION_ORDER = [
    "DISABLE_DATA_FLOW",
    "BLOCK_RESTORE",
    "DELETE_RECORD",
    "REDACT_RECORD",
    "ANONYMIZE_RECORD"
]

VERIFICATION_ORDER = [
    "VERIFY_RECORD_ABSENT",
    "VERIFY_RECORD_PRESENT",
    "VERIFY_RECORD_REDACTED",
    "VERIFY_RECORD_ANONYMIZED",
    "VERIFY_DATA_FLOW_DISABLED",
    "VERIFY_RESTORE_BLOCKED"
]

def load_data(base_dir="dataset"):
    # 1. Identities
    identities_by_user = {}
    user_by_email = {}
    with open(os.path.join(base_dir, "user_identities.csv"), mode='r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            uid = row['user_id']
            identities_by_user[uid] = {
                'user_id': uid,
                'name': row['name'],
                'email': row['email'].strip().lower(),
                'phone': row['phone'],
                'email_hash': row['email_hash'],
                'updated_at': row['updated_at']
            }
            user_by_email[row['email'].strip().lower()] = uid

    # 2. Audit log
    audit_history = {} # uid -> list of audit events
    with open(os.path.join(base_dir, "user_audit_log.csv"), mode='r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            uid = row['user_id']
            if uid not in audit_history:
                audit_history[uid] = []
            audit_history[uid].append(row)
            if row['field_name'] == 'email' and row['old_value']:
                user_by_email[row['old_value'].strip().lower()] = uid

    # 3. Evidence manifest
    evidence_files = {}
    with open(os.path.join(base_dir, "evidence_files.csv"), mode='r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            evidence_files[row['file_id']] = {
                'file_id': row['file_id'],
                'file_path': os.path.join(base_dir, row['file_path']),
                'origin': row['origin'],
                'captured_at': row['captured_at']
            }

    # 4. Deletion rules
    rules = []
    with open(os.path.join(base_dir, "deletion_rules.csv"), mode='r', encoding='utf-8') as f:
        rules = list(csv.DictReader(f))

    return identities_by_user, user_by_email, audit_history, evidence_files, rules

def is_deletion_request(text):
    """
    Determines whether request_text authorizes deletion or is non-deletion (NOT_APPLICABLE).
    """
    t = text.lower()

    # Explicit non-deletion intents where deletion is NOT requested
    non_deletion_patterns = [
        r"portable format",
        r"download my account information",
        r"download my data.*keep the account",
        r"leave my profile",
        r"keep the account as it is",
        r"copy of last year's invoices.*leave my profile",
        r"need a copy of.*leave my",
        r"access to.*information.*without making changes",
        r"rectify my address",
        r"update my phone number.*keep",
        r"marketing opt-out.*keep my account",
        r"marketing emails only.*do not delete",
        r"unsubscribe from marketing.*keep profile"
    ]
    for p in non_deletion_patterns:
        if re.search(p, t):
            return False

    # Deletion keywords in multiple languages (EN, ES, FR, etc.)
    deletion_keywords = [
        "delete", "deletion", "erased", "erase", "erasure", "remove", "closed", "close",
        "eliminar", "eliminación", "suppression", "supprimer", "löschen", "cancella",
        "purge", "de-identify", "forget", "destroy"
    ]
    has_del = any(k in t for k in deletion_keywords)
    return has_del

print("Audit engine helper initialized.")
