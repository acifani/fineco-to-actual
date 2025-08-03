import api from '@actual-app/api';

export async function addToActual({ cardMovements, accountMovements }) {
  console.log();
  return initActual(process.env.ACTUAL_SERVER_URL, process.env.ACTUAL_PASSWORD)
    .then(() => mapMovementsToTransactions(cardMovements))
    .then(createCardTransactions)
    .then(() => mapMovementsToTransactions(accountMovements))
    .then(createBankTransactions)
    .then(shutdown);
}

async function initActual(serverURL, password) {
  await api.init({
    dataDir: './data',
    serverURL,
    password,
  });

  await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID);
}

function mapMovementsToTransactions(movements) {
  return movements.map((m) => ({
    // Convert decimals to integer amount
    amount: Math.trunc(m.importo * 100),
    imported_payee: m.descrizione,
    payee_name: m.descrizione,
    notes: m.descrizione,
    date: m.dataOperazione,
  }));
}

async function createCardTransactions(transactions) {
  if (process.env.SYNC_FINECO_CARD_ACCOUNT !== 'true') {
    console.log(
      "Skipping card account as SYNC_FINECO_CARD_ACCOUNT is not set to 'true'",
    );
    return;
  }

  console.log('Importing card account movements...');
  return api.importTransactions(
    process.env.ACTUAL_CARD_ACCOUNT_ID,
    transactions,
  );
}

async function createBankTransactions(transactions) {
  if (process.env.SYNC_FINECO_BANK_ACCOUNT !== 'true') {
    console.log(
      "Skipping bank account as SYNC_FINECO_BANK_ACCOUNT is not set to 'true'",
    );
    return;
  }

  console.log('Importing bank account movements...');
  return api.importTransactions(
    process.env.ACTUAL_BANK_ACCOUNT_ID,
    transactions,
  );
}

async function shutdown() {
  return api.shutdown();
}
