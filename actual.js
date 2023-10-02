import api from '@actual-app/api';

export async function addToActual(movements) {
  return initActual(process.env.ACTUAL_SERVER_URL, process.env.ACTUAL_PASSWORD)
    .then(() => mapMovementsToTransactions(movements))
    .then(createTransactions)
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
    date: m.dataOperazione,
  }));
}

async function createTransactions(transactions) {
  return api.importTransactions(process.env.ACTUAL_ACCOUNT_ID, transactions);
}

async function shutdown() {
  return api.shutdown();
}
