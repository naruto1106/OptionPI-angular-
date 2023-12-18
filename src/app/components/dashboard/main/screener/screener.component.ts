import { Component, OnInit, Input, HostListener, ViewEncapsulation, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder, AbstractControl, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, delay, switchMap, tap, catchError, map, share, take, filter, distinctUntilChanged } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { IvPrediction } from 'src/app/interface/iv-prediction';
import { StockPricePrediction } from 'src/app/interface/stock-price-prediction';
import { ScreenerResult } from 'src/app/interface/options-screener-result';
import { OrderType } from 'src/app/interface/order-type';
import { UnitType } from 'src/app/interface/unit-type';
import { OptionSnapshot } from 'src/app/interface/option-snapshot';
import { PredefinedScreenerRequest } from 'src/app/interface/predefined-screener-request';
import { ExpiryDatesSelection } from 'src/app/interface/expiry-dates-selection';
import { ScreenerService } from './screener.service';
import { TradeService } from 'src/app/_service/trade.service';
import { CalculatorService } from 'src/app/_service/calculator.service';
import { OptionsService } from 'src/app/_service/options.service';
import { ConfigService } from 'src/app/common/config.service'
import * as moment from 'moment';
import { Observable, Subject, EMPTY, concat, of } from 'rxjs';
import { MarketData } from 'src/app/interface/market-data';
import { ProductService } from 'src/app/_service/product.service';
import { UtilityService } from 'src/app/_service/utility.service';
import { OptionsParameter } from 'src/app/interface/options-parameter';
import { Product } from 'src/app/interface/product';
import { ItemsList } from '@ng-select/ng-select/lib/items-list';
import { StrategyExpiryParameter } from 'src/app/interface/strategy-expiry-parameter';
import { Options } from '@angular-slider/ngx-slider';
import { Howl, Howler } from 'howler';
import { ContractOptionLeg } from 'src/app/interface/contract-option-leg';
import { TradeIdeaScreenerResult } from 'src/app/interface/tradeidea-screener-result';

declare var $: any;

@Component({
  selector: 'ow-main-screener-tab',
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ScreenerComponent implements OnInit, AfterViewChecked {

  @Input() currentTab: string = '';
  @Input() currentTradeTab: string = 'by-product';
  @Input() currentProductListTab: string = 'product-list-option';

  @Output() redirectToSubTab = new EventEmitter<{ tabName: string, subTabName: string }>();

  ButterflyLegOptions: Options = {
    floor: -100,
    ceil: 100,
    step: 1,
    minLimit: -100,
    maxLimit: 100,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };

  ScreenerResult: ScreenerResult;
  TradeIdeaResult: TradeIdeaScreenerResult;
  SelectedStrategy: OptionsStrategy;
  SelectedIVPrediction: IvPrediction;
  SelectedStockPricePrediction: StockPricePrediction;
  StrategyList: OptionsStrategy[];
  IVPredictionList: IvPrediction[];
  StockPredictionList: StockPricePrediction[];
  CurrentPage: number;
  TotalPage: number;
  ItemPerPage: number;
  IsFirstPage: boolean;
  IsLastPage: boolean;
  Pages: number[];

  // Order pop-up
  OptionExpiryDates$: Observable<ExpiryDatesSelection>;
  SelectedOptionExpiryDate: string;

  StockOrderForm: FormGroup;
  ConfirmedStockOrder: any;
  OptionOrderForm: FormGroup;
  stockDataFilterForm: FormGroup;
  ConfirmedOptionOrder: any;
  StockOrderTypeList: OrderType[];
  StockUnitTypeList: UnitType[];
  StockData$: Observable<MarketData>;
  OptionSnapshot$: Observable<OptionSnapshot[]>;

  SelectedProduct?: Product;
  Products$: Observable<Product[]>;
  ProductInput$: Subject<string>;
  ProductSearchLoading: boolean;

  SelectedOptionContract: string;
  OptionContracts$: Observable<Product[]>;
  OptionContractInput$: Subject<string>;
  OptionContractSearchLoading: boolean;
  selectedType: any = 'All';
  OptionSnapshotData: any = [];
  OptionSnapshotDataClone: any = [];

  @ViewChild('table4ScrollElement') private table4Scroll: ElementRef;
  @ViewChild('table1ScrollElement') private table1Scroll: ElementRef;
  @ViewChild('table2ScrollElement') private table2Scroll: ElementRef;
  @ViewChild('table3ScrollElement') private table3Scroll: ElementRef;
  dynamicStyleTable4: any = { "margin-top": "0" };
  dynamicStyleTable1: any = { "margin-top": "0" };
  dynamicStyleTable2: any = { "margin-top": "0" };
  dynamicStyleTable3: any = { "margin-top": "0" };
  OptionTable4Classes: any = 'outer-side OptionTable4 d-none';
  OptionTable1Classes: any = 'outer-body OptionTable1 width1 width2';
  OptionTable2Classes: any = 'outer-side OptionTable2';
  OptionTable3Classes: any = 'outer-body OptionTable3 width1 width2';

  // By strategy pop-up
  PlaceOrderStrategyList: OptionsStrategy[];
  ByStrategyForm: FormGroup;
  OptionParameterList: OptionsParameter[];
  ExpiryParameterList: StrategyExpiryParameter[];
  CalendarSpreadExpiryParameterList: StrategyExpiryParameter[];
  ConfirmedStrategyOrder: any;

  isLoading: Boolean = false;
  isLoadingScreenerResult: Boolean = false;
  isLoadingTradeIdeaResult: Boolean = false;
  isLoadingStrategyContractResult: Boolean = false;
  screenerOptions: any = 'Optimal_Strategy';

  // Post Order Confirmation Pop-Up
  OrderSuccessParameter: any;
  OrderRejectedParameter: any;
  StrategyOrderSuccessParameter: any;
  StrategyOrderRejectedParameter: any;

  //calculator
  MaxProfitLoss$: Observable<any>;
  CalculatorFormGroup: FormGroup;
  ProfitLossResult : number;

  AvailableBrokerAccounts = [] as any;

  currentSortedColumn = {
    name: 'Symbol',
    type: 'Asc'
  }

  callTableColumns: any = [];
  callTableColumnsDefault: any = [];
  callTableColumnsReverse: any = [];
  putTableColumns: any = [];

  placeOrderColumns: any;

  placeOrderLastTradedPrice: any = 0;


  //Custom filter tab vars
  stockUniverseList: any = [];
  selectedStockUniverse: any = '';

  meanIVList: any = [];
  selectedMeanIV: any = '';
  meanIVShareFilterCheckedArrayList: any = [];

  putCallRatioList: any = [];
  selectedPutCallRatio: any = '';

  optionInterestList: any = [];
  selectedOptionInterest: any = '';

  customTabAppliedFilterCount: any = 0;

  unusualSurgeofOptionVolume: boolean = false;


  analysisFilterFundamental: any = {
    financialRatio: {
      priceToEarning: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -9,
          ceil: 9,
          step: 1,
          minLimit: -9,
          maxLimit: 9,
          showSelectionBar: true
        },
        value: 0,
        highValue: 9,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      priceToSales: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 1,
          ceil: 20,
          step: 1,
          minLimit: 1,
          maxLimit: 20,
          showSelectionBar: true
        },
        value: 4,
        highValue: 20,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      pricetoEarningGrowth: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -20,
          ceil: 20,
          step: 1,
          minLimit: -20,
          maxLimit: 20,
          showSelectionBar: true
        },
        value: -4,
        highValue: 10,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      pricetoBook: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -20,
          ceil: 20,
          step: 1,
          minLimit: -20,
          maxLimit: 20,
          showSelectionBar: true
        },
        value: -8,
        highValue: 10,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      pricetoIntrinsic: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 0,
          ceil: 20,
          step: 1,
          minLimit: 0,
          maxLimit: 20,
          showSelectionBar: true
        }
      },
      debttoEquity:{
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 0.1,
          ceil: 20,
          step: 0.1,
          minLimit: 0.1,
          maxLimit: 20,
          showSelectionBar: true
        },
        value: 4.5,
        highValue: 20,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      freeCashFlowtoDebt:{
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -20,
          ceil: 20,
          step: 1,
          minLimit: -20,
          maxLimit: 20,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        }
      }
    },
    marginsAndYield: {
      grossMargins: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 0.1,
          ceil: 100,
          step: 0.1,
          minLimit: 0.1,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 4.5,
        highValue: 100,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      netMargins: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -100,
          ceil: 100,
          step: 1,
          minLimit: -100,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 2,
        highValue: 100,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      freeCashFlowYeild: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 1,
          ceil: 100,
          step: 1,
          minLimit: 1,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        }
      },
      dividendYield: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: 0,
          ceil: 100,
          step: 1,
          minLimit: 0,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 4,
        highValue: 100,
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      }
    },
    growthMetric: {
      earningGrowth: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -200,
          ceil: 200,
          step: 1,
          minLimit: -200,
          maxLimit: 200,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 10,
        highValue: 200,
        period: '1Y'
      },
      revenueGrowth: {
        isOptionsVisible: false,
        operator:  '',
        valueOptions: {
          floor: -200,
          ceil: 200,
          step: 1,
          minLimit: -200,
          maxLimit: 200,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 50,
        highValue: 200,
        period: '1Y'
      },
    },
    benchmarking: {
      relativePricetoEarning: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      relativePricetoEarningGrowth: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      relativePricetoBook: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      relativePricetoSales: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      relativeDebttoEquity: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '',
        calendarSelection: moment().year(),
        calendarSelectionType: 'Quarter',
        calendarSelectionYears: []
      },
      relativeEarningGrowth: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '1Y'
      },
      relativeRevenueGrowth: {
        isOptionsVisible: false,
        operator:  '',
        compareTo:  '',
        value: [],
        selectedValue: [],
        period: '1Y'
      },
    },
    categorisation: {
      marketCap:{
        isOptionsVisible: false,
        value: '',
      },
      sector:{
        isOptionsVisible: false,
        value: [],
        selectedValue: []
      },
      industry:{
        isOptionsVisible: false,
        value: [],
        selectedValue: []
      },
      index:{
        isOptionsVisible: false,
        value: '',
      }
    }
  }

  analysisFilterTechnicals: any = {
    basic: {
      price: {
        isOptionsVisible: false,
        last:  'last',
        averageOf: '0',
        comparator: '',
        valueOptions: {
          floor: 0.01,
          ceil: 500,
          step: 0.01,
          minLimit: 0.01,
          maxLimit: 500,
          showSelectionBar: true
        },
        value: 0.01,
        highValue: 500,
      },
      volume: {
        isOptionsVisible: false,
        last:  'last',
        averageOf: '0',
        comparator: '',
        valueOptions: {
          floor: 200,
          ceil: 500,
          step: 1,
          minLimit: 200,
          maxLimit: 500,
          showSelectionBar: true
        },
        value: 4.5,
        highValue: 500,
      },
      barPattern: {
        isOptionsVisible: false,
        periodType:  'days',
        value1:  'Close',
        last1:  'last',
        days_week_ago_1:  'days',
        days_week_ago_value1:  0,
        comparator: '',
        byFor: 'by_for',
        byForValue: 'greater',
        any_or_value: 0,
        value2: 'Close',
        last2:  'last',
        days_week_ago_2: 'days',
        days_week_ago_value2:  0
      },
    },
    trendIdentifierAnalysis: {
      SMAStrategy: {
        isOptionsVisible: false,
        periodType: 'days',
        valueType: 'Close',
        value1: '',
        value1Period: '20',
        value1PeriodSelected: '',
        comparator: '',
        betweenRangeOptions: {
          floor: 1,
          ceil: 100,
          step: 1,
          minLimit: 1,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 1,
        highValue: 100,
        comparatorValue: '',
        value2: 'SMA',
        value2Period: '',
        value2PeriodSelected: '',
      },
      relativeStrengthtoBenchmark: {
        isOptionsVisible: false,
        lookback: 100,
        benchmark: 'SP500',
        comparator: '',
        valueOptions: {
          floor: -100,
          ceil: 100,
          step: 1,
          minLimit: -100,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: -100,
        highValue: 100,
      },
      parabolicSar: {
        isOptionsVisible: false,
        periodType: 'days',
        last:  'last',
        days_week_ago:  'days',
        days_week_ago_value:  0,
        step: 0.2,
        max_step: 0.2,
        comparator: '',
      },
      priceTrend: {
        isOptionsVisible: false,
        barType: 'daily',
        valueType: 'close',
        value1: '',
        SMAPeriod: 50,
        lookback: 100,
        direction: '',
      },
      volumeTrend: {
        isOptionsVisible: false,
        barType: 'daily',
        value1: '',
        SMAPeriod: 50,
        lookback: 100,
        direction: '',
      },
      RSITrend: {
        isOptionsVisible: false,
        barType: 'daily',
        period: 50,
        direction: '',
      },
      accumulationDistributionTrend: {
        isOptionsVisible: false,
        barType: 'daily',
        period: 50,
        direction: '',
      },
      trendSupportResistance: {
        isOptionsVisible: false,
        lookbackPeriod: 0,
        accuracy: 0,
        comparator: '',
      },
    },
    consolidation:{
      relativeBollingerBandWidth: {
        isOptionsVisible: false,
        period: 0,
        SDMultiplier: '',
        value: [],
        selectedValue: [],
      },
      bollingerBandWidthTrend: {
        isOptionsVisible: false,
        period: 0,
        SDMultiplier: '',
        direction: ''
      },
      trianglePattern: {
        isOptionsVisible: false,
        period: 50,
        type: ''
      },
      SMAofVolatility: {
        isOptionsVisible: false,
        periodType: '',
        value1: '',
        value1Period: '',
        comparator: '',
        by: '',
        value2: 'SMA',
        value2Period: '',
      },
      SMAofTrueRange: {
        isOptionsVisible: false,
        period: '',
        value1: 'SMA',
        value1Period: '',
        by: '',
        comparator: '',
        value2: 'SMA',
        value2Period: '',
      },
      horizontalSR: {
        isOptionsVisible: false,
        lookbackPeriod: '',
        accuracy: 0,
        numberofBounce: '',
        comparator: ''
      },
    },
    divergence:{
      normalizedAccumulationDistribution: {
        isOptionsVisible: false,
        period: 100,
        comparator: '',
        value: [],
        selectedValue: []
      },
      rateOfPriceChange: {
        isOptionsVisible: false,
        lookbackPeriod: 100,
        comparator: '',
        valuePercentage: 0,
        valueOptions: {
          floor: 0,
          ceil: 100,
          step: 1,
          minLimit: 0,
          maxLimit: 100,
          showSelectionBar: true,
          translate: (value: number): string => {
            return value + '%';
          }
        },
        value: 0,
        highValue: 100,
      },
      divergenceStrategy: {
        isOptionsVisible: false,
        lookbackPeriod: 100,
        type: '',
        indicator: ''
      },
    },
    riskCharacteristicMeasure:{
      trueRangePercent: {
        isOptionsVisible: false,
        smoothingPeriod: 0,
        comparator: '',
        value2: '',
        comparator2: '',
        value: ''
      },
      volatility: {
        isOptionsVisible: false,
        lookbackPeriod: 0,
        comparator: '',
        valueOptions: {
          floor: 15,
          ceil: 30,
          step: 1,
          minLimit: 15,
          maxLimit: 30,
          showSelectionBar: true
        },
        value: 15,
        highValue: 30,
      },
      correlation: {
        isOptionsVisible: false,
        comparetoSymbol: '',
        lookbackPeriod: 100,
        comparator: '',
        valueInput: '',
        valueOptions: {
          floor: -0.3,
          ceil: 0.3,
          step: 0.1,
          minLimit: 0,
          maxLimit: 0.3,
          showSelectionBar: true
        },
        value: -0.3,
        highValue: 0.3,
      },
      beta: {
        isOptionsVisible: false,
        lookbackPeriod: 100,
        comparator: '',
        valueOptions: {
          floor: 0.3,
          ceil: 1,
          step: 0.1,
          minLimit: 0.3,
          maxLimit: 1,
          showSelectionBar: true
        },
        value: 0.3,
        highValue: 1,
      },
      sharpeRatio: {
        isOptionsVisible: false,
        lookbackPeriod: '3M',
        comparator: '',
        valueInput: '',
        valueOptions: {
          floor: 0.3,
          ceil: 2,
          step: 0.1,
          minLimit: 0.3,
          maxLimit: 2,
          showSelectionBar: true
        },
        value: 0.3,
        highValue: 2,
      },
    },
    momentum:{
      MACD: {
        isOptionsVisible: false,
        EMAPeriod: 9,
        fastPeriod: 12,
        slowPeriod: 26,
        value1: ''
      },
      RSI: {
        isOptionsVisible: false,
        period: 9,
        comparator: '',
        value1: ''
      },
      stochasticOscillator: {
        isOptionsVisible: false,
        slowPeriod: 14,
        fastPeriod: 3,
        comparator: '',
        value1: 20,
      },
      ADX: {
        isOptionsVisible: false,
        lookback: 100,
        comparator: '',
        valueInput: '',
        valueOptions: {
          floor: 7,
          ceil: 30,
          step: 1,
          minLimit: 7,
          maxLimit: 30,
          showSelectionBar: true
        },
        value: 7,
        highValue: 30,
      },
      normalizedOnBalanceVolume: {
        isOptionsVisible: false,
        period: 100,
        comparator: '',
        value: [],
        selectedValue: [],
      },
    },
    breakout:{
      majorPriceBreakout: {
        isOptionsVisible: false,
        breakoutDirection: '',
        timePeriod: ''
      },
      peakTroughBreakout: {
        isOptionsVisible: false,
        type: '',
        lookbackPeriod: 100
      },
      historicalBreakout: {
        isOptionsVisible: false,
        type: '',
        lookbackPeriod: 100
      },
      fibonacciBreakout: {
        isOptionsVisible: false,
        lookbackPeriod: 100,
        line: '',
        isElliot: ''
      }
    }
  }

  analysisFilterSentiment: any = {
    analystRating: {
      isOptionsVisible: false,
      value:  [
        {
          name: '1 to 1.5 (strong buy)',
          checked: false
        },
        {
          name: '1.5 to 2 (buy)',
          checked: false
        },
        {
          name: '2 to 2.5 (buy)',
          checked: false
        },
        {
          name: '2.5 to 3 (hold)',
          checked: false
        },
        {
          name: '3 to 3.5 (hold)',
          checked: false
        },
        {
          name: '3.5 to 4 (sell)',
          checked: false
        },
        {
          name: '4 to 4(sell)',
          checked: false
        },
        {
          name: '4.5 to 5 (strong sell)',
          checked: false
        }
      ],
      selectedValue: []
    },
    newsbasedPriceTrigger: {
      isOptionsVisible: false,
      latestNewsSentiment:  '',
      latestNewsIsWithin:  ''
    },
    targetPrice: {
      isOptionsVisible: false,
      parameter1:  '',
      parameter2:  ''
    },
    analystAction: {
      isOptionsVisible: false,
      type:  ''
    },
  }

  analysisFilterEvent: any = {
    volumeBreakout: {
      isOptionsVisible: false,
      lookbackPeriod: 5,
      multiplier: '',
    },
    unusualGap: {
      isOptionsVisible: false,
      type:  ''
    },
    nearEarningAnnouncement: {
      isOptionsVisible: false,
      daysAhead:  1
    },
    newsVolumeBreakout: {
      isOptionsVisible: false
    },
    newsTrigger: {
      isOptionsVisible: false,
      value: ''
    },
  }

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: AngularFireAuth,
    private screenerService: ScreenerService,
    private tradeService: TradeService,
    private calculatorService: CalculatorService,
    private optionsService: OptionsService,
    private productService: ProductService,
    private utilityService: UtilityService,
    private configService: ConfigService
  ) {
    this.placeOrderColumns = [];

    this.callTableColumns = [
      { key: 'BidVolume', label: 'Bid Vol.' },
      { key: 'Bid', label: 'Bid' },
      { key: 'Ask', label: 'Ask' },
      { key: 'AskVolume', label: 'Ask Vol.' },
      { key: 'Last', label: 'Last' },
      { key: 'PctChange', label: 'Change %' },
      { key: 'BreakEvenPct', label: 'Break Even %' },
      { key: 'DailyVol', label: 'Daily Vol.' },
      { key: 'OpenInt', label: 'OpenInt' },
      { key: 'OtmProbabilityPct', label: 'Otm Pro.' },
      { key: 'IVol', label: 'IVol' },
      { key: 'Delta', label: 'Delta' },
      { key: 'Gamma', label: 'Gamma' },
      { key: 'Vega', label: 'Vega' },
      { key: 'Theta', label: 'Theta' }
    ];

    this.putTableColumns = [
      { key: 'BidVolume', label: 'Bid Vol.' },
      { key: 'Bid', label: 'Bid' },
      { key: 'Ask', label: 'Ask' },
      { key: 'AskVolume', label: 'Ask Vol.' },
      { key: 'Last', label: 'Last' },
      { key: 'PctChange', label: 'Change %' },
      { key: 'BreakEvenPct', label: 'Break Even %' },
      { key: 'DailyVol', label: 'Daily Vol.' },
      { key: 'OpenInt', label: 'OpenInt' },
      { key: 'OtmProbabilityPct', label: 'Otm Pro.' },
      { key: 'IVol', label: 'IVol' },
      { key: 'Delta', label: 'Delta' },
      { key: 'Gamma', label: 'Gamma' },
      { key: 'Vega', label: 'Vega' },
      { key: 'Theta', label: 'Theta' }
    ];

    let callColumnsArr = this.callTableColumns;
    this.callTableColumnsDefault = [... this.callTableColumns];
    this.callTableColumnsReverse = callColumnsArr.reverse();   

    this.table4Scroll = <any>'';
    this.table1Scroll = <any>'';
    this.table2Scroll = <any>'';
    this.table3Scroll = <any>'';

    this.SelectedProduct = undefined;
    this.ProductInput$ = new Subject<string>();
    this.ProductSearchLoading = false;
    this.Products$ = this.ProductInput$.pipe(
      filter(res => {
        return res !== null && res.length >= 1
      }),
      distinctUntilChanged(),
      debounceTime(500),
      tap(() => this.ProductSearchLoading = true),
      switchMap(term => {
        return this.productService.searchProduct({
          Markets: ["US"],
          Keyword: term
        }).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.ProductSearchLoading = false)
        )
      }),
      share()
    );

    this.SelectedOptionContract = "";
    this.OptionContractInput$ = new Subject<string>();
    this.OptionContractSearchLoading = false;
    this.OptionContracts$ = this.OptionContractInput$.pipe(
      filter(res => {
        return res !== null && res.length >= 1
      }),
      distinctUntilChanged(),
      debounceTime(500),
      tap(() => this.OptionContractSearchLoading = true),
      switchMap(term => {
        return this.productService.searchProduct({
          Markets: ["US"],
          Keyword: term
        }).pipe(
          catchError(() => of([])), // empty list on error
          tap(() => this.OptionContractSearchLoading = false)
        )
      })
    );

    var stgList = utilityService.getStrategySelections();
    this.StrategyList = stgList;
    this.IVPredictionList = utilityService.getIVPredictionSelections();
    this.StockPredictionList = utilityService.getStockPredictionSelections();

    this.SelectedStrategy = this.StrategyList[0];
    this.SelectedIVPrediction = this.IVPredictionList[0];
    this.SelectedStockPricePrediction = this.StockPredictionList[0];
    this.ScreenerResult = { Data: [], TotalData: 0, TotalDataFiltered: 0 };
    this.TradeIdeaResult = { Data: [], TotalData: 0, TotalDataFiltered: 0 };
    this.CurrentPage = 1;
    this.TotalPage = 1
    this.ItemPerPage = 10;
    this.IsFirstPage = true;
    this.IsLastPage = true;
    this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
    this.StockOrderTypeList = this.utilityService.getOrderTypeSelections();
    this.StockUnitTypeList = this.utilityService.getUnitTypeSelections();
    this.StockOrderForm = this.formBuilder.group(
      {
        SelectedAccount: this.AvailableBrokerAccounts[0],
        SelectedStockAction: ["Buy"],
        StockQuantity: [1, [Validators.required]],
        SelectedStockOrderType: [this.StockOrderTypeList[0]],
        SelectedStockUnitType: [this.StockUnitTypeList[0]],
        StockLimitPrice: [100],
        StockStopPrice: [100],
        SelectedStockValidity: ["Day"]
      }
    );
    this.ConfirmedStockOrder = {
      product: {}
    };
    this.ConfirmedOptionOrder = {};

    this.OptionOrderForm = this.formBuilder.group(
      {
        SelectedAccount: this.AvailableBrokerAccounts[0],
        SelectedOptionAction: ["Buy"],
        OptionQuantity: [1, [Validators.required]],
        OptionLimitPrice: [1],
        OptionProduct: [""],
      }
    );

    this.OptionExpiryDates$ = EMPTY;
    this.SelectedOptionExpiryDate = "";
    this.StockData$ = EMPTY;
    this.OptionSnapshot$ = EMPTY;

    this.PlaceOrderStrategyList = stgList;
    this.OptionParameterList = this.utilityService.getOptionParameters(this.SelectedStrategy.Name);
    this.ExpiryParameterList = this.utilityService.getStrategyExpiryParameters();
    this.CalendarSpreadExpiryParameterList = this.utilityService.getCalendarSpreadExpiryParameters();
    this.ByStrategyForm = this.formBuilder.group(
      {
        SelectedAccount: this.AvailableBrokerAccounts[0],
        SelectedStrategy: [this.PlaceOrderStrategyList[0]],
        SelectedStock: [{}],
        SelectedExpiry: [this.ExpiryParameterList[0]],
        SelectedParameter: [this.OptionParameterList[0]],
        SelectedCalendarSpreadExpiry: [this.CalendarSpreadExpiryParameterList[0]],
        MaxLoss: [100],
        MaxGain: [300],
        Probability: [10],
        Amount: [2000],
        Legs: this.formBuilder.array(
          [this.formBuilder.group(
            { Action: "", OrderType: "", Direction: "", Rights: "", Quantity: "", StrikePrice: 0, Expiry: "", LimitPrice: 0, FairValue: 0 })]
        ),
        Action: 'Buy',
        Direction: 'Long',
        Quantity: 1,
        LimitPrice: 280
      }
    );
    this.CalculatorFormGroup = this.formBuilder.group({
      Strategy: [this.PlaceOrderStrategyList[0]],
      Symbol: new FormControl(""),
      Stock: { Direction: "", Quantity: 0 },
      NextState: this.formBuilder.group({
        Legs: this.formBuilder.array([
          this.formBuilder.group({
            LegId: 0,
            IV: 0
          })
        ]),
        StockPrice: 0,
        Period: 0,
        ATMMeanIV: 0
      }),
      CurrentState: this.formBuilder.group({
        Legs: this.formBuilder.array([
          this.formBuilder.group({
            LegId: 0,
            IV: 0
          })
        ]),
        StockPrice: 0,
        Period: 0,
        ATMMeanIV: 0,
        DividendYield: 0,
        InterestRate: 0,
        MeanSkew: 0,
        DaysToExpiry: 0
      })
    });
    this.ConfirmedStrategyOrder = {
      product: {},
      legs: []
    };
    this.ProfitLossResult = 0;
    this.MaxProfitLoss$ = EMPTY;

    // Post Order Confirmation Pop-Up
    this.OrderSuccessParameter = {
      Action: "",
      Quantity: 0,
      Symbol: "",
      OrderType: ""
    };
    this.OrderRejectedParameter = {
      Action: "",
      Quantity: 0,
      Symbol: "",
      OrderType: "",
      RejectReason: ""
    };
    this.StrategyOrderSuccessParameter = {
      Strategy: "",
      Underlying: ""
    };
    this.StrategyOrderRejectedParameter = {
      Strategy: "",
      Underlying: "",
      RejectReason: ""
    };

    this.stockDataFilterForm = this.formBuilder.group(
      {
        volume_grater_then: [""],
        volume_less_then: [""],
        delta_grater_then: [""],
        delta_less_then: [""],
        open_interest_grater_then: [""],
        open_interest_less_then: [""]
      }
    );


    //Custom filter tab vars
    this.stockUniverseList = [{
      id: null,
      name: 'Select Stock Universe'
    },{
      id: 1,
      name: 'S&P 500'
    }];
    this.selectedStockUniverse = this.stockUniverseList[0];

    this.meanIVList = this.getMeanIVData();

    this.putCallRatioList = this.getPutCallRatioData();
    this.selectedPutCallRatio = this.putCallRatioList[0];

    this.optionInterestList = this.getOptionInterestData();
    this.selectedOptionInterest = this.optionInterestList[0];

    //Analysis Filter -> Fundamental -> Benchmarking
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.value = this.getAnalysisFilterPercentageMultiDropdownValueData();
    this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.value = this.getAnalysisFilterPercentageMultiDropdownValueData();

    //Analysis Filter -> Technicals -> Consolidation
    this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.value = this.getAnalysisFilterMultiDropdownValueData();

    //Analysis Filter -> Technicals -> Divergence
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.value = this.getAnalysisFilterMultiWithoutPercentageSignDropdownValueData();

    //Analysis Filter -> Technicals -> Momentum
    this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.value = this.getAnalysisFilterMultiWithoutPercentageSignDropdownValueData();


    //Analysis Filter -> Fundamental -> Categorisation
    this.getSectorSelections();
    this.getIndustrySelections();

  }

  @HostListener('window:scroll', ['$event']) scrollTable4Handler($event: any) {
    let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
    //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
    //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
    //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

    //this.dynamicStyleTable4 = {'margin-top': '-'+table4ScrollTop+'px'};
    ////this.dynamicStyleTable1 = {'margin-top': '-'+table4ScrollTop+'px'};
    //this.dynamicStyleTable2 = {'margin-top': '-'+table4ScrollTop+'px'};
    //this.dynamicStyleTable3 = {'margin-top': '-'+table4ScrollTop+'px'};

    //this.table4Scroll.nativeElement.scrollTop = table3ScrollTop;
    this.table1Scroll.nativeElement.scrollTop = table4ScrollTop;
    //this.table2Scroll.nativeElement.scrollTop = table3ScrollTop;
    //this.table3Scroll.nativeElement.scrollTop = table3ScrollTop;
  }

  @HostListener('window:scroll', ['$event']) scrollTable1Handler($event: any) {
    //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
    let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
    //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
    //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

    ////this.dynamicStyleTable4 = {'margin-top': '-'+table1ScrollTop+'px'};
    //this.dynamicStyleTable1 = {'margin-top': '-'+table1ScrollTop+'px'};
    ////this.dynamicStyleTable2 = {'margin-top': '-'+table1ScrollTop+'px'};
    ////this.dynamicStyleTable3 = {'margin-top': '-'+table1ScrollTop+'px'};

    if (this.selectedType == 'Call') {
      this.table4Scroll.nativeElement.scrollTop = table1ScrollTop;
    }
    //this.table1Scroll.nativeElement.scrollTop = table1ScrollTop;
    this.table2Scroll.nativeElement.scrollTop = table1ScrollTop;
    this.table3Scroll.nativeElement.scrollTop = table1ScrollTop;
  }
  @HostListener('window:scroll', ['$event']) scrollTable2Handler($event: any) {
    //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
    //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
    let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
    //let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

    //this.dynamicStyleTable4 = {'margin-top': '-'+table2ScrollTop+'px'};
    ////this.dynamicStyleTable1 = {'margin-top': '-'+table2ScrollTop+'px'};
    //this.dynamicStyleTable2 = {'margin-top': '-'+table2ScrollTop+'px'};
    ////this.dynamicStyleTable3 = {'margin-top': '-'+table2ScrollTop+'px'};

    //this.table4Scroll.nativeElement.scrollTop = table2ScrollTop;
    this.table1Scroll.nativeElement.scrollTop = table2ScrollTop;
    //this.table2Scroll.nativeElement.scrollTop = table2ScrollTop;
    this.table3Scroll.nativeElement.scrollTop = table2ScrollTop;
  }
  @HostListener('window:scroll', ['$event']) scrollTable3Handler($event: any) {
    //let table4ScrollTop = this.table4Scroll.nativeElement.scrollTop;
    //let table1ScrollTop = this.table1Scroll.nativeElement.scrollTop;
    //let table2ScrollTop = this.table2Scroll.nativeElement.scrollTop;
    let table3ScrollTop = this.table3Scroll.nativeElement.scrollTop;

    //this.dynamicStyleTable4 = {'margin-top': '-'+table3ScrollTop+'px'};
    ////this.dynamicStyleTable1 = {'margin-top': '-'+table3ScrollTop+'px'};
    ////this.dynamicStyleTable2 = {'margin-top': '-'+table3ScrollTop+'px'};
    //this.dynamicStyleTable3 = {'margin-top': '-'+table3ScrollTop+'px'};

    //this.table4Scroll.nativeElement.scrollTop = table3ScrollTop;
    this.table1Scroll.nativeElement.scrollTop = table3ScrollTop;
    this.table2Scroll.nativeElement.scrollTop = table3ScrollTop;
    //this.table3Scroll.nativeElement.scrollTop = table3ScrollTop;
  }

  getSectorSelections(){
    this.screenerService.getSectorSelections().subscribe(result => {
      if (result && result.Data) {
        this.analysisFilterFundamental.categorisation.sector.value = result.Data.map(({SectorId, SectorName: name})=>({SectorId, name, checked: false}));
      }
    });
  }
  getIndustrySelections(){
    this.screenerService.getIndustrySelections().subscribe(result => {
      if (result && result.Data) {
        this.analysisFilterFundamental.categorisation.industry.value = result.Data.map(({IndustryId, IndustryName: name})=>({IndustryId, name, checked: false}));
      }
    });
  }

  playSound(audio: any){
    var sound = new Howl({
      src: [audio],
      html5: true
    });
    sound.play();
  }

  seeMyOrders(){
    $('#OrderCreated').modal('hide');
    $('#OrderSuccess').modal('hide');
    this.redirectToSubTab.emit({tabName: "trade", subTabName: "active-orders"});
  }

  setScreenerOptionType(optionType: string): void {
    this.currentSortedColumn = {
      name: 'Symbol',
      type: 'Asc'
    };
    this.screenerOptions = optionType;
    if (this.screenerOptions === 'Optimal_Strategy') {
      this.generateScreenerResult();        
    } else if (this.screenerOptions === 'Prediction') {
      this.generateScreenerResult();
    } else if (this.screenerOptions === 'All') {
      this.generateTradeIdeaResult();  
    }
  }

  reloadOptionData() {
    if (this.SelectedProduct) {
      this.OptionSnapshotData = [];
      this.isLoading = true;
      var symbol = this.SelectedProduct.Symbol;

      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        // Last Traded Price required here to determine center point of option chain table
        this.placeOrderLastTradedPrice = value.LastTradedPrice;
        this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());
        this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
          this.OptionOrderForm.patchValue({ OptionProduct: symbol+ this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
          this.isLoading = false;
          this.OptionSnapshotData = value;
          this.OptionSnapshotDataClone = value;

          this.setTableColumnStatus(value);

          this.tableScrollByType(this.selectedType);

        });
      });
    }
  }

  reloadStrategyData() {
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;

      // Get data to show Underlying Price     
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.isLoadingStrategyContractResult = true;
      this.StockData$.pipe(take(1)).subscribe(value => {
        var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
        var amount = this.ByStrategyForm.get('Amount')?.value;

        if (strategy) {
          if (strategy.Name === 'DeltaNeutral') {
            this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
          }

          this.OptionParameterList = this.utilityService.getOptionParameters(strategy.Name);
          var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
          legs.clear();

          // if (this.screenerOptions === "Optimal_Strategy") {
          //  var data = this.screenerService.getAiContracts({
          //    Strategy: strategy.Name, 
          //    Symbol: symbol,
          //    Amount: amount
          //  });
          //  data.subscribe(value => {
          //    legs.clear();
          //    var group = value.Legs.map(x => this.formBuilder.group(
          //      {
          //        Action: x.Action,
          //        OrderType: x.OrderType,
          //        Direction: x.Direction,
          //        Rights: x.Rights,
          //        Quantity: x.Quantity,
          //        StrikePrice: x.StrikePrice,
          //        Expiry: x.Expiry,
          //        LimitPrice: x.LimitPrice,
          //        FairValue: x.FairValue
          //      }
          //    ));
          //    group.forEach(Leg => legs.push(Leg));
          //    this.isLoadingStrategyContractResult = false;
          //  });
          // }
          // else
          {
            var data2 = this.utilityService.getSampleContract(strategy.Name, symbol, value.LastTradedPrice);
            data2.subscribe(value => {
              legs.clear();
              var group = value.map(x => this.formBuilder.group(
                {
                  Action: x.Action,
                  OrderType: x.OrderType,
                  Direction: x.Direction,
                  Rights: x.Rights,
                  Quantity: x.Quantity,
                  StrikePrice: x.StrikePrice,
                  Expiry: x.Expiry,
                  LimitPrice: x.LimitPrice,
                  FairValue: x.FairValue
                }
              ));
              group.forEach(Leg => legs.push(Leg));
              this.isLoadingStrategyContractResult = false;
            });
          }
        }
      });
    }
  }

  ngAfterViewChecked() {
  }

  filterStockData(){

    this.OptionSnapshotData = this.OptionSnapshotDataClone;

    var volume_grater_then = this.stockDataFilterForm.get('volume_grater_then')?.value;
    var volume_less_then = this.stockDataFilterForm.get('volume_less_then')?.value;
    var delta_grater_then = this.stockDataFilterForm.get('delta_grater_then')?.value;
    var delta_less_then = this.stockDataFilterForm.get('delta_less_then')?.value;
    var open_interest_grater_then = this.stockDataFilterForm.get('open_interest_grater_then')?.value;
    var open_interest_less_then = this.stockDataFilterForm.get('open_interest_less_then')?.value;

    let OptionSnapshotDataVolume = [];
    let OptionSnapshotDataDelta = [];
    let OptionSnapshotDataOpenInt = [];
    if(volume_grater_then || volume_less_then){
      OptionSnapshotDataVolume = this.OptionSnapshotData.filter((item: any) => {
        if(volume_grater_then && !volume_less_then){
          return item.Call.BidVolume !== null && item.Call.BidVolume > parseInt(volume_grater_then);
        }
        if(!volume_grater_then && volume_less_then){
          return item.Call.BidVolume !== null && item.Call.BidVolume < parseInt(volume_less_then);
        }
        if(volume_grater_then && volume_less_then){
          return item.Call.BidVolume !== null && (item.Call.BidVolume > parseInt(volume_grater_then) && item.Call.BidVolume  < parseInt(volume_less_then));
        }
        return item;
      });
    }

    if(delta_grater_then || delta_less_then){
      OptionSnapshotDataDelta = this.OptionSnapshotData.filter((item: any) => {
        if(delta_grater_then && !delta_less_then){
          return item.Call.Delta !== null && item.Call.Delta > parseFloat(delta_grater_then);
        }
        if(!delta_grater_then && delta_less_then){
          return item.Call.Delta !== null && item.Call.Delta < parseFloat(delta_less_then);
        }
        if(delta_grater_then && delta_less_then){
          return item.Call.Delta !== null && (item.Call.Delta > parseFloat(delta_grater_then) && item.Call.Delta < parseFloat(delta_less_then));
        }
        return item;
      });
    }

    if(open_interest_grater_then || open_interest_less_then){
      OptionSnapshotDataOpenInt = this.OptionSnapshotData.filter((item: any) => {
        if(open_interest_grater_then && !open_interest_less_then){
          return item.Call.OpenInt !== null && item.Call.OpenInt > parseFloat(open_interest_grater_then);
        }
        if(!open_interest_grater_then && open_interest_less_then){
          return item.Call.OpenInt !== null && item.Call.OpenInt < parseFloat(open_interest_less_then);
        }
        if(open_interest_grater_then && open_interest_less_then){
          return item.Call.OpenInt !== null && (item.Call.OpenInt > parseFloat(open_interest_grater_then) && item.Call.OpenInt < parseFloat(open_interest_less_then));
        }
        return item;
      });
    }

    this.OptionSnapshotData = [].concat(OptionSnapshotDataVolume, OptionSnapshotDataDelta, OptionSnapshotDataOpenInt);
    if(!OptionSnapshotDataVolume.length && !OptionSnapshotDataDelta.length && !OptionSnapshotDataOpenInt.length){
      this.OptionSnapshotData = this.OptionSnapshotDataClone;
    }

    this.tableScrollByType(this.selectedType);
  }

  tableScrollByType(value: String){
    if (value == 'All') {
      this.callTableColumns = this.callTableColumnsReverse;
      setTimeout(() => {
        this.table1Scroll.nativeElement.scrollLeft += 9999999999*2;
        var callTableLength = $("#myTable1").find('tr.callBG').length;
        var putTableLength = $("#myTable3").find('tr.putBG').length;
        if(callTableLength > 5 && putTableLength > 0){
          var scrollTopVal = ($('#myTable1 tr.callBG').eq(callTableLength - 1).offset().top) - 588;
          this.table1Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table2Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table3Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }

    if (value == 'Call') {
      this.callTableColumns = this.callTableColumnsDefault;
      setTimeout(() => {
        var callTableLength = $("#myTable1").find('tr.callBG').length;
        if(callTableLength > 5){
          var scrollTopVal = ($('#myTable1 tr.callBG').eq(callTableLength - 1).offset().top) - 588;
          this.table4Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table1Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }

    if (value == 'Put') {
      this.callTableColumns = this.callTableColumnsDefault;
      setTimeout(() => {
        var putTableLength = $("#myTable3").find('tr.putBG').length;
        if(putTableLength > 5){
          var scrollTopVal = ($('#myTable3 tr.putBG').eq(putTableLength - 1).offset().top) - 1730;
          this.table2Scroll.nativeElement.scrollTop += scrollTopVal;
          this.table3Scroll.nativeElement.scrollTop += scrollTopVal;
        }
      }, 700);
    }
  }

  setTableColumnStatus(value: any){
    var excludedColumns = ['Ticker'];
    this.callTableColumnsDefault.map((itemObj: any, key: number) =>{
      if(!excludedColumns.includes(itemObj.key)){
        let columnJSON = {
          "name": itemObj.label,
          "key": itemObj.key,
          "checked": false
        }
        if(itemObj.key == 'BidVolume' || itemObj.key == 'Bid' || itemObj.key == 'Ask' || itemObj.key == 'AskVolume' || itemObj.key == 'BreakEvenPct' || itemObj.key == 'PctChange'){
          columnJSON.checked = true;
        }
        this.placeOrderColumns.push(columnJSON);
      }
    })
  }

  getStatusByColumn(columnName: string){
    if(this.placeOrderColumns.length > 0){
      let filtered = this.placeOrderColumns.filter((row: any) => row.key == columnName);
      if(filtered.length > 0){
        return filtered[0].checked;
      }
      return false;
    }
  }

  checkValueByKey(snapshootOBJ: any, callTableColumn: any) {
    if (snapshootOBJ[callTableColumn.key] !== undefined && snapshootOBJ[callTableColumn.key] !== null && snapshootOBJ[callTableColumn.key] !== '') {
      switch (callTableColumn.key) {
        case "BreakEvenPct":
        case "IVol":
        case "PctChange":
        case "OtmProbabilityPct":
          return (parseFloat(snapshootOBJ[callTableColumn.key]) * 100).toFixed(2) + "%";
        case "Bid":
        case "Ask":
        case "Last":
          return parseFloat(snapshootOBJ[callTableColumn.key]).toFixed(2);
        case "Vega":
        case "Theta":
        case "Gamma":
        case "Delta":
          return parseFloat(snapshootOBJ[callTableColumn.key]).toFixed(3);
        default:
          return snapshootOBJ[callTableColumn.key];
      }
    }
    else {
      return "-";
    }
    return;
  }

  onTypeChanged(value: String) {
    this.selectedType = value;
    if (value === 'All') {
      this.OptionTable4Classes = 'outer-side OptionTable4 d-none';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1 width2';
      this.OptionTable2Classes = 'outer-side OptionTable2';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1 width2';
    }
    if (value === 'Call') {
      this.OptionTable4Classes = 'outer-side OptionTable4';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1';
      this.OptionTable2Classes = 'outer-side OptionTable2 d-none';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1 width2 d-none';
    }
    if (value === 'Put') {
      this.OptionTable4Classes = 'outer-side OptionTable4 d-none';
      this.OptionTable1Classes = 'outer-body OptionTable1 width1 width2 d-none';
      this.OptionTable2Classes = 'outer-side OptionTable2';
      this.OptionTable3Classes = 'outer-body OptionTable3 width1';
    }

    this.tableScrollByType(value);

  }

  ngAfterViewInit() {

  }

  searchProductTrackByFn(item: Product) {
    return item.ProductId;
  }

  searchOptionContractTrackByFn(item: Product) {
    return item.ProductId;
  }

  onProductSelected(item: Product) {
    this.isLoading = true;
    console.log("item.Symbol: ", item.Symbol);
    console.log("this.SelectedProduct: ", this.SelectedProduct);

    this.StockData$ = this.tradeService.getMarketData(item.ProductId).pipe(share());
    this.StockData$.pipe(take(1)).subscribe(value => {
      this.placeOrderLastTradedPrice = value.LastTradedPrice;
      console.log(JSON.stringify(value));
      this.StockOrderForm.patchValue({ StockLimitPrice: value.AskPrice });
      this.StockOrderForm.patchValue({ StockStopPrice: value.AskPrice });
    });

    if (this.currentProductListTab === 'product-list-option') {
      this.OptionSnapshotData = [];
      this.OptionExpiryDates$ = this.optionsService.getExpiryDates(item.Symbol).pipe(share());
      this.OptionExpiryDates$.pipe(take(1)).subscribe((value) => {
        // Last Traded Price required here to determine center point of option chain table
        this.SelectedOptionExpiryDate = value.DefaultExpiryDate;
        this.OptionSnapshot$ = this.optionsService.getOptionChain(item.Symbol, this.SelectedOptionExpiryDate).pipe(share());

        this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
          this.OptionOrderForm.patchValue({ OptionProduct: item.Symbol + this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
          this.isLoading = false;
          this.OptionSnapshotData = value;
          this.OptionSnapshotDataClone = value;

          this.setTableColumnStatus(value);

          this.tableScrollByType(this.selectedType);
        });
      });
    }
  }

  onStrategyProductSelected(item: Product) {
    var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;

    this.ByStrategyForm.patchValue({ SelectedStock: this.SelectedProduct });
    this.StockData$ = this.tradeService.getMarketData(item.ProductId).pipe(share());
    this.isLoadingStrategyContractResult = true;
    this.StockData$.pipe(take(1)).subscribe(value => {
      if (strategy) {
        if (strategy.Name === 'DeltaNeutral') {
          this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
        }

        this.OptionParameterList = this.utilityService.getOptionParameters(strategy.Name);
        var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
        legs.clear()
        var data = this.utilityService.getSampleContract(strategy.Name, item.Symbol, value.LastTradedPrice);
        data.subscribe(value => {
          legs.clear();
          var group = value.map(x => this.formBuilder.group(
            {
              Action: x.Action,
              OrderType: x.OrderType,
              Direction: x.Direction,
              Rights: x.Rights,
              Quantity: x.Quantity,
              StrikePrice: x.StrikePrice,
              Expiry: x.Expiry,
              LimitPrice: x.LimitPrice,
              FairValue: x.FairValue
            }
          ));
          group.forEach(Leg => legs.push(Leg));
          this.isLoadingStrategyContractResult = false;
        });
      }
    });
  }

  onOptionContractSelected(item: Product) {
    console.log(item.Symbol);
    console.log(this.SelectedProduct);
  }

  generateScreenerResult() {
    this.isLoadingScreenerResult = true;
    var requestObj: PredefinedScreenerRequest = {
      search: "",
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    if (this.screenerOptions === 'Optimal_Strategy') {
      requestObj.strategy = this.SelectedStrategy.Name;
    } else if (this.screenerOptions === 'Prediction') {
      requestObj.prediction = {
        IVPrediction: this.SelectedIVPrediction.Name,
        StockPricePrediction: this.SelectedStockPricePrediction.Name
      };
    }
    console.log("Generating screen result...", JSON.stringify(requestObj));
    this.screenerService.getPredefinedScreening(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.ScreenerResult = result;
        this.TotalPage = Math.floor(this.ScreenerResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingScreenerResult = false;
    });
  }

  generateTradeIdeaResult() {
    console.log("Generating trade idea result...");
    this.isLoadingTradeIdeaResult = true;
    var requestObj: PredefinedScreenerRequest = {
      search: "",
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    requestObj.prediction = {
      IVPrediction: this.SelectedIVPrediction.Name,
      StockPricePrediction: this.SelectedStockPricePrediction.Name
    };
    this.screenerService.getTradeIdeas(requestObj).subscribe(result => {
      console.log(result);
      if (result && result.Data) {
        this.TradeIdeaResult = result;

        // this.TotalPage = Math.floor(this.TradeIdeaResult.TotalData / this.ItemPerPage);
        // this.IsFirstPage = this.CurrentPage === 1;
        // this.IsLastPage = this.CurrentPage === this.TotalPage;
        // this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
      }
      this.isLoadingTradeIdeaResult = false;
    });
  }

  previousPage() {
    this.CurrentPage--;
    this.isLoadingScreenerResult = true;
    var requestObj: PredefinedScreenerRequest = {
      search: "",
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    if (this.screenerOptions === 'Optimal_Strategy') {
      requestObj.strategy = this.SelectedStrategy.Name;
    } else if (this.screenerOptions === 'Prediction') {
      requestObj.prediction = {
        IVPrediction: this.SelectedIVPrediction.Name,
        StockPricePrediction: this.SelectedStockPricePrediction.Name
      };
    }
    console.log("Scanning previous page...", JSON.stringify(requestObj));
    this.screenerService.getPredefinedScreening(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.ScreenerResult = result;
        this.TotalPage = Math.floor(this.ScreenerResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  nextPage() {
    this.isLoadingScreenerResult = true;
    this.CurrentPage++;
    var requestObj: PredefinedScreenerRequest = {
      search: "",
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    if (this.screenerOptions === 'Optimal_Strategy') {
      requestObj.strategy = this.SelectedStrategy.Name;
    } else if (this.screenerOptions === 'Prediction') {
      requestObj.prediction = {
        IVPrediction: this.SelectedIVPrediction.Name,
        StockPricePrediction: this.SelectedStockPricePrediction.Name
      };
    }
    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.screenerService.getPredefinedScreening(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.ScreenerResult = result;
        this.TotalPage = Math.floor(this.ScreenerResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  goToPage(pageNum: number) {
    this.isLoadingScreenerResult = true;
    this.CurrentPage = pageNum;
    var requestObj: PredefinedScreenerRequest = {
      search: "",
      sort: this.currentSortedColumn.name,
      order: this.currentSortedColumn.type,
      offset: (this.CurrentPage - 1) * 10,
      limit: 10
    }
    if (this.screenerOptions === 'Optimal_Strategy') {
      requestObj.strategy = this.SelectedStrategy.Name;
    } else if (this.screenerOptions === 'Prediction') {
      requestObj.prediction = {
        IVPrediction: this.SelectedIVPrediction.Name,
        StockPricePrediction: this.SelectedStockPricePrediction.Name
      };
    }
    console.log("Scanning next page...", JSON.stringify(requestObj));
    this.screenerService.getPredefinedScreening(requestObj).subscribe(result => {
      if (result && result.Data) {
        this.ScreenerResult = result;
        this.TotalPage = Math.floor(this.ScreenerResult.TotalData / this.ItemPerPage);
        this.IsFirstPage = this.CurrentPage === 1;
        this.IsLastPage = this.CurrentPage === this.TotalPage;
        this.Pages = Array.from({ length: this.TotalPage }, (v, k) => k + 1);
        this.isLoadingScreenerResult = false;
      }
    });
  }

  submitOptionOrder(): void {
    var account = this.OptionOrderForm.get('SelectedAccount')?.value;
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;
    //var product = this.OptionOrderForm.get('OptionProduct')?.value;
    var quantity = this.OptionOrderForm.get('OptionQuantity')?.value;
    var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;

    var requestObj = {
      account: account.id,
      action: action,
      symbol: this.SelectedOptionContract,
      quantity: quantity * 100,
      limitPrice: limitPrice,
      validity: "Day"
    }

    console.log("Submitting option order...", JSON.stringify(requestObj));
    this.ConfirmedOptionOrder = {
      account: account.id,
      broker: account.brokerType,
      action: requestObj.action,
      orderType: "Limit",
      quantity: quantity,
      limitPrice: requestObj.limitPrice,
      validity: "Day",
      unitType: "Lot",
      product: requestObj.symbol
    }
  }

  submitStockOrder(): void {
    var account = this.StockOrderForm.get('SelectedAccount')?.value;
    var action = this.StockOrderForm.get('SelectedStockAction')?.value;
    var orderType = this.StockOrderForm.get('SelectedStockOrderType')?.value;
    var quantity = this.StockOrderForm.get('StockQuantity')?.value;
    var unitType = this.StockOrderForm.get('SelectedStockUnitType')?.value;
    var validity = this.StockOrderForm.get('SelectedStockValidity')?.value;
    var limitPrice = this.StockOrderForm.get('StockLimitPrice')?.value;
    var stopPrice = this.StockOrderForm.get('StockStopPrice')?.value;

    var requestObj = {
      account: account.id,
      action: action,
      orderType: orderType.Name,
      quantity: quantity,
      limitPrice: 0,
      stopPrice: 0,
      validity: validity
    };
    if (orderType.Name === 'Limit') {
      requestObj.limitPrice = limitPrice;
    } else if (orderType.Name === 'Stop') {
      requestObj.stopPrice = stopPrice;
    }
    if (unitType.Name === 'Lot') {
      requestObj.quantity *= 100;
    } else if (unitType.Name === 'KLot') {
      requestObj.quantity *= 1000;
    }

    console.log("Submitting stock order...", JSON.stringify(requestObj));
    this.ConfirmedStockOrder = {
      account: account.id,
      broker: account.brokerType,
      action: requestObj.action,
      orderType: requestObj.orderType,
      quantity: quantity,
      limitPrice: requestObj.limitPrice,
      stopPrice: requestObj.stopPrice,
      validity: requestObj.validity,
      unitType: unitType.Name,
      product: this.SelectedProduct
    }
  }

  submitStrategyOrder(): void {
    var account = this.ByStrategyForm.get('SelectedAccount')?.value;
    var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
    var action = this.ByStrategyForm.get('Action')?.value;
    var quantity = this.ByStrategyForm.get('Quantity')?.value;
    var limitPrice = this.ByStrategyForm.get('LimitPrice')?.value;
    var legs = this.ByStrategyForm.get('Legs')?.value;

    var requestObj = {
      account : account.id,
      strategy: strategy,
      action: action,
      direction: action === "Buy" ? "Long" : "Short",
      quantity: quantity,
      limitPrice: limitPrice,
      legs: legs
    };
    console.log("Submitting strategy order...", JSON.stringify(requestObj));
    this.ConfirmedStrategyOrder = {
      account: account.id,
      broker: account.brokerType,
      strategy: requestObj.strategy.Name,
      action: requestObj.action,
      direction: requestObj.direction,
      quantity: requestObj.quantity,
      limitPrice: requestObj.limitPrice,
      symbol: this.SelectedProduct?.Symbol,
      legs: legs
    };
  }

  confirmSendOptionOrder(): void {
    var account = this.OptionOrderForm.get('SelectedAccount')?.value;
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;
    //var product = this.OptionOrderForm.get('OptionProduct')?.value;
    var quantity = this.OptionOrderForm.get('OptionQuantity')?.value;
    var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;

    var requestObj = {
      AccountId: account?.id,
      Broker: account?.brokerType,
      Action: action,
      Symbol: this.SelectedOptionContract,
      Quantity: quantity,
      LimitPrice: parseFloat(limitPrice),
      Validity: "Day",
      OrderType: "Limit",
      Underlying: this.SelectedProduct?.Symbol
    };

    console.log("Confirm send option order...", JSON.stringify(requestObj));
    this.tradeService.placeOptionOrder(requestObj).subscribe((result) => {
      console.log(JSON.stringify(result));
      if (result.status !== "REJECTED") {
        this.OrderSuccessParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedOptionContract,
          OrderType: "Limit",
          LimitPrice: limitPrice
        };
        this.playSound("https://am708403.blob.core.windows.net/sounds/trading/feed.mp3");
        $('#OrderCreated').modal('show');
      } else {
        this.OrderRejectedParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedOptionContract,
          OrderType: "Limit",
          LimitPrice: limitPrice,
          RejectReason: result.reason
        };
        $('#OrderRejected').modal('show');
      }
    });
  }

  confirmSendStockOrder(): void {
    var account = this.StockOrderForm.get('SelectedAccount')?.value;
    var action = this.StockOrderForm.get('SelectedStockAction')?.value;
    var orderType = this.StockOrderForm.get('SelectedStockOrderType')?.value;
    var quantity = this.StockOrderForm.get('StockQuantity')?.value;
    var unitType = this.StockOrderForm.get('SelectedStockUnitType')?.value;
    var validity = this.StockOrderForm.get('SelectedStockValidity')?.value;
    var limitPrice = this.StockOrderForm.get('StockLimitPrice')?.value;
    var stopPrice = this.StockOrderForm.get('StockStopPrice')?.value;

    var requestObj = {
      AccountId: account?.id,
      Broker: account?.brokerType,
      Action: action,
      Symbol: this.SelectedProduct?.Symbol,
      Quantity: quantity,
      Validity: validity,
      OrderType: orderType.Name,
      StopPrice: 0,
      LimitPrice: 0
    };
    if (orderType.Name === 'Limit') {
      requestObj.LimitPrice = parseFloat(limitPrice);
    } else if (orderType.Name === 'Stop') {
      requestObj.StopPrice = parseFloat(stopPrice);
    }
    if (unitType.Name === 'Lot') {
      requestObj.Quantity *= 100;
    } else if (unitType.Name === 'KLot') {
      requestObj.Quantity *= 1000;
    }

    console.log("Confirm send stock order...", JSON.stringify(requestObj));
    this.tradeService.placeStockOrder(requestObj).subscribe((result) => {
      console.log(JSON.stringify(result));
      if (result.status !== "REJECTED") {
        this.OrderSuccessParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedProduct?.Symbol,
          OrderType: orderType.Name
        };
        if (orderType.Name === 'Limit') {
          this.OrderSuccessParameter.LimitPrice = limitPrice;
        } else if (orderType.Name === 'Stop') {
          this.OrderSuccessParameter.StopPrice = stopPrice;
        }
        this.playSound("https://am708403.blob.core.windows.net/sounds/trading/feed.mp3");
        $('#OrderCreated').modal('show');
      } else {
        this.OrderRejectedParameter = {
          Action: action,
          Quantity: quantity,
          Symbol: this.SelectedProduct?.Symbol,
          OrderType: orderType.Name,
          RejectReason: result.reason
        };
        if (orderType.Name === 'Limit') {
          this.OrderRejectedParameter.LimitPrice = limitPrice;
        } else if (orderType.Name === 'Stop') {
          this.OrderRejectedParameter.StopPrice = stopPrice;
        }
        $('#OrderRejected').modal('show');
      }
    });
  }

  confirmSendStrategyOrder(): void {
    var account = this.ByStrategyForm.get('SelectedAccount')?.value;
    var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
    var action = this.ByStrategyForm.get('Action')?.value;
    var quantity = this.ByStrategyForm.get('Quantity')?.value;
    var limitPrice = this.ByStrategyForm.get('LimitPrice')?.value;
    var legs = this.ByStrategyForm.get('Legs')?.value;

    let requestObj = {
      AccountId: account.id,
      Broker: account?.brokerType,
      Strategy: strategy.Name,
      Action: action,
      Symbol: this.SelectedProduct?.Symbol,
      Quantity: quantity,
      LimitPrice: parseFloat(limitPrice),
      Validity: "Day",
      OrderType: "Limit",
      Legs: legs
    };

    console.log("Confirm send strategy order...", JSON.stringify(requestObj));
    this.tradeService.placeStrategyOrder(requestObj).subscribe((result : any) => {
      console.log(JSON.stringify(result));
      if (result.status !== "REJECTED") {
        this.StrategyOrderSuccessParameter = {
          Strategy: strategy.Name,
          Underlying: this.SelectedProduct?.Symbol
        };
        this.playSound("https://am708403.blob.core.windows.net/sounds/trading/feed.mp3");
        $('#OrderSuccess').modal('show');
      } else {
        this.StrategyOrderRejectedParameter = {
          Strategy: strategy.Name,
          Underlying: this.SelectedProduct?.Symbol,
          RejectReason: "Unknown"
        };
        $('#StrategyOrderRejected').modal('show');
      }
    });

    // if (strategy.Name == 'DeltaNeutral') {
    //   let requestObj = {
    //     strategy: strategy.Name,
    //     action: action,
    //     direction: action === "Buy" ? "Long" : "Short",
    //     quantity: quantity * 100,
    //     limitPrice: limitPrice,
    //     contract: this.ConfirmedStrategyOrder.symbol,
    //     symbol: this.ConfirmedStrategyOrder.symbol,
    //     type: "Limit",
    //     strikePrice: legs[0].StrikePrice,
    //     GUID: ""
    //   };

    //   console.log("Confirm send strategy order...", JSON.stringify(requestObj));
    //   this.tradeService.placeStockOrder(requestObj).subscribe();
    // }
    // for (let leg of legs) {
    //   let stringSP = leg.StrikePrice.toString().split('.');
    //   let strikePriceContract = stringSP[0].padStart(5, "0");

    //   if (stringSP[1])
    //     strikePriceContract = strikePriceContract.concat(stringSP[1].padEnd(3, "0"));
    //   else
    //     strikePriceContract = strikePriceContract.concat("000");

    //   let contract = this.ConfirmedStrategyOrder.symbol +
    //     new Date().toJSON().slice(0, 10).replace(/-/g, '') +
    //     'C' + strikePriceContract;
    //   let requestObj = {
    //     strategy: strategy.Name,
    //     action: action,
    //     direction: action === "Buy" ? "Long" : "Short",
    //     quantity: leg.Quantity * 100,
    //     limitPrice: leg.LimitPrice,
    //     contract: contract,
    //     symbol: this.ConfirmedStrategyOrder.symbol,
    //     type: "Limit",
    //     strikePrice: leg.StrikePrice,
    //     GUID: ""
    //   };

    //   console.log("Confirm send strategy order...", JSON.stringify(requestObj));
    //   this.tradeService.placeStockOrder(requestObj).subscribe();
    // }
  }

  increaseOptionLimitPrice(): void {
    var price = this.OptionOrderForm.get('OptionLimitPrice');
    var tickIncrement = this.utilityService.getOptionTickSize(price?.value, true);
    var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
    this.OptionOrderForm.patchValue({ OptionLimitPrice: newPrice });
  }

  decreaseOptionLimitPrice(): void {
    var price = this.OptionOrderForm.get('OptionLimitPrice');
    var tickIncrement = this.utilityService.getOptionTickSize(price?.value, false);
    var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
    this.OptionOrderForm.patchValue({ OptionLimitPrice: newPrice });
  }

  increaseStockLimitPrice(): void {
    var price = this.StockOrderForm.get('StockLimitPrice');
    var tickIncrement = this.utilityService.getStockTickSize(price?.value, true);
    var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
    this.StockOrderForm.patchValue({ StockLimitPrice: newPrice });
  }

  decreaseStockLimitPrice(): void {
    var price = this.StockOrderForm.get('StockLimitPrice');
    var tickIncrement = this.utilityService.getStockTickSize(price?.value, false);
    var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
    this.StockOrderForm.patchValue({ StockLimitPrice: newPrice });
  }

  increaseStockStopPrice(): void {
    var price = this.StockOrderForm.get('StockStopPrice');
    var tickIncrement = this.utilityService.getStockTickSize(price?.value, true);
    var newPrice = parseFloat((parseFloat(price?.value) + tickIncrement).toFixed(4));
    this.StockOrderForm.patchValue({ StockStopPrice: newPrice });
  }

  decreaseStockStopPrice(): void {
    var price = this.StockOrderForm.get('StockStopPrice');
    var tickIncrement = this.utilityService.getStockTickSize(price?.value, false);
    var newPrice = parseFloat((parseFloat(price?.value) - tickIncrement).toFixed(4));
    this.StockOrderForm.patchValue({ StockStopPrice: newPrice });
  }

  switchToOptionTab(): void {
    console.log("Switch to option tab");
    this.currentProductListTab = 'product-list-option';
    if (this.SelectedProduct) {
      this.OptionSnapshotData = [];
      this.isLoading = true;
      var symbol = this.SelectedProduct.Symbol;

      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        // Last Traded Price required here to determine center point of option chain table
        this.placeOrderLastTradedPrice = value.LastTradedPrice;
        this.OptionExpiryDates$ = this.optionsService.getExpiryDates(symbol).pipe(share());
        this.OptionExpiryDates$.pipe(take(1)).subscribe((value) => {
          this.SelectedOptionExpiryDate = value.DefaultExpiryDate;
          this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());

          this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
            this.OptionOrderForm.patchValue({ OptionProduct: symbol+ this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
            this.isLoading = false;
            this.OptionSnapshotData = value;
            this.OptionSnapshotDataClone = value;

            this.setTableColumnStatus(value);

            this.tableScrollByType(this.selectedType);

          });
        });
      });
    }
  }

  filterColumns(index: number){
    this.placeOrderColumns[index].checked = !this.placeOrderColumns[index].checked;
    setTimeout(() => this.table1Scroll.nativeElement.scrollLeft += 9999999999*2, 1000);
    setTimeout(() => this.table3Scroll.nativeElement.scrollLeft += 0, 1000);
  }

  switchToStockTab(): void {
    console.log("Switch to stock tab");
    this.currentProductListTab = 'product-list-stock';
    if (this.SelectedProduct) {
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        this.StockOrderForm.patchValue({ StockLimitPrice: value.AskPrice });
        this.StockOrderForm.patchValue({ StockStopPrice: value.AskPrice });
      });
    }
  }

  switchToProductListTab(): void {
    console.log("Switch to product list tab");
    this.currentTradeTab = 'by-product';
    this.switchToOptionTab();
  }

  switchToStrategyTab(): void {
    console.log("Switch to strategy tab");
    this.currentTradeTab = 'by-strategy';
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;

      // Get data to show Underlying Price
      this.isLoadingStrategyContractResult = true;
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        var strategy = this.ByStrategyForm.get('SelectedStrategy')?.value;
        var amount = this.ByStrategyForm.get('Amount')?.value;

        if (strategy) {
          if (strategy.Name === 'DeltaNeutral') {
            this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
          }
          
          this.OptionParameterList = this.utilityService.getOptionParameters(strategy.Name);
          var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
          legs.clear();

          // if (this.screenerOptions === "Optimal_Strategy") {
          //   var data = this.screenerService.getAiContracts({
          //     Strategy: strategy.Name, 
          //     Symbol: symbol,
          //     Amount: amount
          //   });
          //   data.subscribe(value => {
          //     legs.clear();
          //     var group = value.Legs.map(x => this.formBuilder.group(
          //       {
          //         Action: x.Action,
          //         OrderType: x.OrderType,
          //         Direction: x.Direction,
          //         Rights: x.Rights,
          //         Quantity: x.Quantity,
          //         StrikePrice: x.StrikePrice,
          //         Expiry: x.Expiry,
          //         LimitPrice: x.LimitPrice,
          //         FairValue: x.FairValue
          //       }
          //     ));
          //     group.forEach(Leg => legs.push(Leg));
          //     this.isLoadingStrategyContractResult = false;
          //   });
          // }
          // else 
          {
            var data2 = this.utilityService.getSampleContract(strategy.Name, symbol, value.LastTradedPrice);
            data2.subscribe(value => {
              legs.clear();
              var group = value.map(x => this.formBuilder.group(
                {
                  Action: x.Action,
                  OrderType: x.OrderType,
                  Direction: x.Direction,
                  Rights: x.Rights,
                  Quantity: x.Quantity,
                  StrikePrice: x.StrikePrice,
                  Expiry: x.Expiry,
                  LimitPrice: x.LimitPrice,
                  FairValue: x.FairValue
                }
              ));
              group.forEach(Leg => legs.push(Leg));
              this.isLoadingStrategyContractResult = false;
            });
          }
        }
      });
    }
  }

  loadOptionModal(productId: number, symbol: string): void {
    console.log("Place order button clicked from screener entry");
    this.productService.getProductFromSymbol(symbol).pipe(take(1)).subscribe(result => {
      this.SelectedProduct = result.Data;
      if (this.screenerOptions === "Optimal_Strategy") {
        this.ByStrategyForm.patchValue({ SelectedStrategy: this.SelectedStrategy });
        this.ByStrategyForm.patchValue({ SelectedStock: this.SelectedProduct });
      } else {
        this.ByStrategyForm.patchValue({ SelectedStrategy: undefined });
      }
      this.switchToStrategyTab();
    });
  }

  onStockActionChanged(action: string) {
    if (action === "Buy") {
      this.StockData$.pipe(take(1)).subscribe(value => {
        //console.log(JSON.stringify(value));
        this.StockOrderForm.patchValue({ StockLimitPrice: value.AskPrice });
        this.StockOrderForm.patchValue({ StockStopPrice: value.AskPrice });
      });
    } else if (action === "Sell") {
      this.StockData$.pipe(take(1)).subscribe(value => {
        //console.log(JSON.stringify(value));
        this.StockOrderForm.patchValue({ StockLimitPrice: value.BidPrice });
        this.StockOrderForm.patchValue({ StockStopPrice: value.BidPrice });
      });
    }
  }

  onExpiryDateChanged(selectedDate: string) {
    this.isLoading = true;
    console.log("Selected date: " + selectedDate);
    this.SelectedOptionExpiryDate = selectedDate;
    if (this.SelectedProduct) {
      var symbol = this.SelectedProduct.Symbol;
      this.StockData$ = this.tradeService.getMarketData(this.SelectedProduct.ProductId).pipe(share());
      this.StockData$.pipe(take(1)).subscribe(value => {
        // Last Traded Price required here to determine center point of option chain table
        this.placeOrderLastTradedPrice = value.LastTradedPrice;
        this.OptionSnapshot$ = this.optionsService.getOptionChain(symbol, this.SelectedOptionExpiryDate).pipe(share());
        this.OptionSnapshot$.pipe(take(1)).subscribe(value => {
          if (this.SelectedProduct) {
            this.OptionOrderForm.patchValue({ OptionProduct: symbol + this.SelectedOptionExpiryDate.split("-").join("").slice(2) + "C" + this.utilityService.parseStrikePrice(value[0].StrikePrice) });
          }
          this.OptionSnapshotData = value;
          this.OptionSnapshotDataClone = value;
          this.isLoading = false;

          this.setTableColumnStatus(value);

          this.tableScrollByType(this.selectedType);

        })
      });
    }
  }

  onPlaceOrderStrategyChanged(selectedStrategy: OptionsStrategy) {
    if (selectedStrategy) {
      this.OptionParameterList = this.utilityService.getOptionParameters(selectedStrategy.Name);
      this.ByStrategyForm.patchValue({ SelectedParameter: this.OptionParameterList[0] });
      if (selectedStrategy.Name === 'DeltaNeutral') {
        this.ByStrategyForm.patchValue({ Quantity: 100 });        
      }
      else {
        this.ByStrategyForm.patchValue({ Quantity: 1 });
      }
      this.isLoadingStrategyContractResult = true;
      this.StockData$.pipe(take(1)).subscribe(value => {
        if (this.SelectedProduct) {
          if (selectedStrategy.Name === 'DeltaNeutral') {
            this.ByStrategyForm.patchValue({ LimitPrice: value.LastTradedPrice });        
          }

          var legs = this.ByStrategyForm.controls["Legs"] as FormArray;
          legs.clear()
          var data = this.utilityService.getSampleContract(selectedStrategy.Name, this.SelectedProduct?.Symbol, value.LastTradedPrice);
          data.subscribe(value => {
            legs.clear();
            var group = value.map(x => this.formBuilder.group(
              {
                Action: x.Action,
                OrderType: x.OrderType,
                Direction: x.Direction,
                Rights: x.Rights,
                Quantity: x.Quantity,
                StrikePrice: x.StrikePrice,
                Expiry: x.Expiry,
                LimitPrice: x.LimitPrice,
                FairValue: x.FairValue
              }
            ));
            group.forEach(Leg => legs.push(Leg));
            this.isLoadingStrategyContractResult = false;
          });
          //this.ByStrategyForm.patchValue({Legs: this.utilityService.getSampleContract(selectedStrategy.Name, this.SelectedProduct?.Symbol, value.LastTradedPrice)});
        }
      });
    } else {
      this.OptionParameterList = this.utilityService.getOptionParameters("");
      this.ByStrategyForm.patchValue({ SelectedParameter: this.OptionParameterList[0] });
      this.ByStrategyForm.patchValue({ Legs: [] });
    }
  }

  resetCallTableIfIsRowSelected() {
    this.OptionSnapshotData.map((snapshoot: any) => {
      if (snapshoot.Call.isSelected !== undefined) {
        delete snapshoot.Call.isSelected;
      }
      return snapshoot;
    });
  }

  resetPutTableIfRowIsSelected() {
    this.OptionSnapshotData.map((snapshoot: any) => {
      if (snapshoot.Put.isSelected !== undefined) {
        delete snapshoot.Put.isSelected;
      }
      return snapshoot;
    });
  }

  setSelectedPlaceOrderRowCall(snapshootObj: OptionSnapshot): void {
    this.resetCallTableIfIsRowSelected();
    this.resetPutTableIfRowIsSelected();
    snapshootObj.Call.isSelected = true;
    console.log("snapshootObj.Call: ", snapshootObj.Call);
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;

    this.SelectedOptionContract = snapshootObj.Call.Ticker;
    if (action === "Buy") {
      this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Call.Ask });
    } else if (action === "Sell") {
      this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Call.Bid });
    }
  }

  setSelectedPlaceOrderRowPut(snapshootObj: OptionSnapshot): void {
    this.resetCallTableIfIsRowSelected();
    this.resetPutTableIfRowIsSelected();
    snapshootObj.Put.isSelected = true;
    console.log("snapshootObj.Put: ", snapshootObj.Put);
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;

    this.SelectedOptionContract = snapshootObj.Put.Ticker;
    if (action === "Buy") {
      this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Put.Ask });
    } else if (action === "Sell") {
      this.OptionOrderForm.patchValue({ OptionLimitPrice: snapshootObj.Put.Bid });
    }
  }

  loadCalculatorModal() {
    this.ProfitLossResult = 0;
    var currentState = this.CalculatorFormGroup.get('CurrentState.Legs') as FormArray;
    var nextState = this.CalculatorFormGroup.get('NextState.Legs') as FormArray;
    nextState.clear()
    currentState.clear()
    var action = this.OptionOrderForm.get('SelectedOptionAction')?.value;
    var quantity = this.OptionOrderForm.get('OptionQuantity')?.value;
    var limitPrice = this.OptionOrderForm.get('OptionLimitPrice')?.value;
    var direction = action === "Buy" ? "Long" : "Short";
    var symbol = this.SelectedProduct?.Symbol;
    this.CalculatorFormGroup.patchValue({ Symbol: symbol });
    var optionSymbol = this.SelectedOptionContract;

    if (optionSymbol) {
      var optionContract = this.utilityService.parseOption(optionSymbol);

      this.CalculatorFormGroup.patchValue({ Strategy: direction + " " + optionContract.Right });
      var obj = {
        Strategy: direction + " " + optionContract.Right,
        Symbol: symbol,
        Stock: {
          Direction: direction,
          Quantity: this.OptionOrderForm.get('Quantity')?.value
        },
        Options: [{
          LegId: 1,
          Action: action,
          OrderType: "Limit",
          Direction: direction,
          Rights: optionContract.Right,
          Quantity: quantity,
          StrikePrice: optionContract.StrikePrice,
          Expiry: optionContract.Expiry,
          LimitPrice: limitPrice,
          FairValue: limitPrice
        }]
      }
      this.MaxProfitLoss$ = this.calculatorService.getMaxProfitLoss(obj);
      this.calculatorService.getCurrentState(obj).subscribe(result => {
        var group = result.Legs.map(x => this.formBuilder.group(
          {
            LegId: x.LegId,
            IV: x.IV,
          }
        ));
        var nextGroup = result.Legs.map(x => this.formBuilder.group(
          {
            LegId: x.LegId,
            IV: x.IV * 100,
          }
        ));
        this.CalculatorFormGroup.get('CurrentState')?.patchValue({ StockPrice: result.StockPrice });
        this.CalculatorFormGroup.get('NextState')?.patchValue({ StockPrice: result.StockPrice });
        group.forEach(Leg => currentState.push(Leg));
        nextGroup.forEach(Leg => nextState.push(Leg));
      })
    }
  }

  loadStrategyCalculatorModal() {
    this.ProfitLossResult = 0;
    var currentState = this.CalculatorFormGroup.get('CurrentState.Legs') as FormArray;
    var nextState = this.CalculatorFormGroup.get('NextState.Legs') as FormArray;
    nextState.clear()
    currentState.clear()
    this.CalculatorFormGroup.patchValue({ Symbol: this.SelectedProduct?.Symbol });
    this.CalculatorFormGroup.patchValue({ Strategy: this.ByStrategyForm.get("SelectedStrategy")?.value.Display });
    var obj = {
      Strategy: this.ByStrategyForm.get("SelectedStrategy")?.value.Name,
      Symbol: this.SelectedProduct?.Symbol,
      Stock: {
        Direction: this.ByStrategyForm.get('Action')?.value === "Buy" ? "Long" : "Short",
        Quantity: this.ByStrategyForm.get('Quantity')?.value
      },
      Options:this.ByStrategyForm.get('Legs')?.value
    }
    this.MaxProfitLoss$ = this.calculatorService.getMaxProfitLoss(obj);
    this.calculatorService.getCurrentState(obj).subscribe(result => {
      var group = result.Legs.map(x => this.formBuilder.group(
        {
          LegId: x.LegId,
          IV: x.IV,
        }
      ));
      var nextGroup = result.Legs.map(x => this.formBuilder.group(
        {
          LegId: x.LegId,
          IV: x.IV * 100,
        }
      ));
      this.CalculatorFormGroup.get('CurrentState')?.patchValue({ StockPrice: result.StockPrice });
      this.CalculatorFormGroup.get('NextState')?.patchValue({ StockPrice: result.StockPrice });
      group.forEach(Leg => currentState.push(Leg));
      nextGroup.forEach(Leg => nextState.push(Leg));

    })
  }

  computeProfitLoss() {
    var obj = this.CalculatorFormGroup.value;

    this.calculatorService.calculateProfit(obj).subscribe(result => {
      this.ProfitLossResult = result;
    });
  }

  sortColumns(columnName: string, orderType: string){

    this.currentSortedColumn = {
      name: columnName,
      type: orderType
    }
    this.isLoadingScreenerResult = true;
    if (this.screenerOptions === 'Optimal_Strategy') {
      this.generateScreenerResult();        
    } else if (this.screenerOptions === 'Prediction') {
      this.generateScreenerResult();
    } else if (this.screenerOptions === 'All') {
      this.generateTradeIdeaResult();  
    }
  }

  ngOnInit(): void {
    this.initBrokerAccounts();
    //Fundamental
    //Financial Ratio
    this.analysisFilterFundamental.financialRatio.priceToEarning.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.financialRatio.priceToSales.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.financialRatio.pricetoBook.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.financialRatio.debttoEquity.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());

    //Margins And Yield
    this.analysisFilterFundamental.marginsAndYield.grossMargins.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.marginsAndYield.netMargins.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.marginsAndYield.dividendYield.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());

    //Benchmarking
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.calendarSelectionYears = this.generateCalendarSelectionYears(42, moment().year());
    
    this.setScreenerOptionType(this.screenerOptions);
  }

  async initBrokerAccounts(){       
    var allBrokerAccounts = [];
    if (localStorage.getItem('accountSelections') !== null) {
      allBrokerAccounts = JSON.parse(localStorage.getItem('accountSelections') || '[]');
    }
    this.AvailableBrokerAccounts = allBrokerAccounts.filter(function (x: any) {
      return true;
      // return x.brokerType === 'Tiger';
    })
    this.StockOrderForm.patchValue({ SelectedAccount: this.AvailableBrokerAccounts[0] });
    this.OptionOrderForm.patchValue({ SelectedAccount: this.AvailableBrokerAccounts[0] });
    this.ByStrategyForm.patchValue({ SelectedAccount: this.AvailableBrokerAccounts[0] });
  }

  ngOnDestroy() {
  }

  //Custom filter tab functions
  moreStockCriteria(){

  }

  getMeanIVData(){
    let n_left = 5;
    let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Mean IV"});
    dynamicArr.push({name: "<5%", checked: false});
    for (let i = 1; i <= 18; i++) {
      dynamicArr.push({name: n_left + "%" + " to " + n_right + "%", checked: false});
      n_left =+ n_left+5;
      n_right =+ n_right+5;
      if(i === 18){
        dynamicArr.push({name: ">95%", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }

  getPutCallRatioData(){
    let n_left = 5;
    let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Put/Call Ratio", checked: false});
    dynamicArr.push({name: "<5th percentile ", checked: false});
    for (let i = 1; i <= 18; i++) {
      dynamicArr.push({name: n_left +"th percentile" + " to " + n_right +"th percentile", checked: false});
      n_left =+ n_left+5;
      n_right =+ n_right+5;
      if(i === 18){
        dynamicArr.push({name: ">95th percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }

  getOptionInterestData(){
    let n_left = 5;
    let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Option Interest", checked: false});
    dynamicArr.push({name: "<5th percentile ", checked: false});
    for (let i = 1; i <= 18; i++) {
      dynamicArr.push({name: n_left +"th percentile" + " to " + n_right +"th percentile", checked: false});
      n_left =+ n_left+5;
      n_right =+ n_right+5;
      if(i === 18){
        dynamicArr.push({name: ">95th percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }

  meanIVShareCheckedList(item:any[]){
    this.meanIVShareFilterCheckedArrayList = item;
    this.setCustomTabApliedFilterCount();
    //console.log("meanIVShareCheckedList: ", item);
  }
  meanIVShareIndividualCheckedList(item:{}){
    //console.log("meanIVShareIndividualCheckedList: ", item);
  }

  removeStockUniverseFilter(){
    this.selectedStockUniverse = this.stockUniverseList[0];
    this.setCustomTabApliedFilterCount();
  }

  removeMeanIVFilter(meanIVFilterListIndex: number, meanIVListIndex: number){
    if(this.meanIVShareFilterCheckedArrayList.length){
      this.meanIVShareFilterCheckedArrayList.splice(meanIVFilterListIndex, 1);
    }
    if(this.meanIVList.length){
      if(this.meanIVList[meanIVListIndex] !== undefined){
        this.meanIVList[meanIVListIndex].checked = false;
      }
    }
    this.setCustomTabApliedFilterCount();
  }

  removePutCallRatioFilter(){
    this.selectedPutCallRatio = this.putCallRatioList[0];
    this.setCustomTabApliedFilterCount();
  }

  removeOptionInterestFilter(){
    this.selectedOptionInterest = this.optionInterestList[0];
    this.setCustomTabApliedFilterCount();
  }

  removeUnusualSurgeofOptionVolumeFilter(){
    this.unusualSurgeofOptionVolume = false;
    this.setCustomTabApliedFilterCount();
  }

  setCustomTabApliedFilterCount(): void{
    let count = 0;
    let countMeanIVFilter = 0;
    if(this.selectedStockUniverse.id !== null){
      count += 1;
    }
    if(this.selectedPutCallRatio.name !== 'Select Put/Call Ratio'){
      count += 1;
    }
    if(this.selectedOptionInterest.name !== 'Select Option Interest'){
      count += 1;
    }
    if(this.unusualSurgeofOptionVolume){
      count += 1;
    }
    if(this.meanIVShareFilterCheckedArrayList.length){
      countMeanIVFilter = this.meanIVShareFilterCheckedArrayList.length;
      count += countMeanIVFilter;
    }
    this.customTabAppliedFilterCount = count;
  }


  //Analysis Filter
  resetAnalysisFilterOptions(){

    //Fundamental
    //Financial Ratio
    this.analysisFilterFundamental.financialRatio.priceToEarning.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.priceToSales.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.pricetoBook.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.pricetoIntrinsic.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.debttoEquity.isOptionsVisible = false;
    this.analysisFilterFundamental.financialRatio.freeCashFlowtoDebt.isOptionsVisible = false;

    //Margins And Yield
    this.analysisFilterFundamental.marginsAndYield.grossMargins.isOptionsVisible = false;
    this.analysisFilterFundamental.marginsAndYield.netMargins.isOptionsVisible = false;
    this.analysisFilterFundamental.marginsAndYield.freeCashFlowYeild.isOptionsVisible = false;
    this.analysisFilterFundamental.marginsAndYield.dividendYield.isOptionsVisible = false;

    //Growth Metric
    this.analysisFilterFundamental.growthMetric.earningGrowth.isOptionsVisible = false;
    this.analysisFilterFundamental.growthMetric.revenueGrowth.isOptionsVisible = false;

    //Benchmarking
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.isOptionsVisible = false;
    this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.isOptionsVisible = false;

    //Categorisation
    this.analysisFilterFundamental.categorisation.marketCap.isOptionsVisible = false;
    this.analysisFilterFundamental.categorisation.sector.isOptionsVisible = false;
    this.analysisFilterFundamental.categorisation.industry.isOptionsVisible = false;
    this.analysisFilterFundamental.categorisation.index.isOptionsVisible = false;

    //Technical
    //Basic
    this.analysisFilterTechnicals.basic.price.isOptionsVisible = false;
    this.analysisFilterTechnicals.basic.volume.isOptionsVisible = false;
    this.analysisFilterTechnicals.basic.barPattern.isOptionsVisible = false;

    //Trend Identifier/Analysis
    this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.isOptionsVisible = false;
    this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.isOptionsVisible = false;

    //Consolidation
    this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.isOptionsVisible = false;
    this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.isOptionsVisible = false;
    this.analysisFilterTechnicals.consolidation.trianglePattern.isOptionsVisible = false;
    this.analysisFilterTechnicals.consolidation.SMAofVolatility.isOptionsVisible = false;
    this.analysisFilterTechnicals.consolidation.SMAofTrueRange.isOptionsVisible = false;
    this.analysisFilterTechnicals.consolidation.horizontalSR.isOptionsVisible = false;

    //Divergence
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.isOptionsVisible = false;
    this.analysisFilterTechnicals.divergence.rateOfPriceChange.isOptionsVisible = false;
    this.analysisFilterTechnicals.divergence.divergenceStrategy.isOptionsVisible = false;

    //Risk Characteristic/Measure
    this.analysisFilterTechnicals.riskCharacteristicMeasure.trueRangePercent.isOptionsVisible = false;
    this.analysisFilterTechnicals.riskCharacteristicMeasure.volatility.isOptionsVisible = false;
    this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.isOptionsVisible = false;
    this.analysisFilterTechnicals.riskCharacteristicMeasure.beta.isOptionsVisible = false;
    this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.isOptionsVisible = false;

    //Momentum
    this.analysisFilterTechnicals.momentum.MACD.isOptionsVisible = false;
    this.analysisFilterTechnicals.momentum.RSI.isOptionsVisible = false;
    this.analysisFilterTechnicals.momentum.stochasticOscillator.isOptionsVisible = false;
    this.analysisFilterTechnicals.momentum.ADX.isOptionsVisible = false;
    this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.isOptionsVisible = false;

    //Breakout
    this.analysisFilterTechnicals.breakout.majorPriceBreakout.isOptionsVisible = false;
    this.analysisFilterTechnicals.breakout.peakTroughBreakout.isOptionsVisible = false;
    this.analysisFilterTechnicals.breakout.historicalBreakout.isOptionsVisible = false;
    this.analysisFilterTechnicals.breakout.fibonacciBreakout.isOptionsVisible = false;

    //Main Tab Sentiment
    this.analysisFilterSentiment.analystRating.isOptionsVisible = false;
    this.analysisFilterSentiment.newsbasedPriceTrigger.isOptionsVisible = false;
    this.analysisFilterSentiment.targetPrice.isOptionsVisible = false;
    this.analysisFilterSentiment.analystAction.isOptionsVisible = false;

    //Main Tab Event
    this.analysisFilterEvent.volumeBreakout.isOptionsVisible = false;
    this.analysisFilterEvent.unusualGap.isOptionsVisible = false;
    this.analysisFilterEvent.nearEarningAnnouncement.isOptionsVisible = false;
    this.analysisFilterEvent.newsVolumeBreakout.isOptionsVisible = false;
    this.analysisFilterEvent.newsTrigger.isOptionsVisible = false;

  }
  generateCalendarSelectionYears(count: any, startYear: any){
    const yearList = [];
    const year = startYear || new Date().getFullYear();
    for(let i = 0; i < count; i+=1 ){
        yearList.push(Number(year)-i)
    }
    return yearList.sort((a,b)=>a-b)
  }
  getAnalysisFilterPercentageMultiDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0% Percentile", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th% Percentile", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th% Percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }
  getAnalysisFilterMultiWithoutPercentageSignDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0 Percentile", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th Percentile", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th Percentile", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }
  getAnalysisFilterMultiDropdownValueData(){
    let n_left = 5;
    //let n_right = 10;
    let dynamicArr = [];
    dynamicArr.push({name: "Select Value"});
    dynamicArr.push({name: "0", checked: false});
    for (let i = 1; i <= 19; i++) {
      dynamicArr.push({name: n_left + "th", checked: false});
      n_left =+ n_left+5;
      //n_right =+ n_right+5;
      if(i === 19){
        dynamicArr.push({name: "100th", checked: false});
        return dynamicArr;
      }
    }
    return dynamicArr;
  }

  //Fundamental -> Financial Ratios -> Price to Earning
  viewFundamentalFinancialRatioPriceToEarningOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.priceToEarning.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioPriceToEarningOptions(){
    this.analysisFilterFundamental.financialRatio.priceToEarning.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioPriceToEarningOperator(){
    console.log("Price to Earning: ", this.analysisFilterFundamental.financialRatio.priceToEarning.operator);
  }
  setFundamentalFinancialRatioPriceToEarningPeriod(){
    console.log("Price to Earning: ", this.analysisFilterFundamental.financialRatio.priceToEarning.period);
  }
  setFundamentalFinancialRatioPriceToEarningCalendarSelection(){
    console.log("Price to Earning: ", this.analysisFilterFundamental.financialRatio.priceToEarning.calendarSelection);
  }
  setFundamentalFinancialRatioPriceToEarningCalendarSelectionType(){
    console.log("Price to Earning: ", this.analysisFilterFundamental.financialRatio.priceToEarning.calendarSelectionType);
  }

  //Fundamental -> Financial Ratios -> Price to Sales
  viewFundamentalFinancialRatioPriceToSalesOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.priceToSales.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioPriceToSalesOptions(){
    this.analysisFilterFundamental.financialRatio.priceToSales.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioPriceToSalesOperator(){
    console.log("Price to Sales: ", this.analysisFilterFundamental.financialRatio.priceToSales.operator);
  }
  setFundamentalFinancialRatioPriceToSalesPeriod(){
    console.log("Price to Sales: ", this.analysisFilterFundamental.financialRatio.priceToSales.period);
  }
  setFundamentalFinancialRatioPriceToSalesCalendarSelection(){
    console.log("Price to Sales: ", this.analysisFilterFundamental.financialRatio.priceToSales.calendarSelection);
  }
  setFundamentalFinancialRatioPriceToSalesCalendarSelectionType(){
    console.log("Price to Sales: ", this.analysisFilterFundamental.financialRatio.priceToSales.calendarSelectionType);
  }

  //Fundamental -> Financial Ratios -> Price to Earning Growth
  viewFundamentalFinancialRatioPricetoEarningGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioPricetoEarningGrowthOptions(){
    this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioPricetoEarningGrowthOperator(){
    console.log("Price to Earning Growth: ", this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.operator);
  }
  setFundamentalFinancialRatioPricetoEarningGrowthPeriod(){
    console.log("Price to Earning Growth: ", this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.period);
  }
  setFundamentalFinancialRatioPricetoEarningGrowthCalendarSelection(){
    console.log("Price to Earning Growth: ", this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.calendarSelection);
  }
  setFundamentalFinancialRatioPricetoEarningGrowthCalendarSelectionType(){
    console.log("Price to Earning Growth: ", this.analysisFilterFundamental.financialRatio.pricetoEarningGrowth.calendarSelectionType);
  }

  //Fundamental -> Financial Ratios -> Price to Book
  viewFundamentalFinancialRatioPricetoBookOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.pricetoBook.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioPricetoBookOptions(){
    this.analysisFilterFundamental.financialRatio.pricetoBook.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioPricetoBookOperator(){
    console.log("Price to Book: ", this.analysisFilterFundamental.financialRatio.pricetoBook.operator);
  }
  setFundamentalFinancialRatioPricetoBookPeriod(){
    console.log("Price to Book: ", this.analysisFilterFundamental.financialRatio.pricetoBook.period);
  }
  setFundamentalFinancialRatioPricetoBookCalendarSelection(){
    console.log("Price to Book: ", this.analysisFilterFundamental.financialRatio.pricetoBook.calendarSelection);
  }
  setFundamentalFinancialRatioPricetoBookCalendarSelectionType(){
    console.log("Price to Book: ", this.analysisFilterFundamental.financialRatio.pricetoBook.calendarSelectionType);
  }

  //Fundamental -> Financial Ratios -> Price to Intrinsic
  viewFundamentalFinancialRatioPricetoIntrinsicOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.pricetoIntrinsic.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioPricetoIntrinsicOptions(){
    this.analysisFilterFundamental.financialRatio.pricetoIntrinsic.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioPricetoIntrinsicOperator(){
    console.log("Price to Intrinsic: ", this.analysisFilterFundamental.financialRatio.pricetoIntrinsic.operator);
  }

  //Fundamental -> Financial Ratios -> Debt to Equity
  viewFundamentalFinancialRatioDebttoEquityOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.debttoEquity.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioDebttoEquityOptions(){
    this.analysisFilterFundamental.financialRatio.debttoEquity.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioDebttoEquityOperator(){
    console.log("Debt to Equity: ", this.analysisFilterFundamental.financialRatio.debttoEquity.operator);
  }
  setFundamentalFinancialRatioDebttoEquityPeriod(){
    console.log("Debt to Equity: ", this.analysisFilterFundamental.financialRatio.debttoEquity.period);
  }
  setFundamentalFinancialRatioDebttoEquityCalendarSelection(){
    console.log("Debt to Equity: ", this.analysisFilterFundamental.financialRatio.debttoEquity.calendarSelection);
  }
  setFundamentalFinancialRatioDebttoEquityCalendarSelectionType(){
    console.log("Debt to Equity: ", this.analysisFilterFundamental.financialRatio.debttoEquity.calendarSelectionType);
  }

  //Fundamental -> Financial Ratios -> Free Cash Flow to Debt
  viewFundamentalFinancialRatioFreeCashFlowtoDebtOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.financialRatio.freeCashFlowtoDebt.isOptionsVisible = true;
  }
  hideFundamentalFinancialRatioFreeCashFlowtoDebtOptions(){
    this.analysisFilterFundamental.financialRatio.freeCashFlowtoDebt.isOptionsVisible = false;
  }
  setFundamentalFinancialRatioFreeCashFlowtoDebtOperator(){
    console.log("Free Cash Flow to Debt: ", this.analysisFilterFundamental.financialRatio.freeCashFlowtoDebt.operator);
  }

  //Fundamental -> Margins and Yield -> Gross Margins
  viewFundamentalMarginsandYieldGrossMarginsOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.marginsAndYield.grossMargins.isOptionsVisible = true;
  }
  hideFundamentalMarginsandYieldGrossMarginsOptions(){
    this.analysisFilterFundamental.marginsAndYield.grossMargins.isOptionsVisible = false;
  }
  setFundamentalMarginsandYieldGrossMarginsOperator(){
    console.log("Gross Margins: ", this.analysisFilterFundamental.marginsAndYield.grossMargins.operator);
  }
  setFundamentalMarginsandYieldGrossMarginsPeriod(){
    console.log("Gross Margins: ", this.analysisFilterFundamental.marginsAndYield.grossMargins.period);
  }
  setFundamentalMarginsandYieldGrossMarginsCalendarSelection(){
    console.log("Gross Margins: ", this.analysisFilterFundamental.marginsAndYield.grossMargins.calendarSelection);
  }
  setFundamentalMarginsandYieldGrossMarginsCalendarSelectionType(){
    console.log("Gross Margins: ", this.analysisFilterFundamental.marginsAndYield.grossMargins.calendarSelectionType);
  }

  //Fundamental -> Margins and Yield -> Net Margins
  viewFundamentalMarginsandYieldNetMarginsOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.marginsAndYield.netMargins.isOptionsVisible = true;
  }
  hideFundamentalMarginsandYieldNetMarginsOptions(){
    this.analysisFilterFundamental.marginsAndYield.netMargins.isOptionsVisible = false;
  }
  setFundamentalMarginsandYieldNetMarginsOperator(){
    console.log("Net Margins: ", this.analysisFilterFundamental.marginsAndYield.netMargins.operator);
  }
  setFundamentalMarginsandYieldNetMarginsPeriod(){
    console.log("Net Margins: ", this.analysisFilterFundamental.marginsAndYield.netMargins.period);
  }
  setFundamentalMarginsandYieldNetMarginsCalendarSelection(){
    console.log("Net Margins: ", this.analysisFilterFundamental.marginsAndYield.netMargins.calendarSelection);
  }
  setFundamentalMarginsandYieldNetMarginsCalendarSelectionType(){
    console.log("Net Margins: ", this.analysisFilterFundamental.marginsAndYield.netMargins.calendarSelectionType);
  }

  //Fundamental -> Margins and Yield -> Free Cash Flow Yield
  viewFundamentalMarginsandYieldFreeCashFlowYieldOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.marginsAndYield.freeCashFlowYeild.isOptionsVisible = true;
  }
  hideFundamentalMarginsandYieldFreeCashFlowYieldOptions(){
    this.analysisFilterFundamental.marginsAndYield.freeCashFlowYeild.isOptionsVisible = false;
  }
  setFundamentalMarginsandYieldFreeCashFlowYieldOperator(){
    console.log("Free Cash Flow Yield: ", this.analysisFilterFundamental.marginsAndYield.freeCashFlowYeild.operator);
  }

  //Fundamental -> Margins and Yield -> Dividend Yield
  viewFundamentalMarginsandYieldDividendYieldOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.marginsAndYield.dividendYield.isOptionsVisible = true;
  }
  hideFundamentalMarginsandYieldDividendYieldOptions(){
    this.analysisFilterFundamental.marginsAndYield.dividendYield.isOptionsVisible = false;
  }
  setFundamentalMarginsandYieldDividendYieldOperator(){
    console.log("Dividend Yield: ", this.analysisFilterFundamental.marginsAndYield.dividendYield.operator);
  }
  setFundamentalMarginsandYieldDividendYieldPeriod(){
    console.log("Dividend Yield: ", this.analysisFilterFundamental.marginsAndYield.dividendYield.period);
  }
  setFundamentalMarginsandYieldDividendYieldCalendarSelection(){
    console.log("Dividend Yield: ", this.analysisFilterFundamental.marginsAndYield.dividendYield.calendarSelection);
  }
  setFundamentalMarginsandYieldDividendYieldCalendarSelectionType(){
    console.log("Dividend Yield: ", this.analysisFilterFundamental.marginsAndYield.dividendYield.calendarSelectionType);
  }

  //Fundamental -> Growth Metric -> Earning Growth
  viewFundamentalGrowthMetricEarningGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.growthMetric.earningGrowth.isOptionsVisible = true;
  }
  hideFundamentalGrowthMetricEarningGrowthOptions(){
    this.analysisFilterFundamental.growthMetric.earningGrowth.isOptionsVisible = false;
  }
  setFundamentalGrowthMetricEarningGrowthOperator(){
    console.log("Earning Growth: ", this.analysisFilterFundamental.growthMetric.earningGrowth.operator);
  }
  setFundamentalGrowthMetricEarningGrowthPeriod(){
    console.log("Earning Growth: ", this.analysisFilterFundamental.growthMetric.earningGrowth.period);
  }

  //Fundamental -> Growth Metric -> Revenue Growth
  viewFundamentalGrowthMetricRevenueGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.growthMetric.revenueGrowth.isOptionsVisible = true;
  }
  hideFundamentalGrowthMetricRevenueGrowthOptions(){
    this.analysisFilterFundamental.growthMetric.revenueGrowth.isOptionsVisible = false;
  }
  setFundamentalGrowthMetricRevenueGrowthOperator(){
    console.log("Revenue Growth: ", this.analysisFilterFundamental.growthMetric.revenueGrowth.operator);
  }
  setFundamentalGrowthMetricRevenueGrowthPeriod(){
    console.log("Revenue Growth: ", this.analysisFilterFundamental.growthMetric.revenueGrowth.period);
  }

  //Fundamental -> Benchmarking -> Relative Price to Earning
  viewFundamentalBenchmarkingRelativePricetoEarningOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativePricetoEarningOptions(){
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativePricetoEarningOperator(){
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.operator);
  }
  setFundamentalBenchmarkingRelativePricetoEarningCompareTo(){
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.compateTo);
  }
  setFundamentalBenchmarkingRelativePricetoEarningPeriod(){
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.period);
  }
  setFundamentalBenchmarkingRelativePricetoEarningCalendarSelection(){
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.calendarSelection);
  }
  setFundamentalBenchmarkingRelativePricetoEarningCalendarSelectionType(){
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.calendarSelectionType);
  }
  fundamentalBenchmarkingRelativePricetoEarningCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativePricetoEarning.selectedValue = item;
    console.log("Relative Price to Earning: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarning.selectedValue);
  }
  fundamentalBenchmarkingRelativePricetoEarningIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativePricetoEarningIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Price to Earning Growth
  viewFundamentalBenchmarkingRelativePricetoEarningGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativePricetoEarningGrowthOptions(){
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativePricetoEarningGrowthOperator(){
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.operator);
  }
  setFundamentalBenchmarkingRelativePricetoEarningGrowthCompareTo(){
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.compareTo);
  }
  setFundamentalBenchmarkingRelativePricetoEarningGrowthPeriod(){
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.period);
  }
  setFundamentalBenchmarkingRelativePricetoEarningGrowthCalendarSelection(){
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.calendarSelection);
  }
  setFundamentalBenchmarkingRelativePricetoEarningGrowthCalendarSelectionType(){
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.calendarSelectionType);
  }
  fundamentalBenchmarkingRelativePricetoEarningGrowthCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.selectedValue = item;
    console.log("Relative Price to Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativePricetoEarningGrowth.selectedValue);
  }
  fundamentalBenchmarkingRelativePricetoEarningGrowthIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativePricetoEarningGrowthIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Price to Book
  viewFundamentalBenchmarkingRelativePricetoBookOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativePricetoBookOptions(){
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativePricetoBookOperator(){
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.operator);
  }
  setFundamentalBenchmarkingRelativePricetoBookCompareTo(){
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.compareTo);
  }
  setFundamentalBenchmarkingRelativePricetoBookPeriod(){
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.period);
  }
  setFundamentalBenchmarkingRelativePricetoBookCalendarSelection(){
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.calendarSelection);
  }
  setFundamentalBenchmarkingRelativePricetoBookCalendarSelectionType(){
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.calendarSelectionType);
  }
  fundamentalBenchmarkingRelativePricetoBookCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativePricetoBook.selectedValue = item;
    console.log("Relative Price to Book: ", this.analysisFilterFundamental.benchmarking.relativePricetoBook.selectedValue);
  }
  fundamentalBenchmarkingRelativePricetoBookIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativePricetoBookIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Price to Sales
  viewFundamentalBenchmarkingRelativePricetoSalesOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativePricetoSalesOptions(){
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativePricetoSalesOperator(){
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.operator);
  }
  setFundamentalBenchmarkingRelativePricetoSalesCompareTo(){
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.compareTo);
  }
  setFundamentalBenchmarkingRelativePricetoSalesPeriod(){
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.period);
  }
  setFundamentalBenchmarkingRelativePricetoSalesCalendarSelection(){
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.calendarSelection);
  }
  setFundamentalBenchmarkingRelativePricetoSalesCalendarSelectionType(){
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.calendarSelectionType);
  }
  fundamentalBenchmarkingRelativePricetoSalesCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativePricetoSales.selectedValue = item;
    console.log("Relative Price to Sales: ", this.analysisFilterFundamental.benchmarking.relativePricetoSales.selectedValue);
  }
  fundamentalBenchmarkingRelativePricetoSalesIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativePricetoSalesIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Debt to Equity
  viewFundamentalBenchmarkingRelativeDebttoEquityOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativeDebttoEquityOptions(){
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativeDebttoEquityOperator(){
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.operator);
  }
  setFundamentalBenchmarkingRelativeDebttoEquityCompareTo(){
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.compareTo);
  }
  setFundamentalBenchmarkingRelativeDebttoEquityPeriod(){
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.period);
  }
  setFundamentalBenchmarkingRelativeDebttoEquityCalendarSelection(){
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.calendarSelection);
  }
  setFundamentalBenchmarkingRelativeDebttoEquityCalendarSelectionType(){
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.calendarSelectionType);
  }
  fundamentalBenchmarkingRelativeDebttoEquityCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.selectedValue = item;
    console.log("Relative Debt to Equity: ", this.analysisFilterFundamental.benchmarking.relativeDebttoEquity.selectedValue);
  }
  fundamentalBenchmarkingRelativeDebttoEquityIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativeDebttoEquityIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Earning Growth
  viewFundamentalBenchmarkingRelativeEarningGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativeEarningGrowthOptions(){
    this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativeEarningGrowthOperator(){
    console.log("Relative Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.operator);
  }
  setFundamentalBenchmarkingRelativeEarningGrowthCompareTo(){
    console.log("Relative Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.compareTo);
  }
  setFundamentalBenchmarkingRelativeEarningGrowthPeriod(){
    console.log("Relative Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.period);
  }
  fundamentalBenchmarkingRelativeEarningGrowthCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.selectedValue = item;
    console.log("Relative Earning Growth: ", this.analysisFilterFundamental.benchmarking.relativeEarningGrowth.selectedValue);
  }
  fundamentalBenchmarkingRelativeEarningGrowthIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativeEarningGrowthIndividualCheckedList: ", item);
  }

  //Fundamental -> Benchmarking -> Relative Revenue Growth
  viewFundamentalBenchmarkingRelativeRevenueGrowthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.isOptionsVisible = true;
  }
  hideFundamentalBenchmarkingRelativeRevenueGrowthOptions(){
    this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.isOptionsVisible = false;
  }
  setFundamentalBenchmarkingRelativeRevenueGrowthOperator(){
    console.log("Relative Revenue Growth: ", this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.operator);
  }
  setFundamentalBenchmarkingRelativeRevenueGrowthCompareTo(){
    console.log("Relative Revenue Growth: ", this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.compareTo);
  }
  setFundamentalBenchmarkingRelativeRevenueGrowthPeriod(){
    console.log("Relative Revenue Growth: ", this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.period);
  }
  fundamentalBenchmarkingRelativeRevenueGrowthCheckedList(item:any[]){
    this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.selectedValue = item;
    console.log("Relative Revenue Growth: ", this.analysisFilterFundamental.benchmarking.relativeRevenueGrowth.selectedValue);
  }
  fundamentalBenchmarkingRelativeRevenueGrowthIndividualCheckedList(item:{}){
    //console.log("fundamentalBenchmarkingRelativeRevenueGrowthIndividualCheckedList: ", item);
  }

  //Fundamental -> Categorisation -> Market Cap
  viewFundamentalCategorisationMarketCapOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.categorisation.marketCap.isOptionsVisible = true;
  }
  hideFundamentalCategorisationMarketCapOptions(){
    this.analysisFilterFundamental.categorisation.marketCap.isOptionsVisible = false;
  }
  setFundamentalCategorisationMarketCapValue(){
    console.log("Market Cap: ", this.analysisFilterFundamental.categorisation.marketCap.value);
  }

  //Fundamental -> Categorisation -> Sector
  viewFundamentalCategorisationSectorOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.categorisation.sector.isOptionsVisible = true;
  }
  hideFundamentalCategorisationSectorOptions(){
    this.analysisFilterFundamental.categorisation.sector.isOptionsVisible = false;
  }
  fundamentalCategorisationSectorCheckedList(item:any[]){
    this.analysisFilterFundamental.categorisation.sector.selectedValue = item;
    console.log("Sector Value: ", this.analysisFilterFundamental.categorisation.sector.selectedValue);
  }
  fundamentalCategorisationSectorIndividualCheckedList(item:{}){
    //console.log("fundamentalCategorisationSectorIndividualCheckedList: ", item);
  }

  //Fundamental -> Categorisation -> Industry
  viewFundamentalCategorisationIndustryOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.categorisation.industry.isOptionsVisible = true;
  }
  hideFundamentalCategorisationIndustryOptions(){
    this.analysisFilterFundamental.categorisation.industry.isOptionsVisible = false;
  }
  fundamentalCategorisationIndustryCheckedList(item:any[]){
    this.analysisFilterFundamental.categorisation.industry.selectedValue = item;
    console.log("Industry Value: ", this.analysisFilterFundamental.categorisation.industry.selectedValue);
  }
  fundamentalCategorisationIndustryIndividualCheckedList(item:{}){
    //console.log("fundamentalCategorisationIndustryIndividualCheckedList: ", item);
  }

  //Fundamental -> Categorisation -> Index
  viewFundamentalCategorisationIndexOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterFundamental.categorisation.index.isOptionsVisible = true;
  }
  hideFundamentalCategorisationIndexOptions(){
    this.analysisFilterFundamental.categorisation.index.isOptionsVisible = false;
  }
  setFundamentalCategorisationIndexValue(){
    console.log("Index: ", this.analysisFilterFundamental.categorisation.index.value);
  }

  //Technical -> Basic -> Price
  viewTechnicalBasicPriceOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.basic.price.isOptionsVisible = true;
  }
  hideTechnicalBasicPriceOptions(){
    this.analysisFilterTechnicals.basic.price.isOptionsVisible = false;
  }
  setTechnicalBasicPriceComparator(){
    console.log("Price: ", this.analysisFilterTechnicals.basic.price.comparator);
  }
  setTechnicalBasicPriceLast(){
    console.log("Price: ", this.analysisFilterTechnicals.basic.price.last);
  }
  setTechnicalBasicPriceAverageOf(){
    console.log("Price: ", this.analysisFilterTechnicals.basic.price.averageOf);
  }

  //Technical -> Basic -> Volume
  viewTechnicalBasicVolumeOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.basic.volume.isOptionsVisible = true;
  }
  hideTechnicalBasicVolumeOptions(){
    this.analysisFilterTechnicals.basic.volume.isOptionsVisible = false;
  }
  setTechnicalBasicVolumeComparator(){
    console.log("Volume: ", this.analysisFilterTechnicals.basic.volume.comparator);
  }
  setTechnicalBasicVolumeLast(){
    console.log("Volume: ", this.analysisFilterTechnicals.basic.volume.last);
  }
  setTechnicalBasicVolumeAverageOf(){
    console.log("Volume: ", this.analysisFilterTechnicals.basic.volume.averageOf);
  }

  //Technical -> Basic -> Bar Pattern
  viewTechnicalBasicBarPatternOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.basic.barPattern.isOptionsVisible = true;
  }
  hideTechnicalBasicBarPatternOptions(){
    this.analysisFilterTechnicals.basic.barPattern.isOptionsVisible = false;
  }
  setTechnicalBasicBarPatternValue1(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.value1);
  }
  setTechnicalBasicBarPatternComparator(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.comparator);
  }
  setTechnicalBasicBarPatternLastValue1(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.last1);
  }
  setTechnicalBasicBarPatternDaysWeekAgoValue1(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.days_week_ago_value1);
  }
  setTechnicalBasicBarPatternDaysWeekAgoV1(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.days_week_ago_1);
  }
  setTechnicalBasicBarPatternByFor(){
    if(this.analysisFilterTechnicals.basic.barPattern.byFor=='by_for'){
      this.analysisFilterTechnicals.basic.barPattern.any_or_value = "0";
    }
    if(this.analysisFilterTechnicals.basic.barPattern.byFor=='any_or'){
      this.analysisFilterTechnicals.basic.barPattern.byForValue = 'greater';
    }
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.byFor);
  }
  setTechnicalBasicBarPatternByForValue(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.byForValue);
  }
  setTechnicalBasicBarPatternAnyOrValue(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.any_or_value);
  }
  setTechnicalBasicBarPatternValue2(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.value2);
  }
  setTechnicalBasicBarPatternLastValue2(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.last2);
  }
  setTechnicalBasicBarPatternDaysWeekAgoValue2(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.days_week_ago_value2);
  }
  setTechnicalBasicBarPatternDaysWeekAgoV2(){
    console.log("Bar Pattern: ", this.analysisFilterTechnicals.basic.barPattern.days_week_ago_2);
  }

  //Technical -> Trend Identifier/Analysis -> SMA Strategy
  viewTechnicalTrendIdentifierAnalysisSMAStrategyOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisSMAStrategyOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyPeriodType(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.periodType);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValueType(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.valueType);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue1(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value1);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue1Period(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value1Period);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue1PeriodDaysWeekAgo(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value1PeriodSelected);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyComparator(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.comparator);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyComparatorValue(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.comparatorValue);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue2(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value2);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue2Period(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value2Period);
  }
  setTechnicalTrendIdentifierAnalysisSMAStrategyValue2PeriodDaysWeekAgo(){
    console.log("SMA Strategy: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.SMAStrategy.value2PeriodSelected);
  }

  //Technical -> Trend Identifier/Analysis -> Relative Strength to Benchmark
  viewTechnicalTrendIdentifierAnalysisRelativeStrengthtoBenchmarkOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisRelativeStrengthtoBenchmarkOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisRelativeStrengthtoBenchmarkLookback(){
    console.log("Relative Strength to Benchmark: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.lookback);
  }
  setTechnicalTrendIdentifierAnalysisRelativeStrengthtoBenchmarkBenchmark(){
    console.log("Relative Strength to Benchmark: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.benchmark);
  }
  setTechnicalTrendIdentifierAnalysisRelativeStrengthtoBenchmarkComparator(){
    console.log("Relative Strength to Benchmark: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.relativeStrengthtoBenchmark.comparator);
  }

  //Technical -> Trend Identifier/Analysis -> Parabolic Sar
  viewTechnicalTrendIdentifierAnalysisParabolicSarOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisParabolicSarOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisParabolicSarPeriodType(){
    console.log("Parabolic Sar: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.period);
  }
  setTechnicalTrendIdentifierAnalysisParabolicSarPeriodValue(){
    console.log("Parabolic Sar: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.last);
  }
  setTechnicalTrendIdentifierAnalysisParabolicSarPeriodValueDaysWeekAgoValue(){
    console.log("Parabolic Sar: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.days_week_ago_value);
  }
  setTechnicalTrendIdentifierAnalysisParabolicSarPeriodValueDaysWeekAgoSelected(){
    console.log("Parabolic Sar: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.days_week_ago);
  }
  setTechnicalTrendIdentifierAnalysisParabolicSarComparator(){
    console.log("Parabolic Sar: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.parabolicSar.comparator);
  }

  //Technical -> Trend Identifier/Analysis -> Price Trend
  viewTechnicalTrendIdentifierAnalysisPriceTrendOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisPriceTrendOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendBarType(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.barType);
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendValueType(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.valueType);
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendValue1(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.value1);
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendSMAPeriod(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.SMAPeriod);
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendLookback(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.lookback);
  }
  setTechnicalTrendIdentifierAnalysisPriceTrendDirection(){
    console.log("Price Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.priceTrend.direction);
  }

  //Technical -> Trend Identifier/Analysis -> Volume Trend
  viewTechnicalTrendIdentifierAnalysisVolumeTrendOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisVolumeTrendOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisVolumeTrendBarType(){
    console.log("Volume Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.barType);
  }
  setTechnicalTrendIdentifierAnalysisVolumeTrendValue1(){
    console.log("Volume Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.value1);
  }
  setTechnicalTrendIdentifierAnalysisVolumeTrendSMAPeriod(){
    console.log("Volume Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.SMAPeriod);
  }
  setTechnicalTrendIdentifierAnalysisVolumeTrendLookback(){
    console.log("Volume Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.lookback);
  }
  setTechnicalTrendIdentifierAnalysisVolumeTrendDirection(){
    console.log("Volume Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.volumeTrend.direction);
  }

  //Technical -> Trend Identifier/Analysis -> RSI Trend
  viewTechnicalTrendIdentifierAnalysisRSITrendOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisRSITrendOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisRSITrendBarType(){
    console.log("RSI Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.barType);
  }
  setTechnicalTrendIdentifierAnalysisRSITrendPeriod(){
    console.log("RSI Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.period);
  }
  setTechnicalTrendIdentifierAnalysisRSITrendDirection(){
    console.log("RSI Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.RSITrend.direction);
  }

  //Technical -> Trend Identifier/Analysis -> Accumulation & Distribution Trend
  viewTechnicalTrendIdentifierAnalysisAccumulationDistributionTrendOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisAccumulationDistributionTrendOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisAccumulationDistributionTrendBarType(){
    console.log("Accumulation & Distribution Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.barType);
  }
  setTechnicalTrendIdentifierAnalysisAccumulationDistributionTrendLookback(){
    console.log("Accumulation & Distribution Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.lookback);
  }
  setTechnicalTrendIdentifierAnalysisAccumulationDistributionTrendDirection(){
    console.log("Accumulation & Distribution Trend: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.accumulationDistributionTrend.direction);
  }

  //Technical -> Trend Identifier/Analysis -> Trend Support-Resistance
  viewTechnicalTrendIdentifierAnalysisTrendSupportResistanceOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.trendIdentifierAnalysis.trendSupportResistance.isOptionsVisible = true;
  }
  hideTechnicalTrendIdentifierAnalysisTrendSupportResistanceOptions(){
    this.analysisFilterTechnicals.trendIdentifierAnalysis.trendSupportResistance.isOptionsVisible = false;
  }
  setTechnicalTrendIdentifierAnalysisTrendSupportResistanceLookbackPeriod(){
    console.log("Trend Support Resistance: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.trendSupportResistance.lookbackPeriod);
  }
  setTechnicalTrendIdentifierAnalysisTrendSupportResistanceAccuracy(){
    console.log("Trend Support Resistance: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.trendSupportResistance.accuracy);
  }
  setTechnicalTrendIdentifierAnalysisTrendSupportResistancComparator(){
    console.log("Trend Support Resistance: ", this.analysisFilterTechnicals.trendIdentifierAnalysis.trendSupportResistance.comparator);
  }

  //Technical -> Consolidation -> Relative Bollinger Band Width
  viewTechnicalConsolidationRelativeBollingerBandWidthOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.isOptionsVisible = true;
  }
  hideTechnicalConsolidationRelativeBollingerBandWidthOptions(){
    this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.isOptionsVisible = false;
  }
  setTechnicalConsolidationRelativeBollingerBandWidthPeriod(){
    console.log("Relative Bollinger Band Width: ", this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.period);
  }
  setTechnicalConsolidationRelativeBollingerBandWidthCheckedList(item:any[]){
    this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.selectedValue = item;
    console.log("Relative Bollinger Band Width: ", this.analysisFilterTechnicals.consolidation.relativeBollingerBandWidth.selectedValue);
  }
  setTechnicalConsolidationRelativeBollingerBandWidthIndividualCheckedList(item:{}){
    //console.log("setTechnicalConsolidationRelativeBollingerBandWidthIndividualCheckedList: ", item);
  }

  //Technical -> Consolidation -> Bollinger Band Width Trend
  viewTechnicalConsolidationBollingerBandWidthTrendOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.isOptionsVisible = true;
  }
  hideTechnicalConsolidationBollingerBandWidthTrendOptions(){
    this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.isOptionsVisible = false;
  }
  setTechnicalConsolidationBollingerBandWidthTrendPeriod(){
    console.log("Bollinger Band Width Trend: ", this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.period);
  }
  setTechnicalConsolidationBollingerBandWidthTrendDirection(){
    console.log("Bollinger Band Width Trend: ", this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.direction);
  }

  //Technical -> Consolidation -> Triangle Pattern
  viewTechnicalConsolidationTrianglePatternOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.trianglePattern.isOptionsVisible = true;
  }
  hideTechnicalConsolidationTrianglePatternOptions(){
    this.analysisFilterTechnicals.consolidation.trianglePattern.isOptionsVisible = false;
  }
  setTechnicalConsolidationTrianglePatternPeriod(){
    console.log("Triangle Pattern: ", this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.period);
  }
  setTechnicalConsolidationTrianglePatternType(){
    console.log("Triangle Pattern: ", this.analysisFilterTechnicals.consolidation.bollingerBandWidthTrend.type);
  }

  //Technical -> Consolidation -> SMA of Volatility
  viewTechnicalConsolidationSMAofVolatilityOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.SMAofVolatility.isOptionsVisible = true;
  }
  hideTechnicalConsolidationSMAofVolatilityOptions(){
    this.analysisFilterTechnicals.consolidation.SMAofVolatility.isOptionsVisible = false;
  }
  setTechnicalConsolidationSMAofVolatilityPeriodType(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.periodType);
  }
  setTechnicalConsolidationSMAofVolatilityValue1(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.value1);
  }
  setTechnicalConsolidationSMAofVolatilityValue1Period(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.value1Period);
  }
  setTechnicalConsolidationSMAofVolatilityComparator(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.comparator);
  }
  setTechnicalConsolidationSMAofVolatilityBy(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.by);
  }
  setTechnicalConsolidationSMAofVolatilityValue2(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.value2);
  }
  setTechnicalConsolidationSMAofVolatilityValue2Period(){
    console.log("SMA of Volatility: ", this.analysisFilterTechnicals.consolidation.SMAofVolatility.value2Period);
  }

  //Technical -> Consolidation -> SMA of True Range
  viewTechnicalConsolidationSMAofTrueRangeOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.SMAofTrueRange.isOptionsVisible = true;
  }
  hideTechnicalConsolidationSMAofTrueRangeOptions(){
    this.analysisFilterTechnicals.consolidation.SMAofTrueRange.isOptionsVisible = false;
  }
  setTechnicalConsolidationSMAofTrueRangePeriod(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.period);
  }
  setTechnicalConsolidationSMAofTrueRangeValue1(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.value1);
  }
  setTechnicalConsolidationSMAofTrueRangeComparator(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.comparator);
  }
  setTechnicalConsolidationSMAofTrueRangeBy(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.by);
  }
  setTechnicalConsolidationSMAofTrueRangeValue2(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.value2);
  }
  setTechnicalConsolidationSMAofTrueRangeValue2Period(){
    console.log("SMA of True Range: ", this.analysisFilterTechnicals.consolidation.SMAofTrueRange.value2Period);
  }

  //Technical -> Consolidation -> Horizontal SR
  viewTechnicalConsolidationHorizontalSROptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.consolidation.horizontalSR.isOptionsVisible = true;
  }
  hideTechnicalConsolidationHorizontalSROptions(){
    this.analysisFilterTechnicals.consolidation.horizontalSR.isOptionsVisible = false;
  }
  setTechnicalConsolidationHorizontalSRLookbackPeriod(){
    console.log("Horizontal SR: ", this.analysisFilterTechnicals.consolidation.horizontalSR.lookbackPeriod);
  }

  //Technical -> Divergence -> Normalized Accumulation & Distribution
  viewTechnicalDivergenceNormalizedAccumulationDistributionOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.isOptionsVisible = true;
  }
  hideTechnicalDivergenceNormalizedAccumulationDistributionOptions(){
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.isOptionsVisible = false;
  }
  setTechnicalDivergenceNormalizedAccumulationDistributionPeriod(){
    console.log("Normalized Accumulation & Distribution: ", this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.period);
  }
  setTechnicalDivergenceNormalizedAccumulationDistributionComparator(){
    console.log("Normalized Accumulation & Distribution: ", this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.comparator);
  }
  setTechnicalDivergenceNormalizedAccumulationDistributionCheckedList(item:any[]){
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.selectedValue = item;
    console.log("Normalized Accumulation & Distribution: ", this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.selectedValue);
  }
  setTechnicalDivergenceNormalizedAccumulationDistributionIndividualCheckedList(item:{}){
    //console.log("setTechnicalDivergenceNormalizedAccumulationDistributionIndividualCheckedList: ", item);
  }

  //Technical -> Divergence -> Rate of Price Change
  viewTechnicalDivergenceRateOfPriceChangeOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.divergence.rateOfPriceChange.isOptionsVisible = true;
  }
  hideTechnicalDivergenceRateOfPriceChangeOptions(){
    this.analysisFilterTechnicals.divergence.rateOfPriceChange.isOptionsVisible = false;
  }
  setTechnicalDivergenceRateOfPriceChangeLookbackPeriod(){
    console.log("Rate of Price Change: ", this.analysisFilterTechnicals.divergence.rateOfPriceChange.lookbackPeriod);
  }
  setTechnicalDivergenceRateOfPriceChangeComparator(){
    console.log("Rate of Price Change: ", this.analysisFilterTechnicals.divergence.rateOfPriceChange.comparator);
  }
  setTechnicalDivergenceRateOfPriceChangeValuePercentage(){
    console.log("Rate of Price Change: ", this.analysisFilterTechnicals.divergence.rateOfPriceChange.valuePercentage);
  }

  //Technical -> Divergence -> Divergence Strategy
  viewTechnicalDivergenceDivergenceStrategyOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.divergence.divergenceStrategy.isOptionsVisible = true;
  }
  hideTechnicalDivergenceDivergenceStrategyOptions(){
    this.analysisFilterTechnicals.divergence.divergenceStrategy.isOptionsVisible = false;
  }
  setTechnicalDivergenceDivergenceStrategyLookbackPeriod(){
    console.log("Divergence Strategy: ", this.analysisFilterTechnicals.divergence.divergenceStrategy.lookbackPeriod);
  }
  setTechnicalDivergenceDivergenceStrategyType(){
    console.log("Divergence Strategy: ", this.analysisFilterTechnicals.divergence.divergenceStrategy.type);
  }
  setTechnicalDivergenceDivergenceStrategyIndicator(){
    console.log("Divergence Strategy: ", this.analysisFilterTechnicals.divergence.divergenceStrategy.indicator);
  }

  //Technical -> Risk Characteristic/Measure -> True Range Percent
  viewTechnicalRiskCharacteristicMeasureTrueRangePercentOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.riskCharacteristicMeasure.trueRangePercent.isOptionsVisible = true;
  }
  hideTechnicalRiskCharacteristicMeasureTrueRangePercentOptions(){
    this.analysisFilterTechnicals.riskCharacteristicMeasure.trueRangePercent.isOptionsVisible = false;
  }
  setTechnicalRiskCharacteristicMeasureTrueRangePercentSmoothingPeriod(){
    console.log("True Range Percent: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.trueRangePercent.smoothingPeriod);
  }
  setTechnicalRiskCharacteristicMeasureTrueRangePercentComporator(){
    console.log("True Range Percent: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.trueRangePercent.comparator);
  }

  //Technical -> Risk Characteristic/Measure -> Volatility
  viewTechnicalRiskCharacteristicMeasureVolatilityOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.riskCharacteristicMeasure.volatility.isOptionsVisible = true;
  }
  hideTechnicalRiskCharacteristicMeasureVolatilityOptions(){
    this.analysisFilterTechnicals.riskCharacteristicMeasure.volatility.isOptionsVisible = false;
  }
  setTechnicalRiskCharacteristicMeasureVolatilityLookbackPeriod(){
    console.log("Volatility: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.volatility.lookbackPeriod);
  }
  setTechnicalRiskCharacteristicMeasureVolatilityComparator(){
    console.log("Volatility: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.volatility.comparator);
  }

  //Technical -> Risk Characteristic/Measure -> Correlation
  viewTechnicalRiskCharacteristicMeasureCorrelationOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.isOptionsVisible = true;
  }
  hideTechnicalRiskCharacteristicMeasureCorrelationOptions(){
    this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.isOptionsVisible = false;
  }
  setTechnicalRiskCharacteristicMeasureCorrelationOnProductSelected(item: Product){
    console.log("Correlation: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.comparetoSymbol);
  }
  setTechnicalRiskCharacteristicMeasureCorrelationLookbackPeriod(){
    console.log("Correlation: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.lookbackPeriod);
  }
  setTechnicalRiskCharacteristicMeasureCorrelationComparator(){
    console.log("Correlation: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.comparator);
  }
  setTechnicalRiskCharacteristicMeasureCorrelationValueInput(){
    console.log("Correlation: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.correlation.valueInput);
  }

  //Technical -> Risk Characteristic/Measure -> Beta
  viewTechnicalRiskCharacteristicMeasureBetaOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.riskCharacteristicMeasure.beta.isOptionsVisible = true;
  }
  hideTechnicalRiskCharacteristicMeasureBetaOptions(){
    this.analysisFilterTechnicals.riskCharacteristicMeasure.beta.isOptionsVisible = false;
  }
  setTechnicalRiskCharacteristicMeasureBetaLookbackPeriod(){
    console.log("Beta: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.beta.lookbackPeriod);
  }
  setTechnicalRiskCharacteristicMeasureBetaComparator(){
    console.log("Beta: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.beta.comparator);
  }

  //Technical -> Risk Characteristic/Measure -> Sharpe Ratio
  viewTechnicalRiskCharacteristicMeasureSharpeRatioOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.isOptionsVisible = true;
  }
  hideTechnicalRiskCharacteristicMeasureSharpeRatioOptions(){
    this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.isOptionsVisible = false;
  }
  setTechnicalRiskCharacteristicMeasureSharpeRatioLookbackPeriod(){
    console.log("Sharpe Ratio: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.lookbackPeriod);
  }
  setTechnicalRiskCharacteristicMeasureSharpeRatioValueInput(){
    console.log("Sharpe Ratio: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.valueInput);
  }
  setTechnicalRiskCharacteristicMeasureSharpeRatioComparator(){
    console.log("Sharpe Ratio: ", this.analysisFilterTechnicals.riskCharacteristicMeasure.sharpeRatio.comparator);
  }

  //Technical -> Momentum -> MACD
  viewTechnicalMomentumMACDOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.momentum.MACD.isOptionsVisible = true;
  }
  hideTechnicalMomentumMACDOptions(){
    this.analysisFilterTechnicals.momentum.MACD.isOptionsVisible = false;
  }
  setTechnicalMomentumMACDEMAPeriod(){
    console.log("MACD: ", this.analysisFilterTechnicals.momentum.MACD.EMAPeriod);
  }
  setTechnicalMomentumMACDFastPeriod(){
    console.log("MACD: ", this.analysisFilterTechnicals.momentum.MACD.fastPeriod);
  }
  setTechnicalMomentumMACDSlowPeriod(){
    console.log("MACD: ", this.analysisFilterTechnicals.momentum.MACD.slowPeriod);
  }
  setTechnicalMomentumMACDValue1(){
    console.log("MACD: ", this.analysisFilterTechnicals.momentum.MACD.value1);
  }

  //Technical -> Momentum -> RSI
  viewTechnicalMomentumRSIOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.momentum.RSI.isOptionsVisible = true;
  }
  hideTechnicalMomentumRSIOptions(){
    this.analysisFilterTechnicals.momentum.RSI.isOptionsVisible = false;
  }
  setTechnicalMomentumRSIPeriod(){
    console.log("RSI: ", this.analysisFilterTechnicals.momentum.RSI.period);
  }
  setTechnicalMomentumRSIComparator(){
    console.log("RSI: ", this.analysisFilterTechnicals.momentum.RSI.comparator);
  }
  setTechnicalMomentumRSIValue1(){
    console.log("RSI: ", this.analysisFilterTechnicals.momentum.RSI.value1);
  }

  //Technical -> Momentum -> Stochastic Oscillator
  viewTechnicalMomentumStochasticOscillatorOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.momentum.stochasticOscillator.isOptionsVisible = true;
  }
  hideTechnicalMomentumStochasticOscillatorOptions(){
    this.analysisFilterTechnicals.momentum.stochasticOscillator.isOptionsVisible = false;
  }
  setTechnicalMomentumStochasticOscillatorSlowPeriod(){
    console.log("Stochastic Oscillator: ", this.analysisFilterTechnicals.momentum.stochasticOscillator.slowPeriod);
  }
  setTechnicalMomentumStochasticOscillatorFastPeriod(){
    console.log("Stochastic Oscillator: ", this.analysisFilterTechnicals.momentum.stochasticOscillator.fastPeriod);
  }
  setTechnicalMomentumStochasticOscillatorComparator(){
    console.log("Stochastic Oscillator: ", this.analysisFilterTechnicals.momentum.stochasticOscillator.comparator);
  }
  setTechnicalMomentumStochasticOscillatorValue1(){
    console.log("Stochastic Oscillator: ", this.analysisFilterTechnicals.momentum.stochasticOscillator.value1);
  }

  //Technical -> Momentum -> ADX
  viewTechnicalMomentumADXOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.momentum.ADX.isOptionsVisible = true;
  }
  hideTechnicalMomentumADXOptions(){
    this.analysisFilterTechnicals.momentum.ADX.isOptionsVisible = false;
  }
  setTechnicalMomentumADXLookback(){
    console.log("ADX: ", this.analysisFilterTechnicals.momentum.ADX.lookback);
  }
  setTechnicalMomentumADXComparator(){
    console.log("ADX: ", this.analysisFilterTechnicals.momentum.ADX.comparator);
  }
  setTechnicalMomentumADXValueInput(){
    console.log("ADX: ", this.analysisFilterTechnicals.momentum.ADX.valueInput);
  }

  //Technical -> Momentum -> Normalized On Balance Volume
  viewTechnicalMomentumNormalizedOnBalanceVolumeOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.isOptionsVisible = true;
  }
  hideTechnicalMomentumNormalizedOnBalanceVolumeOptions(){
    this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.isOptionsVisible = false;
  }
  setTechnicalMomentumNormalizedOnBalanceVolumePeriod(){
    console.log("Normalized On Balance Volume: ", this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.period);
  }
  setTechnicalMomentumNormalizedOnBalanceVolumeComparator(){
    console.log("Normalized On Balance Volume: ", this.analysisFilterTechnicals.momentum.normalizedOnBalanceVolume.comparator);
  }
  setTechnicalMomentumNormalizedOnBalanceVolumeCheckedList(item:any[]){
    this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.selectedValue = item;
    console.log("Normalized Accumulation & Distribution: ", this.analysisFilterTechnicals.divergence.normalizedAccumulationDistribution.selectedValue);
  }
  setTechnicalMomentumNormalizedOnBalanceVolumeIndividualCheckedList(item:{}){
    //console.log("setTechnicalMomentumNormalizedOnBalanceVolumeIndividualCheckedList: ", item);
  }

  //Technical -> Breakout -> Major Price Breakout
  viewTechnicalBreakoutMajorPriceBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.breakout.majorPriceBreakout.isOptionsVisible = true;
  }
  hideTechnicalBreakoutMajorPriceBreakoutOptions(){
    this.analysisFilterTechnicals.breakout.majorPriceBreakout.isOptionsVisible = false;
  }
  setTechnicalBreakoutMajorPriceBreakoutBreakOutDiretion(){
    console.log("Major Price Breakout: ", this.analysisFilterTechnicals.breakout.majorPriceBreakout.breakoutDirection);
  }
  setTechnicalBreakoutMajorPriceBreakoutTimePeriod(){
    console.log("Major Price Breakout: ", this.analysisFilterTechnicals.breakout.majorPriceBreakout.timePeriod);
  }

  //Technical -> Breakout -> Peak-Trough Breakout
  viewTechnicalBreakoutPeakTroughBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.breakout.peakTroughBreakout.isOptionsVisible = true;
  }
  hideTechnicalBreakoutPeakTroughBreakoutOptions(){
    this.analysisFilterTechnicals.breakout.peakTroughBreakout.isOptionsVisible = false;
  }
  setTechnicalBreakoutPeakTroughBreakoutType(){
    console.log("Peak-Trough Breakout: ", this.analysisFilterTechnicals.breakout.peakTroughBreakout.type);
  }
  setTechnicalBreakoutPeakTroughBreakoutLookbackPeriod(){
    console.log("Peak-Trough Breakout: ", this.analysisFilterTechnicals.breakout.peakTroughBreakout.lookbackPeriod);
  }

  //Technical -> Breakout -> Historical Breakout
  viewTechnicalBreakoutHistoricalBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.breakout.historicalBreakout.isOptionsVisible = true;
  }
  hideTechnicalBreakoutHistoricalBreakoutOptions(){
    this.analysisFilterTechnicals.breakout.historicalBreakout.isOptionsVisible = false;
  }
  setTechnicalBreakoutHistoricalBreakoutType(){
    console.log("Historical Breakout: ", this.analysisFilterTechnicals.breakout.historicalBreakout.type);
  }
  setTechnicalBreakoutHistoricalBreakoutLookbackPeriod(){
    console.log("Historical Breakout: ", this.analysisFilterTechnicals.breakout.historicalBreakout.lookbackPeriod);
  }

  //Technical -> Breakout -> Fibonacci Breakout
  viewTechnicalBreakoutFibonacciBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterTechnicals.breakout.fibonacciBreakout.isOptionsVisible = true;
  }
  hideTechnicalBreakoutFibonacciBreakoutOptions(){
    this.analysisFilterTechnicals.breakout.fibonacciBreakout.isOptionsVisible = false;
  }
  setTechnicalBreakoutFibonacciBreakoutLookbackPeriod(){
    console.log("Fibonacci Breakout: ", this.analysisFilterTechnicals.breakout.fibonacciBreakout.lookbackPeriod);
  }
  setTechnicalBreakoutFibonacciBreakoutLine(){
    console.log("Fibonacci Breakout: ", this.analysisFilterTechnicals.breakout.fibonacciBreakout.line);
  }
  setTechnicalBreakoutFibonacciBreakoutIsElliot(){
    console.log("Fibonacci Breakout: ", this.analysisFilterTechnicals.breakout.fibonacciBreakout.isElliot);
  }

  //Sentiment -> Analyst Rating
  viewSentimentAnalystRatingOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterSentiment.analystRating.isOptionsVisible = true;
  }
  hideSentimentAnalystRatingOptions(){
    this.analysisFilterSentiment.analystRating.isOptionsVisible = true;
  }
  setSentimentAnalystRatingCheckedList(item:any[]){
    this.analysisFilterSentiment.analystRating.selectedValue = item;
    console.log("Analyst Rating: ", this.analysisFilterSentiment.analystRating.selectedValue);
  }
  setSentimentAnalystRatingIndividualCheckedList(item:{}){
    //console.log("setSentimentAnalystRatingIndividualCheckedList: ", item);
  }

  //Sentiment -> News based Price Trigger
  viewSentimentNewsBasedPriceTriggerOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterSentiment.newsbasedPriceTrigger.isOptionsVisible = true;
  }
  hideSentimentNewsBasedPriceTriggerOptions(){
    this.analysisFilterSentiment.newsbasedPriceTrigger.isOptionsVisible = true;
  }
  setSentimentNewsBasedPriceTriggerLatestNewsSentiment(){
    console.log("News based Price Trigger: ", this.analysisFilterSentiment.newsbasedPriceTrigger.latestNewsSentiment);
  }
  setSentimentNewsBasedPriceTriggerLatestNewsIsWithin(){
    console.log("News based Price Trigger: ", this.analysisFilterSentiment.newsbasedPriceTrigger.latestNewsIsWithin);
  }

  //Sentiment -> Target Price
  viewSentimentTargetPriceOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterSentiment.targetPrice.isOptionsVisible = true;
  }
  hideSentimentTargetPriceOptions(){
    this.analysisFilterSentiment.targetPrice.isOptionsVisible = true;
  }
  setSentimentTargetPriceParameter1(){
    console.log("Target Price: ", this.analysisFilterSentiment.targetPrice.parameter1);
  }
  setSentimentTargetPriceParameter2(){
    console.log("Target Price: ", this.analysisFilterSentiment.targetPrice.parameter2);
  }

  //Sentiment -> Analyst Action
  viewSentimentAnalystActionOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterSentiment.analystAction.isOptionsVisible = true;
  }
  hideSentimentAnalystActionOptions(){
    this.analysisFilterSentiment.analystAction.isOptionsVisible = true;
  }
  setSentimentAnalystActionType(){
    console.log("Analyst Action: ", this.analysisFilterSentiment.analystAction.type);
  }

  //Event -> Volume Breakout
  viewEventVolumeBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterEvent.volumeBreakout.isOptionsVisible = true;
  }
  hideEventVolumeBreakoutOptions(){
    this.analysisFilterEvent.volumeBreakoutis.isOptionsVisible = true;
  }
  setSentimentAnalystActionLookbackPeriod(){
    console.log("Volume Breakout: ", this.analysisFilterEvent.volumeBreakout.lookbackPeriod);
  }
  setSentimentAnalystActionLookbackPeriodMulti(){
    console.log("Volume Breakout: ", this.analysisFilterEvent.volumeBreakout.multiplier);
  }

  //Event -> Unusual Gap
  viewEventUnusualGapOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterEvent.unusualGap.isOptionsVisible = true;
  }
  hideEventUnusualGapOptions(){
    this.analysisFilterEvent.unusualGap.isOptionsVisible = true;
  }
  setEventUnusualGapType(){
    console.log("Unusual Gap: ", this.analysisFilterEvent.unusualGap.type);
  }

  //Event -> Near Earning Announcement
  viewEventNearEarningAnnouncementOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterEvent.nearEarningAnnouncement.isOptionsVisible = true;
  }
  hideEventNearEarningAnnouncementOptions(){
    this.analysisFilterEvent.nearEarningAnnouncement.isOptionsVisible = true;
  }
  setEventNearEarningAnnouncementDaysAhead(){
    console.log("Near Earning Announcement: ", this.analysisFilterEvent.nearEarningAnnouncement.daysAhead);
  }

  //Event -> News Volume Breakout
  viewEventNewsVolumeBreakoutOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterEvent.newsVolumeBreakout.isOptionsVisible = true;
  }
  hideEventNearNewsVolumeBreakoutOptions(){
    this.analysisFilterEvent.newsVolumeBreakout.isOptionsVisible = true;
  }

  //Event -> News Trigger
  viewEventNewsTriggerOptions(){
    this.resetAnalysisFilterOptions();
    this.analysisFilterEvent.newsTrigger.isOptionsVisible = true;
  }
  hideEventNewsTriggerOptions(){
    this.analysisFilterEvent.newsTrigger.isOptionsVisible = true;
  }
  setEventNewsTriggerValue(){
    console.log("News Trigger: ", this.analysisFilterEvent.newsTrigger.value);
  }

  getIronCondorBundlePrice(): number {
    var legs = this.ByStrategyForm.get('Legs')?.value;
    if (legs.length === 4) {
      var totalPrice = legs.filter((x: ContractOptionLeg) => { return x.Action === 'Buy';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;})
        - legs.filter((x: ContractOptionLeg) => { return x.Action === 'Sell';}).map((x: ContractOptionLeg) => { return x.LimitPrice;}).reduce((total: number, item: number) => {return total + item;}); 
      return Math.round( totalPrice * 100 + Number.EPSILON ) / 100;
    }
    return 0;
  }
}