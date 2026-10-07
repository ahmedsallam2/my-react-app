# My Todos: Full-Stack React App on AWS Amplify Gen 2

A full-stack serverless todo application built with **React (Vite)** and **AWS Amplify Gen 2**.
Users sign up and log in, manage their own private todo list, attach files to todos, and call a custom AWS Lambda function. The app is deployed with CI/CD from GitHub to two separate environments: **dev** and **main** (production).

---

## Live Environments

| Environment | Git branch | URL |
|---|---|---|
| Production | `main` | https://main.dpt1pbssufbd8.amplifyapp.com |
| Development | `dev` | https://dev.dpt1pbssufbd8.amplifyapp.com |

Each environment has its **own isolated backend** (separate users, database, storage and functions).

---

## Features

- **Authentication**: sign up, email verification, sign in and sign out (Amazon Cognito)
- **Private todos**: each user only sees and edits their own todos (owner-based authorization)
- **Full CRUD**: add, edit (inline), mark as done and delete todos
- **Real-time updates**: the list refreshes automatically when data changes
- **File attachments**: attach any file or image to a todo, stored privately per user in Amazon S3
- **Custom Lambda function**: a `sayHello` query that runs server-side on AWS Lambda
- **Timestamps**: shows when each todo was added or last edited
- **CI/CD**: every `git push` automatically builds and deploys the matching environment

---

## Architecture

```
                 ┌────────────────────────────┐
                 │   React app (Vite)         │
                 │   Hosted on Amplify        │
                 └─────────────┬──────────────┘
                               │
          ┌────────────────────┼─────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
 ┌─────────────────┐  ┌─────────────────┐   ┌─────────────────┐
 │ Amazon Cognito  │  │  AWS AppSync    │   │   Amazon S3     │
 │ (Auth / users)  │  │ (GraphQL API)   │   │ (File storage)  │
 └─────────────────┘  └───────┬─────────┘   └─────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ Amazon DynamoDB │       │   AWS Lambda    │
        │  (Todo table)   │       │   (sayHello)    │
        └─────────────────┘       └─────────────────┘
```

The frontend never talks to DynamoDB or Lambda directly. All data requests go through the **AppSync API**, which enforces authorization rules.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| UI components | `@aws-amplify/ui-react` (Authenticator) |
| Backend framework | AWS Amplify Gen 2 (code-first, TypeScript) |
| Auth | Amazon Cognito |
| API | AWS AppSync (GraphQL) |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| Functions | AWS Lambda (Node.js) |
| Hosting & CI/CD | AWS Amplify Hosting + GitHub |

---

## Project Structure

```
my-react-app/
├── amplify/                      # Backend (infrastructure as code)
│   ├── auth/
│   │   └── resource.ts           # Cognito config (email login)
│   ├── data/
│   │   └── resource.ts           # Todo model + sayHello query + auth rules
│   ├── functions/
│   │   └── say-hello/
│   │       ├── resource.ts       # Lambda definition
│   │       └── handler.ts        # Lambda code
│   ├── storage/
│   │   └── resource.ts           # S3 bucket + per-user access rules
│   └── backend.ts                # Registers all backend resources
├── src/
│   ├── App.jsx                   # UI: auth, todos, file upload, Lambda call
│   ├── App.css                   # Styles
│   ├── index.css                 # Global reset
│   └── main.jsx                  # Entry point + Amplify.configure()
├── amplify.yml                   # Amplify Hosting build settings
├── vite.config.js                # Vite config (ignores amplify folders)
├── package.json
└── README.md
```

> `amplify_outputs.json` is generated automatically (by the sandbox locally, or by the build pipeline in the cloud) and is **not committed** to Git.

---

## Data Model

**Todo** (DynamoDB table, owner-based access)

| Field | Type | Description |
|---|---|---|
| `id` | ID | Auto-generated |
| `content` | String | Todo text |
| `isDone` | Boolean | Completed or not |
| `fileKey` | String | S3 path of the attached file |
| `fileName` | String | Original file name (for display) |
| `owner` | String | Auto-set to the signed-in user |
| `createdAt` / `updatedAt` | DateTime | Auto-managed |

**sayHello** (custom query → Lambda)
- Input: `name: String`
- Output: `String` (a greeting plus the server timestamp)
- Access: any signed-in user

**S3 access rule**
- Path: `todo-files/{entity_id}/*`
- Each user can only read, write and delete files inside their own folder.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+ and npm
- Git
- An AWS account with an IAM user that has the **`AmplifyBackendDeployFullAccess`** policy
- An AWS CLI profile configured on your machine (for example `sallam-profile`)

### 1. Clone and install

```bash
git clone https://github.com/ahmedsallam2/my-react-app.git
cd my-react-app
git checkout dev
npm install
```

### 2. Start a personal cloud sandbox (terminal 1)

```bash
npx ampx sandbox --profile <your-aws-profile>
```

This deploys a private backend for you and writes `amplify_outputs.json`.
Keep it running: it redeploys automatically when you edit files in `amplify/`.

### 3. Run the frontend (terminal 2)

```bash
npm run dev
```

Open http://localhost:5173

---

## Development Workflow

```
 local code  ──►  sandbox (test locally)  ──►  push to dev  ──►  merge to main
                                               (dev env)          (production)
```

1. Always work on the **`dev`** branch.
2. Test locally with the **sandbox** and `npm run dev`.
3. Push to `dev`; Amplify deploys the **dev** environment automatically.
4. When dev is verified, merge into `main` to release to production:

```bash
git checkout main
git merge dev
git push
git checkout dev
```

---

## Deployment (Amplify Hosting)

The app is connected to GitHub in the **AWS Amplify Console**:

- Each connected branch gets its own frontend URL and its own backend stack.
- `main` is set as the **production branch**.
- Builds use `amplify.yml`:
  - **Backend phase:** `npm install` then `npx ampx pipeline-deploy`
  - **Frontend phase:** `npm run build` → publishes `dist/`
- A custom **service role** (trusted entity: Amplify, policy: `AmplifyBackendDeployFullAccess`) is used for deployments.

---

## Useful Commands

```bash
npm run dev                                   # start frontend locally
npx ampx sandbox --profile <profile>          # start personal cloud backend
npx ampx sandbox delete --profile <profile>   # delete your sandbox resources
npm run build                                 # production build into dist/
```
