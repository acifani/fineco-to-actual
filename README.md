# fineco-to-actual

Import Fineco card movements to [Actual](https://actualbudget.org/).

This script will download the card movements from your Fineco account
and create corresponding transactions in a given Actual account.

As it uses the [import function](https://actualbudget.org/docs/transactions/importing#avoiding-duplicate-transactions),
it does a good job of deduplicating imported transactions,
so you should be able to run it as often as you want.

Why only the card movements? Because the other movements can be synced
through the [native GoCardless integration in Actual](https://actualbudget.org/docs/advanced/bank-sync/).

> ⚠️ This script is not battle tested and **it will break**! ⚠️

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
