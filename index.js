let Wormhole = require('wormholecash/lib/Wormhole').default;
let wormhole = new Wormhole({
    restURL: 'https://wormholecash-staging.herokuapp.com/v1/'
});

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let bb = new BITBOXCli({
  restURL: "https://trest.bitcoin.com/v1/"
});

const wif = 'cP4sbeU2x2QULPSXoLrMS7uMxkQGGPM86hnaDGG3GaQ4azpeLsfG'
const addr = 'mtoRifPpjuNkPTfD2kVfQvzLSRvUrGNv8V'
const bchAddr = bb.Address.toCashAddress(addr);

const toAddr = bb.Address.toCashAddress('mhmn6Hkew5VJYbmMg7NHUonfNysViM3LWX');




// checkBalance()
// .then(balances => {
//     console.log(JSON.stringify(balances));
// })

sendTokens()
.then(tx => {
    console.log(tx);
})
.catch(err => {
    console.log(err)
})

// issueToken()
// .then(tx => {
//     console.log(tx);
// })
// .catch(err => {
//     console.log(err)
// })

async function sendTokens() {
    let ssPayload = await wormhole.PayloadCreation.simpleSend(214, "2000.5");
    let utxo = await bb.Address.utxo([bchAddr]);
    let rawTx = await wormhole.RawTransactions.create([utxo[0][1]], {});
    let opReturn = await wormhole.RawTransactions.opReturn(rawTx, ssPayload);
    let ref = await wormhole.RawTransactions.reference(opReturn, toAddr);
    let changeHex = await wormhole.RawTransactions.change(ref, [utxo[0][1]], bchAddr, 0.0006);
    let tx = bb.Transaction.fromHex(changeHex);
    let tb = bb.Transaction.fromTransaction(tx);

    const ecPair = bb.ECPair.fromWIF(wif);
    let redeemScript;
    tb.sign(0, ecPair, redeemScript, 0x01, utxo[0][1].satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    return await bb.RawTransactions.sendRawTransaction(txHex);
}

async function issueToken() {
    let fixed = await wormhole.PayloadCreation.fixed(1, 2, 0, "Finance", "Money Transmission", "Test Token", "www.sambengtson.com", "Test Token", "1000000");
    let utxo = await bb.Address.utxo([bchAddr]);
    utxo[0][0].value = utxo[0][0].amount;
    let rawTx = await wormhole.RawTransactions.create([utxo[0][0]], {});
    let opReturn = await wormhole.RawTransactions.opReturn(rawTx, fixed);
    let ref = await wormhole.RawTransactions.reference(opReturn, bchAddr);
    let changeHex = await wormhole.RawTransactions.change(ref, [utxo[0][0]], bchAddr, 0.0001);

    let tx = wormhole.Transaction.fromHex(changeHex)
    let tb = wormhole.Transaction.fromTransaction(tx)

    const ecPair = bb.ECPair.fromWIF(wif);
    let redeemScript;
    tb.sign(0, ecPair, redeemScript, 0x01, utxo[0][0].satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    
    const txId = await bb.RawTransactions.sendRawTransaction(txHex)
    return txId;
}

async function checkBalance() {
    let balances = await wormhole.DataRetrieval.balancesForAddress(bchAddr);
    return balances;
}