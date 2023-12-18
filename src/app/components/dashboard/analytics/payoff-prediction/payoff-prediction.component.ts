import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import * as Highcharts from 'highcharts';
import { Options } from '@angular-slider/ngx-slider';
import { PayoffTableEntry } from 'src/app/interface/payoff-table-entry';

declare var $: any;
declare var window: any;
interface CustomChartClickEventObject extends Highcharts.ChartClickEventObject {
  point: Highcharts.Point;
}
@Component({
  selector: 'ow-analytic-payoff-prediction-tab',
  templateUrl: './payoff-prediction.component.html',
  styleUrls: ['./payoff-prediction.component.css']
})
export class PayoffPredictionComponent implements OnInit {
  ConfigForm: FormGroup;
  Highcharts = Highcharts;
  isLoadingPayoffProbabilityChart: boolean = false;
  payoffProbabilityChartOptions: any = {};
  payoffProbabilityChartUpdateFlag: boolean = false;
  SelectedPayoffTableValue: PayoffTableEntry;
  PayoffTableValue: PayoffTableEntry[];
  ModalNumberPrediction:number;
  formModal: any;

  IVolatExpiryOptions: Options = {
    floor: 0,
    ceil: 1,
    step: 1,
    minLimit: 0,
    maxLimit: 1,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  }
  PriceatExpiryOptions: Options = {
    floor: 0,
    ceil: 1,
    step: 1,
    minLimit: 0,
    maxLimit: 1,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  }

  constructor(
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.ConfigForm = this.formBuilder.group(
      {
        IVolatExpiry: [20],
        PriceatExpiry: [60]
      }
    );
    this.PayoffTableValue = [];
    this.ModalNumberPrediction=0;

    this.SelectedPayoffTableValue = this.PayoffTableValue[0];
  }

  initSidebarData(){
    this.IVolatExpiryOptions = {
      floor: 0,
      ceil: 100,
      step: 1,
      minLimit: 1,
      maxLimit: 100,
      showSelectionBar: true,
      translate: (value: number): string => {
        return value + '%';
      }
    }

    this.PriceatExpiryOptions = {
      floor: 0,
      ceil: 100,
      step: 1,
      minLimit: 1,
      maxLimit: 100,
      showSelectionBar: true,
      translate: (value: number): string => {
        return value + '%';
      }
    }
  }

  initPayoffProbabilityChart(payoffProbabilityData: any){
    const borderRadius = require("highcharts-border-radius");
    borderRadius(Highcharts);

    this.payoffProbabilityChartOptions = {
      title: {
          text: ''
      },
      subtitle: {
          text: ''
      },
      colors:['#ECCB97'],
      plotOptions: {
        column: {
          grouping: false,
          borderRadiusTopLeft: 10,
          borderRadiusTopRight: 10
        },
        series: {
          events: {
            click: (event: CustomChartClickEventObject) => {
              // Handle the click event
              if(event.point){
                const clickedPoint = event.point.y;
                // this.showModal(clickedPoint);
                console.log('Clicked Point:', clickedPoint);
                if(clickedPoint) this.showModal(clickedPoint);
                
              }
              
            },
          },
        },
      },
      xAxis: {
        labels:{
          enabled:false
        }
      },
      yAxis: {
        min: 0,
        max:100,
        tickInterval: 20,
        labels: {
            format: '{value}%',
        }
      },
       
      series: [{
          type: 'column',
          name: 'Payoff Probability',
          colorByPoint: true,
          data: payoffProbabilityData,
          showInLegend: false,
          animation: {
            duration: 1000
          }
      }],
      credits: {
        enabled: false
      }
    }
  }
  showModal(value:number){
    // alert(value);
    this.ModalNumberPrediction = value;
    this.formModal.show();
  }
  ngOnInit(): void {
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModalPrediction')
    );
    this.isLoadingPayoffProbabilityChart = true;
    let initPayoffProbabilityChartData = [50, 55, 60, 70, 80, 90, 100, 90, 80, 70, 60, 55, 50];
    this.initPayoffProbabilityChart(initPayoffProbabilityChartData);
    this.initSidebarData();
  }

  changeChartData(){
    this.isLoadingPayoffProbabilityChart = true;
    this.payoffProbabilityChartUpdateFlag = true;

    setTimeout(() => {
      let initPayoffProbabilityChartData = [50, 55, 60, 70, 80, 90, 100, 90, 80, 70, 60, 55, 50];
      this.payoffProbabilityChartOptions.series[0].data = initPayoffProbabilityChartData;
      this.isLoadingPayoffProbabilityChart = false;
      this.payoffProbabilityChartUpdateFlag = true;
    }, 2000);
  }

  resetChartData(){
    this.isLoadingPayoffProbabilityChart = true;
    this.payoffProbabilityChartUpdateFlag = true;

    setTimeout(() => {
      let initPayoffProbabilityChartData = [1, 5, 11, 22, 33, 40, 44, 50, 55, 60, 70, 80, 90, 100, 90, 80, 70, 60, 55, 50, 44, 40, 33, 22, 11, 5, 1];
      this.payoffProbabilityChartOptions.series[0].data = initPayoffProbabilityChartData;
      this.isLoadingPayoffProbabilityChart = false;
      this.payoffProbabilityChartUpdateFlag = true;
    }, 2000);
  }

  confirmConfigChange() {
    var IVolatExpiry = this.ConfigForm.get('IVolatExpiry')?.value;
    var PriceatExpiry = this.ConfigForm.get('PriceatExpiry')?.value;

    var requestObj = {
      IVolatExpiry: IVolatExpiry,
      PriceatExpiry: PriceatExpiry
    };

    console.log("Updating prediction table...", JSON.stringify(requestObj));

    this.PayoffTableValue = [{
      TimeToExpiry: 1,
      ExpectedPayoff: 100,
      WinningChance: 0.5222,
      IsSelected: false
    }, {
      TimeToExpiry: 2,
      ExpectedPayoff: 200,
      WinningChance: 0.7237,
      IsSelected: false
    }, {
      TimeToExpiry: 3,
      ExpectedPayoff: 300,
      WinningChance: 0.3639,
      IsSelected: false
    }, {
      TimeToExpiry: 4,
      ExpectedPayoff: 400,
      WinningChance: 0.2072,
      IsSelected: false
    }, {
      TimeToExpiry: 5,
      ExpectedPayoff: 500,
      WinningChance: 0.3051,
      IsSelected: false
    }, {
      TimeToExpiry: 6,
      ExpectedPayoff: 600,
      WinningChance: 0.2916,
      IsSelected: false
    }, {
      TimeToExpiry: 7,
      ExpectedPayoff: 700,
      WinningChance: 0.9386,
      IsSelected: false
    }, {
      TimeToExpiry: 8,
      ExpectedPayoff: 800,
      WinningChance: 0.2916,
      IsSelected: false
    }, {
      TimeToExpiry: 9,
      ExpectedPayoff: 900,
      WinningChance: 0.3056,
      IsSelected: false
    }, {
      TimeToExpiry: 10,
      ExpectedPayoff: 1000,
      WinningChance: 0.1123,
      IsSelected: false
    }, {
      TimeToExpiry: 11,
      ExpectedPayoff: 1100,
      WinningChance: 0.052,
      IsSelected: false
    }]

    // TODO: API Call
    this.isLoadingPayoffProbabilityChart = true;
    this.payoffProbabilityChartUpdateFlag = true;

    setTimeout(() => {
      let initPayoffProbabilityChartData = [1, 5, 11, 22, 33, 40, 44, 50, 55, 60, 70, 80, 90, 100, 90, 80, 70, 60, 55, 50, 44, 40, 33, 22, 11, 5, 1];
      this.payoffProbabilityChartOptions.series[0].data = initPayoffProbabilityChartData;
      this.isLoadingPayoffProbabilityChart = false;
    }, 2000);
  }

  setSelectedPayoffEntry(payoff: PayoffTableEntry) {
    this.PayoffTableValue.map((obj: PayoffTableEntry) =>{
      if(obj.IsSelected !== undefined){
        delete obj.IsSelected;
      }
      return obj;
    });

    payoff.IsSelected = true;
    console.log("snapshootObj.Call: ", JSON.stringify(payoff));
  }
}