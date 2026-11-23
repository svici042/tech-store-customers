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

The server runs at `http://localhost:3000`.

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

The database file and `node_modules` are excluded from Git.

I also ran `npm audit`.

The audit reported two moderate vulnerability findings related to Sequelize 6 and its `uuid` dependency.

I kept Sequelize 6 because this assignment uses the Sequelize v6 documentation. The dependency warning remains unresolved.

This project is intended for local learning and testing, not production use.