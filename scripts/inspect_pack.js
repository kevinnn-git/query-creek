async function check(pack) {
  const res = await fetch(`https://quaternius.trebeljahr.com/${pack}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log(pack, data.props.pageProps.modelUrls);
    return data.props.pageProps.modelUrls;
  }
}
async function run() {
  await check('modular_men_pack');
}
run();
