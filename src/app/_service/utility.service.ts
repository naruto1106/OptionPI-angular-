import { Injectable } from '@angular/core';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { ConfigService } from 'src/app/common/config.service'
import { OptionsService } from 'src/app/_service/options.service';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { OptionsParameter } from 'src/app/interface/options-parameter';
import { StrategyExpiryParameter } from 'src/app/interface/strategy-expiry-parameter';
import { TargetVariable } from 'src/app/interface/target-variable';
import { OrderType } from 'src/app/interface/order-type';
import { Observable, of } from 'rxjs';
import { ParsedOption } from '../interface/parsed-option';

@Injectable({
    providedIn: 'root'
})
export class UtilityService {
    constructor(private configService: ConfigService,
      private optionsService: OptionsService) {        
    }

    getStrategySelections() : OptionsStrategy[] {
        return [{
            Id: 0,
            Name: "IronCondor",
            Display: "Iron Condor"
          }, {
            Id: 1,
            Name: "Straddle",
            Display: "Straddle"
          }, {
            Id: 2,
            Name: "BullCallSpread",
            Display: "Bull Call Spread"
          }, {
            Id: 3,
            Name: "BearCallSpread",
            Display: "Bear Call Spread"
          }, {
            Id: 4,
            Name: "BullPutSpread",
            Display: "Bull Put Spread"
          },{
            Id: 5,
            Name: "BearPutSpread",
            Display: "Bear Put Spread"
          }, {
            Id: 6,
            Name: "DeltaNeutral",
            Display: "Delta Neutral"
          }, {
            Id: 7,
            Name: "CalendarPutSpread",
            Display: "Calendar Put Spread"
          }, {
            Id: 8,
            Name: "CalendarCallSpread",
            Display: "Calendar Call Spread"
          }, {
            Id: 9,
            Name: "BrokenWingButterflyWithCall",
            Display: "Broken Wing Butterfly with Call"
          }, {
            Id: 10,
            Name: "CallRatioBackSpread",
            Display: "Call Ratio Back Spread"
          }];
    }

    getStrategyExpiryParameters() : StrategyExpiryParameter[] {
        return [{
          Value: 3,
          Name: "3 Weeks"
        }, {
          Value: 4,
          Name: "4 Weeks"
        }, {
          Value: 5,
          Name: "5 Weeks"
        }, {
          Value: 6,
          Name: "6 Weeks"
        }, {
          Value: 7,
          Name: "7 Weeks"
        }, {
          Value: 8,
          Name: "8 Weeks"
        }, {
          Value: 9,
          Name: "9 Weeks"
        }, {
          Value: 10,
          Name: "10 Weeks"
        }, {
          Value: 11,
          Name: "11 Weeks"
        }, {
          Value: 12,
          Name: "12 Weeks"
        }];
    }

    getCalendarSpreadExpiryParameters() : StrategyExpiryParameter[] {
      return [{
        Value: 3,
        Name: "3 Weeks"
      }, {
        Value: 4,
        Name: "4 Weeks"
      }, {
        Value: 5,
        Name: "5 Weeks"
      }, {
        Value: 6,
        Name: "6 Weeks"
      }, {
        Value: 7,
        Name: "7 Weeks"
      }, {
        Value: 8,
        Name: "8 Weeks"
      }];
    }

    getOptionParameters(optionStrategy: string) : OptionsParameter[] {
      switch (optionStrategy) {
        case "IronCondor":
          return [{
            Id: 0,
            Name: "DefaultSetup",
            Display: "Default Setup"
          }, {
            Id: 1,
            Name: "IronCondorLegDistance",
            Display: "Leg Distance"
          }, {
            Id: 2,
            Name: "BreakEvenRegion",
            Display: "Break Even Region"
          }];
        case "CalendarPutSpread":
        case "CalendarCallSpread":  
        case "CallRatioBackSpread":  
          return [{
            Id: 0,
            Name: "DefaultSetup",
            Display: "Default Setup"
          }, {
            Id: 1,
            Name: "CustomSetup",
            Display: "Custom Setup"
          }];
        case "BrokenWingButterflyWithCall":
            return [{
              Id: 0,
              Name: "DefaultSetup",
              Display: "Default Setup"
            }, {
              Id: 1,
              Name: "BrokenWingButterflyLegDistance",
              Display: "Leg Distance"
            }];
        default: 
          return [{
            Id: 0,
            Name: "DefaultSetup",
            Display: "Default Setup"
          }];
      }      
    }

    getNumberOfLegs(optionStrategy: string) : number {
      switch (optionStrategy) {
        case "IronCondor":
          return 4;
        case "Straddle":
        case "BullCallSpread":
        case "BearCallSpread":
        case "BullPutSpread":
        case "BearPutSpread":
        case "CalendarPutSpread":
        case "CalendarCallSpread":
        case "CallRatioBackSpread":
          return 2;  
        case "BrokenWingButterflyWithCall":
          return 3;
        default:
          return 1;
      }      
    }

    getAnalyticsTargetVariables() : TargetVariable[] {
      return [{
        Id: 0,
        Name: "Payoff",
        Display: "Payoff"
      }, {
        Id: 1,
        Name: "OptionPrice",
        Display: "Option Price"
      }, {
        Id: 2,
        Name: "Delta",
        Display: "Delta"
      }, {
        Id: 3,
        Name: "Vega",
        Display: "Vega"
      }, {
        Id: 4,
        Name: "DeltaOfTheta",
        Display: "Delta / Theta"
      },{
        Id: 5,
        Name: "DeltaOfVega",
        Display: "Delta / Vega"
      }, {
        Id: 6,
        Name: "VegaOfTheta",
        Display: "Vega / Theta"
      }]
    }

    getOrderTypeSelections() : OrderType[] {
      return [{
        Id: 0,
        Name: "Limit",
        Display: "Limit"
      }, {
        Id: 1,
        Name: "Market",
        Display: "Market"
      }, {
        Id: 2,
        Name: "Stop",
        Display: "Stop"
      }];
    }

    getUnitTypeSelections() {
      return [{
        Id: 0,
        Name: "Unit",
        Display: "Unit"
      }, {
        Id: 1,
        Name: "Lot",
        Display: "Lot"
      }, {
        Id: 2,
        Name: "KLot",
        Display: "KLot"
      }]
    }

    getIVPredictionSelections() : OptionsStrategy[] {
      return [{
        Id: 0,
        Name: "Any",
        Display: "Any"
      }, {
        Id: 1,
        Name: "Up",
        Display: "Up"
      }, {
        Id: 2,
        Name: "Down",
        Display: "Down"
      }, {
        Id: 3,
        Name: "None",
        Display: "None"
      }];
    }

    getStockPredictionSelections() : OptionsStrategy[] {
      return [{
        Id: 0,
        Name: "Any",
        Display: "Any"
      }, {
        Id: 1,
        Name: "Sideways",
        Display: "Sideways"
      }, {
        Id: 2,
        Name: "Breakout",
        Display: "Breakout"
      }, {
        Id: 3,
        Name: "LessBullish",
        Display: "Less Bullish"
      }, {
        Id: 4,
        Name: "Bullish",
        Display: "Bullish"
      }, {
        Id: 5,
        Name: "Volatile",
        Display: "Volatile"
      }, {
        Id: 6,
        Name: "None",
        Display: "None"
      }];
    }

    parseStrikePrice(strikePrice: number) {
        function zeroPad(num: number, places: number) {
          var zero = places - num.toString().length + 1;
          return Array(+(zero > 0 && zero)).join("0") + num;
        }
        function addTrailingZeros(num: string, totalLength: number) {
          return String(num).padEnd(totalLength, '0');
        }
    
        var numeric = Math.floor(strikePrice);
        var decimals = strikePrice - numeric;
    
        if (decimals > 0) {
          var decimalPlaces = strikePrice.toString().split('.')[1].length;
          return zeroPad(numeric, 5) + addTrailingZeros(decimals.toFixed(decimalPlaces), 3);
        } else {
          return zeroPad(numeric, 5) + addTrailingZeros("0", 3);
        }
      }

    getStockTickSize(price: number, isIncrement: boolean) {
        var step;
        if (price > 1) {
            step = 0.01;
        }
        else if (price === 1) {
            if (isIncrement) {
                step = 0.01;
            } else {
                step = 0.0001;
            }
        }
        else {
            step = 0.0001;
        }        
        return step;
    }

    getOptionTickSize(price: number, isIncrement: boolean) {
        var step;
        if (price > 3) {
            step = 0.1;
        }
        else if (price === 3) {
            if (isIncrement) {
                step = 0.1;
            } else {
                step = 0.05;
            }
        }
        else {
            step = 0.05;
        }        
        return step;
    }

    getSampleContractOld(optionStrategy: string, symbol: string, currentPrice: number) {
      switch (optionStrategy) {
        case "IronCondor":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: 220,
            //StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: 220,
            //StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 0.62,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 1.01,
            StrikePrice: 225,
            //trikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Call',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 0.99,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 0.78,
            StrikePrice: 225,
            //StrikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Put',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 0.8,
            OrderType: 'Limit'
          }];
        case "Straddle":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.1,
            StrikePrice: 36.0,
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.6,
            StrikePrice: 36.0,
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-02',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
          // return [ {
          //   Symbol: symbol,
          //   Action: 'Buy',
          //   LimitPrice: 1.24,
          //   StrikePrice: Math.floor(currentPrice),
          //   Rights: 'Call',
          //   Direction: 'Long',
          //   Quantity: 1,
          //   Expiry: '2022-12-01',
          //   FairValue: 1.25,
          //   OrderType: 'Limit'
          // }, {
          //   Symbol: symbol,
          //   Action: 'Buy',
          //   LimitPrice: 0.56,
          //   StrikePrice: Math.floor(currentPrice),
          //   Rights: 'Put',
          //   Direction: 'Long',
          //   Quantity: 1,
          //   Expiry: '2022-12-01',
          //   FairValue: 0.62,
          //   OrderType: 'Limit'
          // }];
        case "BullCallSpread":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Call',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "BearCallSpread":
          return [ {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Call',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "BullPutSpread":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Put',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "BearPutSpread":
          return [ {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Put',
            Direction: 'Short',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "DeltaNeutral":
          return [{
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: 41,
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-23',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
            // return [{
            //   Symbol: symbol,
            //   Action: 'Buy',
            //   LimitPrice: 0.56,
            //   StrikePrice: Math.floor(currentPrice),
            //   Rights: 'Put',
            //   Direction: 'Long',
            //   Quantity: 1,
            //   Expiry: '2022-12-01',
            //   FairValue: 0.62,
            //   OrderType: 'Limit'
            // }];
        case "CalendarPutSpread":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Put',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-19-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "CalendarCallSpread":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-19-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }];
        case "BrokenWingButterflyWithCall":
          return [ {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 1.24,
            StrikePrice: Math.floor(currentPrice * 0.9),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 1.25,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Sell',
            LimitPrice: 0.56,
            StrikePrice: Math.floor(currentPrice),
            Rights: 'Call',
            Direction: 'Short',
            Quantity: 2,
            Expiry: '2022-12-01',
            FairValue: 0.62,
            OrderType: 'Limit'
          }, {
            Symbol: symbol,
            Action: 'Buy',
            LimitPrice: 0.32,
            StrikePrice: Math.floor(currentPrice * 1.1),
            Rights: 'Call',
            Direction: 'Long',
            Quantity: 1,
            Expiry: '2022-12-01',
            FairValue: 0.34,
            OrderType: 'Limit'
          }];
        default:
          return [];
      }
    }

    getSampleContract(optionStrategy: string, symbol: string, currentPrice: number) : Observable<any[]> {
      return this.optionsService.getExpiryDates(symbol).pipe(mergeMap(optExpiry => {
        var lastExpiryDate = optExpiry.ExpiryDates.slice(-1)[0];
        return this.optionsService.getOptionChain(symbol, lastExpiryDate).pipe(mergeMap(value => {
          var strikePrices = value.map(x => x.StrikePrice);

          var closestStrike = strikePrices.reduce(function(prev, curr) {
            return (Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev);
          })
          var closestIndex = strikePrices.indexOf(closestStrike);

          switch (optionStrategy) {   
            case "IronCondor":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex-1].Put.Ask,
                StrikePrice: strikePrices[closestIndex-1],
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex-1].Put.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex].Put.Bid,
                StrikePrice: strikePrices[closestIndex],
                Rights: 'Put',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Bid,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex+1].Call.Bid,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Call',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Call.Bid,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex+2].Call.Ask,
                StrikePrice: strikePrices[closestIndex+2],
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+2].Call.Ask,
                OrderType: 'Limit'
              }]);
            case "Straddle":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Call.Ask,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Call.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Put.Ask,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Ask,
                OrderType: 'Limit'
              }]);
            case "BullCallSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Call.Ask,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Call.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex+1].Call.Bid,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Call',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Call.Bid,
                OrderType: 'Limit'
              }]);
            case "BearCallSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex].Call.Bid,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Call.Bid,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex+1].Call.Ask,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Call.Ask,
                OrderType: 'Limit'
              }]);
            case "BullPutSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Put.Ask,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex+1].Put.Bid,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Put',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Put.Bid,
                OrderType: 'Limit'
              }]);
            case "BearPutSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex].Put.Bid,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Short',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Bid,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex+1].Put.Ask,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Put.Ask,
                OrderType: 'Limit'
              }]);
            case "DeltaNeutral":
              return of([{
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Put.Ask,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Ask,
                OrderType: 'Limit'
              }]);
                // return [{
                //   Symbol: symbol,
                //   Action: 'Buy',
                //   LimitPrice: 0.56,
                //   StrikePrice: Math.floor(currentPrice),
                //   Rights: 'Put',
                //   Direction: 'Long',
                //   Quantity: 1,
                //   Expiry: lastExpiryDate,
                //   FairValue: 0.62,
                //   OrderType: 'Limit'
                // }];
            case "CalendarPutSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Put.Ask,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: optExpiry.DefaultExpiryDate,
                FairValue: value[closestIndex].Put.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Put.Ask,
                StrikePrice: closestStrike,
                Rights: 'Put',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Put.Ask,
                OrderType: 'Limit'
              }]);
            case "CalendarCallSpread":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Call.Ask,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: optExpiry.DefaultExpiryDate,
                FairValue: value[closestIndex].Call.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex].Call.Ask,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Call.Ask,
                OrderType: 'Limit'
              }]);
            case "BrokenWingButterflyWithCall":
              return of([ {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex-1].Call.Ask,
                StrikePrice: strikePrices[closestIndex-1],
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex-1].Call.Ask,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Sell',
                LimitPrice: value[closestIndex].Call.Bid,
                StrikePrice: closestStrike,
                Rights: 'Call',
                Direction: 'Short',
                Quantity: 2,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex].Call.Bid,
                OrderType: 'Limit'
              }, {
                Symbol: symbol,
                Action: 'Buy',
                LimitPrice: value[closestIndex+1].Call.Ask,
                StrikePrice: strikePrices[closestIndex+1],
                Rights: 'Call',
                Direction: 'Long',
                Quantity: 1,
                Expiry: lastExpiryDate,
                FairValue: value[closestIndex+1].Call.Ask,
                OrderType: 'Limit'
              }]);      
            case "CallRatioBackSpread":
                return of([ {
                  Symbol: symbol,
                  Action: 'Sell',
                  LimitPrice: value[closestIndex-1].Call.Bid,
                  StrikePrice: strikePrices[closestIndex-1],
                  Rights: 'Call',
                  Direction: 'Short',
                  Quantity: 1,
                  Expiry: lastExpiryDate,
                  FairValue: value[closestIndex-1].Call.Bid,
                  OrderType: 'Limit'
                }, {
                  Symbol: symbol,
                  Action: 'Buy',
                  LimitPrice: value[closestIndex].Call.Ask,
                  StrikePrice: closestStrike,
                  Rights: 'Call',
                  Direction: 'Long',
                  Quantity: 2,
                  Expiry: lastExpiryDate,
                  FairValue: value[closestIndex].Call.Ask,
                  OrderType: 'Limit'
                }]);      
            default:
              return [];
          }
        }));
      })); 
    }

    parseOption(option: string) : ParsedOption {
      const regexpression = /(\w{1,6})(\s)?(\d{6})([cp])(\d{5})(\d{3})/i
      const match = option.match(regexpression);
        
      var expiryDate = "20"+ match![3]
      var right = match![4]
      if (right == "P") {
        right = "Put"
      } else if (right == "C") {
        right = "Call"
      }
      var numericPart = match![5].replace(/^0+/, '');
      var decimalPart = match![6].replace(/0$/, '');
      var strikePrice = 0
      if (numericPart) {
        strikePrice += parseInt(numericPart);
      }
      if (decimalPart) {
        strikePrice += parseFloat(decimalPart) / Math.pow(10, decimalPart.length);
      }
        
      return {
        Symbol: match![1],
        Expiry: expiryDate,
        Right: right,
        StrikePrice: strikePrice
      }
    }
}
