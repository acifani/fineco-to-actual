# fineco-to-actual

Import Fineco account movements to [Actual](https://actualbudget.org/).

This script will download the account movements from your Fineco account
and create corresponding transactions in the configured Actual accounts.

As it uses the [import function](https://actualbudget.org/docs/transactions/importing#avoiding-duplicate-transactions),
it does a good job of deduplicating imported transactions,
so you should be able to run it as often as you want.

You can choose to sync card movements, account movements, or both.

## Running

```shell
git clone https://github.com/acifani/fineco-to-actual.git
pnpm install
```

Some environment variables are required, you can find them in `.env.sample`.
You can create a .env file or export them to your shell manually.

```shell
# Use native nodejs .env loader (requires v20.6.0+)
node --env-file=.env ./fineco-to-actual.js

# or export them on your shell however you want
export FINECO_USER_ID=12345678
export ...

node ./fineco-to-actual.js
```
