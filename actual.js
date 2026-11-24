import api from '@actual-app/api';

export async function addToActual({ cardMovements, accountMovements }) {
  console.log();
  await api.init({
    dataDir: './data',
    serverURL: process.env.ACTUAL_SERVER_URL,
    password: process.env.ACTUAL_PASSWORD,
  });

  try {
    await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID);
    await createCardTransactions(mapMovementsToTransactions(cardMovements));
    await createBankTransactions(mapMovementsToTransactions(accountMovements));
  } finally {
    await api.shutdown();
  }
}

function mapMovementsToTransactions(movements) {
  return movements.map((m) => ({
    amount: api.utils.amountToInteger(m.importo),
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
