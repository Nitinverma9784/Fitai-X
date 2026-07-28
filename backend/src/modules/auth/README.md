# Auth Module

## Purpose
Manages user authentication and account creation via password-hashing Pbkdf2 or Google OAuth 2.0.

## Routes
Mapped in `src/modules/auth/routes/auth.routes.ts`:
- `POST /signup`: Registers an email/password user context
- `POST /login`: Validates email credentials or creates standard email user
- `GET /google/url`: Constructs Google consent URL
- `GET /google/callback`: Performs Google code validation and token retrieval
- `POST /google/verify`: Authenticates Google ID Token inside request payload

## Structure
- **Controllers**:
  - `signup.controller.ts`
  - `login.controller.ts`
  - `googleUrl.controller.ts`
  - `googleCallback.controller.ts`
  - `googleVerify.controller.ts`
- **Services**:
  - `googleAuth.service.ts`
- **Utils**:
  - `auth.utils.ts`

## Flow
1. User requests Google login url or sends email registration parameters.
2. Controllers trigger validation and delegates authentication requests to `googleAuth.service.ts` or database repositories.
3. Cryptographic utilities sign a JSON Web Token and return it to the client.
