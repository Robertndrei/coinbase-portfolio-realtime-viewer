/**
 * Currencies
 */
export class Currencies {

   /**
    * Currencies array
    */
   private _currencies: Currency[] = [];

   /**
    * Actual EUR to USD exchange rate
    */
   private _eur_usd_price: number;

   constructor() {}

   /**
    * @ignore
    */
   get currencies(): Currency[] {
      return this._currencies;
   }

   /**
    * Insert or update a currency in the currencies list
    * 
    * @param {Currency} currency Currency to be inserted or updated
    */
   update( currency: Currency ) {
      if ( currency !== undefined ) {
         const found = this._currencies.findIndex(c => c.product_id === currency.product_id);

         if ( found !== -1 ) {
            this._currencies[found].update(currency);
         } else {
            this._currencies.push(currency);
         }

         this.generateEurUsdTicker();
      }
   }

   /**
    * Currency EUR-USD needs to be generated, this function calculates the
    * EUR to USD exchange rate from provided BTC-USD and BTC-EUR echange
    * rates
    */
   generateEurUsdTicker() {
      const btcUsdTicker = this._currencies.findIndex(c => c.product_id === 'BTC-USD');
      const btcEurTicker = this._currencies.findIndex(c => c.product_id === 'BTC-EUR');

      const eurUsdTicker = this._currencies.findIndex(c => c.product_id === 'EUR-USD');

      if ( btcUsdTicker !== -1 && btcEurTicker !== -1 ) {
         this._eur_usd_price = this._currencies[btcUsdTicker].price / this._currencies[btcEurTicker].price;

         if ( eurUsdTicker !== -1 ) {
            this._currencies[eurUsdTicker].update(
               new Currency(
                  'EUR-USD',
                  this._eur_usd_price
               )
            );
         } else {
            this._currencies.push(
               new Currency(
                  'EUR-USD',
                  this._eur_usd_price
               )
            );
         }
      }
   }
}

/**
 * Currency
 */
export class Currency {

   private _product_id: string;
   private _price: number;
   private _open_24h: number;
   private _volume_24h: number;
   private _low_24h: number;
   private _high_24h: number;
   private _volume_30d: number;
   private _best_bid: number;
   private _best_ask: number;

   constructor(
      product_id: string,
      price: number,
      open_24h?: number,
      volume_24h?: number,
      low_24h?: number,
      high_24h?: number,
      volume_30d?: number,
      best_bid?: number,
      best_ask?: number
   ) {
      this._product_id = product_id;
      this._price = price;
      this._open_24h = open_24h;
      this._volume_24h = volume_24h;
      this._low_24h = low_24h;
      this._high_24h = high_24h;
      this._volume_30d = volume_30d;
      this._best_bid = best_bid;
      this._best_ask = best_ask;
   }

   get product_id(): string {
      return this._product_id;
   }
   get price(): number {
      return this._price;
   }

   /**
    * Update this currency data
    * 
    * @param {Currency} currency Currency data
    */
   update( currency: Currency ) {
      this._price = currency._price;
      this._open_24h = currency._open_24h;
      this._volume_24h = currency._volume_24h;
      this._low_24h = currency._low_24h;
      this._high_24h = currency._high_24h;
      this._volume_30d = currency._volume_30d;
      this._best_bid = currency._best_bid;
      this._best_ask = currency._best_ask;
   }
}