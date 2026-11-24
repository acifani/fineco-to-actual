export const requiredEnv = ['FINECO_USER_ID', 'FINECO_PASSWORD'];

export async function getFinecoMovements() {
  return login(process.env.FINECO_USER_ID, process.env.FINECO_PASSWORD)
    .then(ensureOk)
    .then(extractSessionID)
    .then(getMovements)
    .then(filterCardMovements)
    .catch(logErrorAndExit);
}

async function login(userId, password) {
  return fetch(
    'https://public-api.finecobank.com/v1/public/authentications/web/login',
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        origin: 'https://it.finecobank.com',
        referer: 'https://it.finecobank.com',
      },
      body: JSON.stringify({ userId, password }),
    },
  );
}

async function ensureOk(res) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.url} failed with status ${res.status}: ${body}`);
  }
  return res;
}

async function extractSessionID(res) {
  const cookies = res.headers.getSetCookie();
  return cookies
    .find((c) => c.startsWith('gsessionid'))
    ?.split(';')?.[0]
    ?.split('=')?.[1];
}

async function getMovements(gsessionid) {
  if (!gsessionid) {
    throw new Error('No session ID found, cannot get movements');
  }

  const now = Date.now();
  const dateFrom =
    process.env.FINECO_DATE_FROM ||
    toFinecoDate(new Date(now - 30 * 24 * 60 * 60 * 1000));
  const dateTo = process.env.FINECO_DATE_TO || toFinecoDate(new Date(now));

  console.log(`Import transaction from ${dateFrom} to ${dateTo}`);

  return fetch(
    'https://private-api.finecobank.com/v2/private/accounts-and-cards/movements',
    {
      method: 'POST',
      headers: {
        cookie: `gsessionid=${gsessionid};`,
        'content-type': 'application/json',
        'x-account-index': '0',
        'x-dossier-index': '0',
      },
      body: JSON.stringify({
        dateFrom,
        dateTo,
        offset: 0,
        limit: 999,
        keyword: '',
        type: ['MOVIMENTO_CARTE', 'TRADING'],
      }),
    },
  )
    .then(ensureOk)
    .then((res) => res.json())
    .then((m) => {
      if (!m.movimenti) {
        throw new Error('No movements found in response: ' + JSON.stringify(m));
      }
      return m.movimenti;
    });
}

const romeDateFormat = new Intl.DateTimeFormat('en', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toFinecoDate(date) {
  const { year, month, day } = Object.fromEntries(
    romeDateFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${year}-${month}-${day}`;
}

function filterCardMovements(movements) {
  const cardMovements = movements.filter(
    (m) => m.tipoMovimento === 'MOVIMENTO_CARTE',
  );
  const accountMovements = movements.filter(
    (m) => m.tipoMovimento === 'MOVIMENTO_CONTO',
  );

  console.log(
    `Found ${movements.length} movements, of which ${cardMovements.length} are from card`,
  );

  return { cardMovements, accountMovements };
}

function logErrorAndExit(err) {
  console.error('Error fetching Fineco movements', err);
  process.exit(1);
}
