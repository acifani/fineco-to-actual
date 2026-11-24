import api from '@actual-app/api';

const syncCard = process.env.SYNC_FINECO_CARD_ACCOUNT === 'true';
const syncBank = process.env.SYNC_FINECO_BANK_ACCOUNT === 'true';

export const requiredEnv = [
  'ACTUAL_SERVER_URL',
  'ACTUAL_PASSWORD',
  'ACTUAL_BUDGET_SYNC_ID',
  ...(syncCard ? ['ACTUAL_CARD_ACCOUNT_ID'] : []),
  ...(syncBank ? ['ACTUAL_BANK_ACCOUNT_ID'] : []),
];

export async function addToActual({ cardMovements, accountMovements }) {
  console.log();
  return initActual()
    .then(() => mapMovementsToTransactions(cardMovements))
    .then(createCardTransactions)
    .then(() => mapMovementsToTransactions(accountMovements))
    .then(createBankTransactions)
    .finally(api.shutdown);
}

async function initActual() {
  await api.init({
    dataDir: './data',
    serverURL: process.env.ACTUAL_SERVER_URL,
    password: process.env.ACTUAL_PASSWORD,
  });

  await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID);
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
  if (!syncCard) {
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
  if (!syncBank) {
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
