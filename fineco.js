export async function getFinecoMovements() {
  return login(process.env.FINECO_USER_ID, process.env.FINECO_PASSWORD)
    .then(extractSessionID)
    .then(getMovements)
    .then(filterCardMovements)
    .catch(logErrorAndExit);
}

async function login(userId, password) {
  if (!userId || !password) {
    throw new Error(
      'Fineco user ID and password must be set in environment variables',
    );
  }

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

async function extractSessionID(res) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed with status ${res.status}, body: ${body}`);
  }

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

  const now = new Date();
  const dateFrom =
    process.env.FINECO_DATE_FROM ||
    toISO(new Date(now.setDate(now.getDate() - 30)));
  const dateTo = process.env.FINECO_DATE_TO || toISO(new Date());

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
    .then((res) => res.json())
    .then((m) => {
      if (!m.movimenti) {
        throw new Error('No movements found in response: ' + JSON.stringify(m));
      }
      return m.movimenti;
    });
}

function toISO(date) {
  return date.toISOString().split('T')[0];
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
