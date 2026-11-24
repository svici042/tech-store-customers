# Tech Store Customers API

I built a simple REST API using Node.js, Express, Sequelize and SQLite. The application stores customer information in a local database.

## Technologies

- Node.js
- Express 5
- Sequelize 6
- SQLite
- Thunder Client for API testing

## Installation

Install the dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

The server listens on `http://127.0.0.1:3000` and is only accessible from your own computer.

## API Endpoints

### POST /customers

Registers a new customer.

Example JSON body:

```json
{
  "name": "Jonas Jonaitis",
  "email": "jonas@example.com"
}
```

Returns HTTP 201 when the customer is created.

Send both fields as JSON strings. The API trims whitespace, requires a name of 1–100 characters and an email of up to 254 characters in a basic email format. Invalid input and malformed JSON return HTTP 400.

### GET /customers

Returns all registered customers as a JSON array.

Returns HTTP 200 when successful.

## Database

I used SQLite with Sequelize to store customer information.

The Customer model contains:

- `id` – automatically generated primary key
- `name` – customer's full name
- `email` – customer's email address

Sequelize creates the database table automatically when the application starts.

The database is stored locally in `database.sqlite`.

## Testing

I tested the API using Thunder Client.

- POST /customers – 201 Created
- GET /customers – 200 OK
- New customers were saved successfully.
- Customer records were visible in DB Browser for SQLite.
- Data remained in the database after restarting the Express server.

All assignment requirements were tested successfully.

## Security

Git ignores the SQLite database and its sidecar files, `.env`, and `node_modules`.

Install Gitleaks and make sure it's on your PATH. Run this once in each clone to enable the Git hooks:

```bash
git config core.hooksPath .githooks
```

The hooks check staged changes before a commit and scan Git history before a push. A missing Gitleaks installation or a failed scan blocks the operation.

GitHub Actions scans Git history with Gitleaks and checks the lockfile with `npm run security:audit` on pull requests and pushes to `main`. The audit fails on moderate or higher findings.

Sequelize 6.37.8 still asks for `uuid@^8.3.2`. The npm override selects `uuid@11.1.1` for Sequelize to fix [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). This crosses Sequelize's declared version range. Review the override when updating Sequelize and remove it once Sequelize v6 declares a patched UUID dependency.

Run `npm ci` and then `npm test`. The tests check Sequelize's UUID defaults, query and transaction IDs, PostgreSQL delimiter generation, and UUID buffer boundaries. The customer API tests use a temporary SQLite database and a free port assigned by the operating system. They check validation and persistence after a restart.
