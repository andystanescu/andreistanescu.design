# Case-study passwords

Passwords are verified using bcrypt hashes. Passwords added after the reveal feature was introduced also have an AES-256-GCM encrypted copy, bound to the case-study ID, so an authenticated administrator can reveal them on request. The encryption key is derived from the existing session secret; the reveal response is not cached. Existing hash-only passwords still work but cannot be recovered and must be replaced to become revealable.

Keep the session secret stable and backed up separately from site data. If it changes, encrypted copies made with the old secret can no longer be revealed, but their bcrypt hashes continue to work for unlocking. Encrypted copies may also be unavailable after content transfer to a different installation or case-study ID; replace those passwords to make them revealable there.
