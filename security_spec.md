# LevelFit Security Specification

## 1. Data Invariants
- **Identity Integrity**: Users can only read, create, update, or delete their own data under `/users/{userId}` and its subcollections.
- **Rule of Authenticity**: Any profile write must verify that the target `userId` matches the authenticated `request.auth.uid`.
- **Stat Immutable Fields**: Critical fields like `uid`, `email`, and `createdAt` cannot be modified after initial character creation.
- **Class Limitation**: RPG classes must strictly belong to the list `['Warrior', 'Mage', 'Assassin']`.
- **Workout Logic Limits**: Workout sets, reps, duration, intensity, and xpGained must be positive integers within normal bounds (e.g., intensity must be 1-5).
- **Time Validation**: Timestamp fields `createdAt` and `loggedAt` must enforce temporal consistency relative to the server time (`request.time`).

## 2. The "Dirty Dozen" Payloads (Zero-Trust Edge Cases)
The following payloads describe operations that are strictly forbidden. Any attempt to write these payloads MUST result in a `PERMISSION_DENIED` error:
1. **Identity Spoof**: Authenticated user `uid_alpha` tries to write a profile document `/users/uid_beta`.
2. **PII Leakage**: Guest user attempting a profile read of a user's confidential details.
3. **Privilege Escalation**: Modifying one's own level or total XP directly in user profile values bypassing exercise calculation.
4. **Class Poisoning**: Setting character class to "Overlord" or empty string when creating character profile.
5. **Junk ID Poisoning**: Creating long string paths or keys to spike database metrics.
6. **Negative Value Inject**: Submitting a workout log with `-10` sets or reps.
7. **Temporal Fraud**: Submitting a log claiming workout is logged in 2030 or 2012 instead of standard server time.
8. **Stat Alteration**: Modifying the original `createdAt` date during a profile update.
9. **Quest Spoofing**: Artificially completing a weekly quest document directly by writing `completed: true` instead of completing workout bounds.
10. **Cheat XP**: Writing a custom workout XP value, e.g. `xpGained: 1000000` for 1 set of 1 rep.
11. **Anonymity Injection**: Attempting writes using completely unverified emails when validation requires verification.
12. **System Orphan**: Injecting friend connections to unauthorized third party profiles.

## 3. Test Runner Strategy
- All reads and writes are tested via programmatic requests which verify matching `allow` behavior.
- Rules will be compiled and deployed via `deploy_firebase`.
