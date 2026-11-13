const fs = require('fs');

async function checkPack(pack) {
  const res = await fetch(`https://quaternius.trebeljahr.com/${pack}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log(pack, data.props.pageProps.modelUrls);
  }
}

async function run() {
  await checkPack('fantasy_real_time_strategy');
}
run();
