new Vue({
  el: "#vue",
  mixins: [windowMixin],
  data() {
    return {
      wallets: null,
      selectedWallet: null,
      balance: 0,
      accessToken: null,

      buy: {
        iban: null,
        bic: null,
        remittanceInfo: null,
        estimatedAmount: null,
        asset: null,
      },

      sell: {
        depositAddress: null,
        blockchain: null,
        paymentRequest: null,
        estimatedAmount: null,
        currency: null,
      },
    };
  },
  methods: {
    selectWallet() {
      this.reset();
      this.clearBuyAndSellInfo();
    },
    openPaymentWebsite() {
      this.clearBuyAndSellInfo();

      inkey = this.selectedWallet["inkey"];

      if (inkey) {
        LNbits.api
          .request("GET", `/dfxswiss/api/v1/encode_lndhub/${inkey}`)
          .then((response) => {
            this.signIn(response.data);
          })
          .catch((err) => {
            LNbits.utils.notifyApiError(err);
          });
      }
    },
    signIn(lndhubaddress) {
      LNbits.api
        .request("GET", `/dfxswiss/api/v1/signIn/${lndhubaddress}`)
        .then((response) => {
          this.accessToken = response.data.accessToken;
          this.getBalance();
        })
        .catch((err) => {
          LNbits.utils.notifyApiError(err);
        });
    },
    openInNewTab() {
      if (this.accessToken) {
        url = `https://payment.dfx.swiss/login?token=${this.accessToken}`;
        window.open(url, "_blank", "noreferrer");
      } else {
        LNbits.utils.notifyApiError("Cannot open payment website");
      }
    },
    getBalance() {
      inkey = this.selectedWallet["inkey"];

      if (inkey) {
        LNbits.api
          .request("GET", `/api/v1/wallet`, inkey)
          .then((response) => {
            this.balance = response.data.balance / 1000 / 100000000;
          })
          .catch((err) => {
            LNbits.utils.notifyApiError(err);
          });
      }
    },
    payInvoice(invoice) {
      if (invoice) {
        LNbits.api
          .payInvoice(this.selectedWallet, invoice)
          .then((response) => {
            // ...
            console.log("Pay Invoice Response: " + JSON.stringify(response));
          })
          .catch((err) => {
            LNbits.utils.notifyApiError(err);
            console.error("Pay Invoice Error: " + JSON.stringify(err));
          });
      }
    },
    messageReceived(event) {
      try {
        const transferData = JSON.parse(event.data);

        this.reset();

        const type = transferData.type;

        if (type === "buy") {
          this.buyMessageReceived(transferData);
        } else if (type === "sell") {
          this.sellMessageReceived(transferData);
        }
      } catch (e) {
        console.error(e);
      }
    },
    buyMessageReceived(transferData) {
      const buy = transferData.buy;

      if (buy) {
        this.buy.iban = buy.iban;
        this.buy.bic = buy.bic;
        this.buy.remittanceInfo = buy.remittanceInfo;
        this.buy.estimatedAmount = buy.estimatedAmount;
        this.buy.asset = buy.asset.name;
      }
    },
    sellMessageReceived(transferData) {
      const sell = transferData.sell;

      if (sell) {
        this.sell.depositAddress = sell.depositAddress;
        this.sell.blockchain = sell.blockchain;
        this.sell.paymentRequest = sell.paymentRequest;
        this.sell.estimatedAmount = sell.estimatedAmount;
        this.sell.currency = sell.currency.name;

        if (this.sell.paymentRequest) {
          this.payInvoice(this.sell.paymentRequest);
        }
      }
    },
    reset() {
      this.balance = 0;
      this.accessToken = null;
    },
    clearBuyAndSellInfo() {
      this.buy.iban = null;
      this.buy.bic = null;
      this.buy.remittanceInfo = null;
      this.buy.estimatedAmount = null;
      this.buy.asset = null;

      this.sell.depositAddress = null;
      this.sell.blockchain = null;
      this.sell.paymentRequest = null;
      this.sell.estimatedAmount = null;
      this.sell.currency = null;
    },
  },
  created() {
    window.addEventListener("message", this.messageReceived);

    this.wallets = this.g.user.wallets.map(LNbits.map.wallet).map((wallet) => ({
      label: wallet.name,
      inkey: wallet.inkey,
      adminkey: wallet.adminkey,
    }));

    this.selectedWallet = this.wallets[0];
  },
});
