export async function getFinecoMovements() {
  return login(process.env.FINECO_USER_ID, process.env.FINECO_PASSWORD)
    .then(extractSessionID)
    .then(getMovements)
    .then(filterCardMovements);
}

async function login(userId, password) {
  return fetch(
    'https://public-api.finecobank.com/v1/public/authentications/web/login?sca=true',
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    },
  );
}

function extractSessionID(res) {
  const cookies = res.headers.getSetCookie();
  return cookies
    .find((c) => c.startsWith('gsessionid'))
    ?.split(';')?.[0]
    ?.split('=')?.[1];
}

async function getMovements(gsessionid) {
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
    .then((m) => m.movimenti);
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function filterCardMovements(movements) {
  const card = movements.filter((m) => m.tipoMovimento === 'MOVIMENTO_CARTE');
  console.log(
    `Found ${movements.length} movements, of which ${card.length} are from card`,
  );
  return card;
}
