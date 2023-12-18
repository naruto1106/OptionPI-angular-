import { Component, OnInit, Input } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as Highcharts from 'highcharts';
import { Options } from '@angular-slider/ngx-slider';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { TargetVariable } from 'src/app/interface/target-variable';
import { UtilityService } from 'src/app/_service/utility.service';
import { OptionsParameter } from 'src/app/interface/options-parameter';
import * as moment from 'moment';
declare var window: any;
interface CustomChartClickEventObject extends Highcharts.ChartClickEventObject {
  point: Highcharts.Point;
}
@Component({
  selector: 'ow-analytic-payoff-visualizer-tab',
  templateUrl: './payoff-visualizer.component.html',
  styleUrls: ['./payoff-visualizer.component.css']
})
export class PayoffVisualizerComponent implements OnInit {
  ConfigForm: FormGroup;
  StrategyList: OptionsStrategy[];
  OptionParameterList: OptionsParameter[];
  TargetVariableList: TargetVariable[];
  ModalNumberVisual:number;
  formModal: any;
  @Input() isCollapsed!: any;

  Highcharts = Highcharts;
  isLoadingPayoffVisualizerChart: boolean = false;
  payoffVisualizerChartOptions: any = {};
  // chart: any = {};
  payoffVisualizerChartUpdateFlag: boolean = false;

  LegDistanceNewOptions: Options = {
    floor: 2.5,
    ceil: 25,
    step: 0.1,
    minLimit: 2.5,
    maxLimit: 25,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  LegDistanceFurtherOptions: Options = {
    floor: 2.5,
    ceil: 25,
    step: 0.1,
    minLimit: 2.5,
    maxLimit: 25,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  RiskFreeRateOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 2,
    minLimit: 0,
    maxLimit: 100,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  DividendYieldOptions: Options = {
    floor: 0,
    ceil: 100,
    step: 2,
    minLimit: 0,
    maxLimit: 100,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  };
  TimeToExpiryOptions: Options = {
    floor: 15,
    ceil: 90,
    step: 15,
    minLimit: 15,
    maxLimit: 90,
    showSelectionBar: true
  };
  IVSkewRateOptions: Options = {
    floor: 0,
    ceil: 2,
    step: 0.05,
    minLimit: 0,
    maxLimit: 2,
    showSelectionBar: true
  };

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder,
    private utilityService: UtilityService,
    private modalService: NgbModal

  ) {
    this.StrategyList = utilityService.getStrategySelections();;
    this.TargetVariableList = this.utilityService.getAnalyticsTargetVariables();
    this.OptionParameterList = this.utilityService.getOptionParameters(this.StrategyList[0].Name);
    this.ModalNumberVisual=0;
    this.ConfigForm = this.formBuilder.group(
      {
        SelectedTargetVariable: [this.TargetVariableList[0]],
        SelectedStrategy: [this.StrategyList[0]],
        SelectedStock: [{}],
        SelectedExpiry: [""],
        SelectedParameter: [this.OptionParameterList[0]],
        MaxLoss: [100],
        MaxGain: [300],
        Probability: [10],
        Amount: [2000],
        LegDistanceNew: [5],
        LegDistanceFurther: [20],
        TimeToExpiry: 30,
        RiskFreeRate: 2,
        DividendYield: 2,
        IVSkewRate: 1
      }
    );
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    // if (this.isCollapsed) {
    //   $('.SideBarMain').removeClass('active');
    //   $('.SideBarLft').removeClass('Addwidth');
    // } else {
    //   $('.SideBarMain').addClass('active');
    //   $('.SideBarLft').addClass('Addwidth');
    // }
  }
  
  initPayoffVisualizerChart(payoffVisualizerChartSeriesData: any){

    this.payoffVisualizerChartOptions = {
      title: {
          text: ''
      },
      subtitle: {
          text: ''
      },
      xAxis: {
        labels:{
          enabled:false
        }
      },
      yAxis: {
          title: false,
          min: 0,
          max:100,
          tickInterval: 20,
          labels: {
              format: '{value}%',
          }
      },
      plotOptions: {
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
      
      series: payoffVisualizerChartSeriesData,
      credits: {
        enabled: false
      },
     
    }
   
  
  }
  showModal(value:number){
    // alert(value);
    this.ModalNumberVisual = value;
    this.formModal.show();
  }

  ngOnInit(): void {
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModalVisual')
    );
    var payoffVisualizerChartSeriesData = [{
      name: 'Stock Price',
      type: 'spline',
      color: '#FF0000',
      data: Array.from({length: 10}, () => Math.random() * 100),
      animation: {
        duration: 1000
      },
      dataLabels: false,
   
    },{
      name: 'Stock Price 1',
      type: 'spline',
      color: '#00FF00',
      data: Array.from({length: 10}, () => Math.random() * 100),
      animation: {
        duration: 1000
      },
      dataLabels: false
    },
    {
      name: 'Stock Price 2',
      type: 'spline',
      color: '#0000FF',
      data: Array.from({length: 10}, () => Math.random() * 100),
      animation: {
        duration: 1000
      },
      dataLabels: false
    }]
    this.initPayoffVisualizerChart(payoffVisualizerChartSeriesData);
  
   
  }

  onStrategyChanged(selectedStrategy: OptionsStrategy) {
    if (selectedStrategy) {
      this.OptionParameterList = this.utilityService.getOptionParameters(selectedStrategy.Name);
      this.ConfigForm.patchValue({SelectedParameter: this.OptionParameterList[0]});
    } else {
      this.OptionParameterList = this.utilityService.getOptionParameters("");
      this.ConfigForm.patchValue({SelectedParameter: this.OptionParameterList[0]});
    }
  }

  confirmConfigChange() {
    var targetVariable = this.ConfigForm.get('SelectedTargetVariable')?.value;
    var strategy = this.ConfigForm.get('SelectedStrategy')?.value;
    var parameter = this.ConfigForm.get('SelectedParameter')?.value;
    var legDistanceNew = this.ConfigForm.get('LegDistanceNew')?.value;
    var legDistanceFurther = this.ConfigForm.get('LegDistanceFurther')?.value;
    var timeToExpiry = this.ConfigForm.get('TimeToExpiry')?.value;
    var riskFreeRate = this.ConfigForm.get('RiskFreeRate')?.value;
    var dividendYield = this.ConfigForm.get('DividendYield')?.value;
    var ivSkewRate = this.ConfigForm.get('IVSkewRate')?.value;
    var amount = this.ConfigForm.get('Amount')?.value;

    var requestObj = {
      targetVariable: targetVariable.Name,
      strategy: strategy.Name,
      parameter: parameter.Name,
      legDistanceNew: legDistanceNew,
      legDistanceFurther: legDistanceFurther,
      timeToExpiry: timeToExpiry,
      riskFreeRate: riskFreeRate,
      dividendYield: dividendYield,
      ivSkewRate: ivSkewRate,
      amount: amount
    };

    console.log("Updating payoff visualizer...", JSON.stringify(requestObj));

    // TODO: API Call
    this.isLoadingPayoffVisualizerChart = true;
    setTimeout(() => {
      this.payoffVisualizerChartOptions.series[0].data = Array.from({length: 10}, () => Math.random() * 100);
      this.payoffVisualizerChartOptions.series[1].data = Array.from({length: 10}, () => Math.random() * 100);
      this.payoffVisualizerChartOptions.series[2].data = Array.from({length: 10}, () => Math.random() * 100);
      this.isLoadingPayoffVisualizerChart = false;
    }, 2000);
  }
 

}