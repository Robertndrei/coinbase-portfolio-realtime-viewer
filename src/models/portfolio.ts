import { Currencies, Currency } from './currencies';
import { terminal as term } from 'terminal-kit';

/**
 * Portfolio
 */
export class Portfolio {

   /**
    * Coins array
    */
   private _coins: Coin[] = [];

   /**
    * Portfolio USD worth
    */
   private _total_usd_worth: number;

   /**
    * Portfolio EUR worth
    */
   private _total_eur_worth: number;

   /**
    * Actual currency base
    */
   private _base: string;

   /**
    * Currencies
    */
   private _currencies: Currencies;

   constructor( 
      base,
      currencies: Currencies
   ) {
      this._base = base;
      this._currencies = currencies;
   }

   /**
    * Insert or update a coin in the coins list
    * 
    * @param {Coin} coin Coin to be inserted or updated
    */
   update( coin: Coin ) {
      if ( coin !== undefined ) {
         const found = this._coins.findIndex(c => c.id === coin.id);

         if ( found !== -1 ) {
            this._coins[found].update(coin);
         } else {
            this._coins.push(coin);
         }

         this.calculateWorth();
      }
   }

   /**
    * Gets a list of ticker ids from current coins
    * 
    * @return {string[]} Array of ticker ids
    */
   getTickersId(): string[] {
      return this._coins.map(coin => coin.ticker_id);
   }

   /**
    * Calculate total worth and worth of each coin
    */
   calculateWorth() {
      let usd_worth = 0;
      let eur_worth = 0;

      this._coins.forEach(coin => {
         const currency = this._currencies.currencies.filter(currency => currency.product_id === coin.ticker_id)[0];
         const eurUsdCurrency = this._currencies.currencies.filter(currency => currency.product_id === 'EUR-USD')[0];
         coin.calculateWorth(currency, eurUsdCurrency);

         coin.usd_worth !== undefined ? usd_worth += coin.usd_worth : null;
         coin.eur_worth !== undefined ? eur_worth += coin.eur_worth : null;
      })

      this._total_usd_worth = usd_worth;
      this._total_eur_worth = eur_worth;
   }

   /**
    * Output portfolio to terminal
    */
   print() {
      term.clear();

      term.moveTo(2, 2);
      term.italic("TOTAL BALANCE");
      term.moveTo(4, 4);
      term("USD: ")
      this._total_usd_worth !== undefined ? term.bold("^g" + this._total_usd_worth.toFixed(2) + " $") : null;
      term.moveTo(4, 5);
      term("EUR: ")
      this._total_eur_worth !== undefined ? term.bold("^g" + this._total_eur_worth.toFixed(2) + " €") : null;

      term.moveTo(2, 8);
      term.italic("COINS");

      let i = 0;
      this._coins.forEach(coin => {
         term.moveTo(4, i + 10);
         if ( coin.eur_worth !== undefined ) {
            term.bold(coin.currency)
            term.moveTo(6, i + 1 + 10);
            term("Quantity: ");
            term.bold("^y" + coin.balance);
            term.moveTo(6, i + 2 + 10);
            term("USD: ");
            coin.usd_worth !== undefined ? term.bold("^g" + coin.usd_worth.toFixed(2) + " $") : null;
            term.moveTo(6, i + 3 + 10);
            term("EUR: ");
            coin.eur_worth !== undefined ? term.bold("^g" + coin.eur_worth.toFixed(2) + " €") : null;
         }

         i = i + 5;
      })
   }
}

/**
 * Coin
 */
export class Coin {
   private _id: string;
   private _currency: string;
   private _balance: number;
   private _ticker_id: string;
   private _usd_worth: number;
   private _eur_worth: number;

   constructor(
      id: string,
      currency: string,
      balance: number,
      usd_worth?: number,
      eur_worth?: number,
   ) {
      this._id = id;
      this._currency = currency;
      this._balance = balance;
      this._ticker_id = currency + '-USD';
      this._usd_worth = usd_worth;
      this._eur_worth = eur_worth;
   }

   get id(): string {
      return this._id;
   }
   get currency(): string {
      return this._currency;
   }
   get balance(): number {
      return this._balance;
   }
   get ticker_id(): string {
      return this._ticker_id;
   }
   get usd_worth(): number {
      return this._usd_worth;
   }
   get eur_worth(): number {
      return this._eur_worth;
   }

   /**
    * Update this coin data
    * 
    * @param {Coin} coin Coin data
    */
   update( coin: Coin ) {
      this._currency = coin._currency;
      this._balance = coin._balance;
      this._ticker_id = coin._currency + '-USD';
   }

   /**
    * Calculates USD and EUR worth of this coin
    * 
    * @param {Currency} currency Coin to USD exchange rate
    * @param {Currency} eurUsdCurrency EUR to USD exchange rate to calculate
    * EUR worth
    */
   calculateWorth( currency: Currency, eurUsdCurrency?: Currency ) {
      if ( currency !== undefined ) {
         this._usd_worth = currency.price * this._balance;
      }

      if ( eurUsdCurrency !== undefined ) {
         this._eur_worth = this._usd_worth / eurUsdCurrency.price;
      }
   }
}
