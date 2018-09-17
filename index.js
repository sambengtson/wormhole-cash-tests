let Wormhole = require('wormholecash/lib/Wormhole').default;
let wormhole = new Wormhole({
    restURL: 'https://wormholecash-staging.herokuapp.com/v1/'
});

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let bb = new BITBOXCli({
  restURL: "https://trest.bitcoin.com/v1/"
});

const wif = ''
const bchAddr = '';

const toAddr = ''

checkBalance()
.then(balances => {
    console.log(JSON.stringify(balances));
})

// sendTokens()
// .then(tx => {
//     console.log(tx);
// })
// .catch(err => {
//     console.log(err)
// })

// issueToken()
// .then(tx => {
//     console.log(tx);
// })
// .catch(err => {
//     console.log(err)
// })

async function sendTokens() {
    let ssPayload = await wormhole.PayloadCreation.simpleSend(214, "100.25");
    let u = await bb.Address.utxo([bchAddr]);
    let utxo = findBiggestUtxo(u[0]);
    utxo.value = utxo.amount;

    let rawTx = await wormhole.RawTransactions.create([utxo], {});
    let opReturn = await wormhole.RawTransactions.opReturn(rawTx, ssPayload);
    let ref = await wormhole.RawTransactions.reference(opReturn, toAddr);
    
    let changeHex = await wormhole.RawTransactions.change(ref, [utxo], bchAddr, 0.0001);
    let tx = bb.Transaction.fromHex(changeHex);
    let tb = bb.Transaction.fromTransaction(tx);

    const ecPair = bb.ECPair.fromWIF(wif);
    let redeemScript;
    tb.sign(0, ecPair, redeemScript, 0x01, utxo.satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    return await bb.RawTransactions.sendRawTransaction(txHex);
}

async function issueToken() {
    let fixed = await wormhole.PayloadCreation.fixed(1, 1, 0, "Finance", "Money Transmission", "Test Token 2", "www.sambengtson.com", "Test Token 2", "1000000");
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

function findBiggestUtxo(utxos) {
    let largestAmount = 0;
    let largestIndex = 0;
  
    for (var i = 0; i < utxos.length; i++) {
      const thisUtxo = utxos[i];
  
      if (thisUtxo.satoshis > largestAmount) {
        largestAmount = thisUtxo.satoshis;
        largestIndex = i;
      }
    }
  
    return utxos[largestIndex];
  }