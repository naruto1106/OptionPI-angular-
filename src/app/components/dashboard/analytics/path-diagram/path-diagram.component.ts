import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, Validators, FormGroup, FormBuilder, FormArray, AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { OptionsStrategy } from 'src/app/interface/options-strategy';
import { TargetVariable } from 'src/app/interface/target-variable';
import { UtilityService } from 'src/app/_service/utility.service';
import * as Highcharts from 'highcharts';
import { Options } from '@angular-slider/ngx-slider';
import { OptionsParameter } from 'src/app/interface/options-parameter';
import * as moment from 'moment';
declare var window: any;
interface CustomChartClickEventObject extends Highcharts.ChartClickEventObject {
  point: Highcharts.Point;
}
@Component({
  selector: 'ow-analytic-path-diagram-tab',
  templateUrl: './path-diagram.component.html',
  styleUrls: ['./path-diagram.component.css']
})
export class PathDiagramComponent implements OnInit {
  ConfigForm: FormGroup;
  SelectedStrategy: OptionsStrategy;
  StrategyList: OptionsStrategy[];
  OptionParameterList: OptionsParameter[];
  TargetVariableList: TargetVariable[];
  ModalNumberDiagramX:number;
  ModalNumberDiagramY:number;
  formModal: any;

  @Input() isCollapsed!: any;

  Highcharts = Highcharts;
  isLoadingPathDiagramChart: boolean = false;
  pathDiagramChartOptions: any = {};
  pathDiagramChartUpdateFlag: boolean = false;

  StockPriceValue: number = 0;
  IVValue: number = 0;
  DayValue: number = 0;
  StockPriceOptions: Options = {
    floor: -100,
    ceil: 100,
    step: 0.1,
    minLimit: 0,
    maxLimit: 1,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  }
  IVOptions: Options = {
    floor: 0,
    ceil: 1,
    step: 0.1,
    minLimit: 0,
    maxLimit: 1,
    showSelectionBar: true,
    translate: (value: number): string => {
      return value + '%';
    }
  }
  DayOptions: Options = {
    floor: 0,
    ceil: 1,
    step: 1,
    minLimit: 0,
    maxLimit: 1,
    showSelectionBar: true,
  }
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

  addNewFormArray: any = [];

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private formBuilder: FormBuilder,
    private utilityService: UtilityService
  ) {
    this.StrategyList = utilityService.getStrategySelections();
    this.SelectedStrategy = this.StrategyList[0];
    this.TargetVariableList = this.utilityService.getAnalyticsTargetVariables();
    this.ModalNumberDiagramX=0;
    this.ModalNumberDiagramY=0;
    this.OptionParameterList = this.utilityService.getOptionParameters(this.StrategyList[0].Name);
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

  initSidebarData(){
    this.StockPriceValue = 6;
    this.StockPriceOptions = {
      floor: -100,
      ceil: 100,
      step: 0.1,
      minLimit: -100,
      maxLimit: 100,
      showSelectionBar: true,
      translate: (value: number): string => {
        return value + '%';
      }
    }

    this.IVValue = 6;
    this.IVOptions = {
      floor: 0,
      ceil: 100,
      step: 0.1,
      minLimit: 0,
      maxLimit: 100,
      showSelectionBar: true,
      translate: (value: number): string => {
        return value + '%';
      }
    }

    this.DayValue = 6;
    this.DayOptions = {
      floor: 1,
      ceil: 25,
      step: 1,
      minLimit: 1,
      maxLimit: 25,
      showSelectionBar: true
    }
  }

  initPathDiagramChart(pathDiagramChartData: any){

    this.pathDiagramChartOptions = {
      title: {
          text: ''
      },
      subtitle: {
          text: ''
      },
      xAxis: {
        title: {
          enabled: false,
          text: 'Stock Price'
        },
        min: 150,
        max: 180,
        tickInterval: 1,
      },
      yAxis: {
        title: {
          enabled: false
        },
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
                const clickedPointX = event.point.x;
                const clickedPointY = event.point.y;
                // this.showModal(clickedPointY);
                // console.log('Clicked Point:', clickedPointY);
                if(clickedPointX && clickedPointY) this.showModal(clickedPointX, clickedPointY);
                
              }
              
            },
          },
        },
      },
      series: [{
          name: 'Stock Price',
          type: 'scatter',
          zoomType: 'xy',
          color: '#ECCB97',
          data: pathDiagramChartData,
          animation: {
            duration: 1000
          },
          dataLabels: false
      }],
      credits: {
        enabled: false
      }
    }
  }

  initAddNewFormInputs(){
    return {
      stockprice: {
        name: "stockprice",
        value: this.StockPriceValue,
        options: this.StockPriceOptions
      },
      IV: {
        name: "IV",
        value: this.IVValue,
        options: this.IVOptions
      },
      DayValue: {
        name: "DayValue",
        value: this.DayValue,
        options: this.DayOptions
      }
    };
  }
  showModal(value1:number,value2:number){
    // alert(value);
    this.ModalNumberDiagramX = value1;
    this.ModalNumberDiagramY = value2;
    this.formModal.show();
  }
  ngOnInit(): void {
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('myModalDiagram')
    );
    let pathDiagramChartData = [[161.2, 51.6], [167.5, 59.0], [159.5, 49.2], [157.0, 63.0], [155.8, 53.6],
    [156.2, 60.0], [149.9, 46.8], [169.5, 57.3], [160.0, 64.1], [175.3, 63.6],
    [169.5, 67.3], [160.0, 75.5], [172.7, 68.2], [162.6, 61.4], [157.5, 76.8],
    [176.5, 71.8], [164.4, 55.5], [160.7, 48.6], [174.0, 66.4], [163.8, 67.3]];
    this.initPathDiagramChart(pathDiagramChartData);
    this.initSidebarData();

    this.addNewFormArray.push(this.initAddNewFormInputs());
  }

  addNewFormData(){
    this.addNewFormArray.push(this.initAddNewFormInputs());
  }

  removeNewFormData(addNewFormIndex: number){
    this.addNewFormArray.splice(addNewFormIndex, 1);
  }

  addNewFormSubmit(addNewFormIndex: number){
    var submittedFormData = this.addNewFormArray[addNewFormIndex];
    console.log("stockprice: ", submittedFormData.stockprice.value);
    console.log("IV: ", submittedFormData.IV.value);
    console.log("DayValue: ", submittedFormData.DayValue.value);
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

    console.log("Updating path diagram...", JSON.stringify(requestObj));

    // TODO: API Call
    this.isLoadingPathDiagramChart = true;
    setTimeout(() => {
      let pathDiagramChartData = [[161.2, 51.6], [167.5, 59.0], [159.5, 49.2], [157.0, 63.0], [155.8, 53.6],
      [156.2, 60.0], [149.9, 46.8], [169.5, 57.3], [160.0, 64.1], [175.3, 63.6],
      [169.5, 67.3], [160.0, 75.5], [172.7, 68.2], [162.6, 61.4], [157.5, 76.8],
      [176.5, 71.8], [164.4, 55.5], [160.7, 48.6], [174.0, 66.4], [163.8, 67.3]];
      this.initPathDiagramChart(pathDiagramChartData);
      this.pathDiagramChartOptions.series[0].data = pathDiagramChartData;
      this.isLoadingPathDiagramChart = false;
    }, 2000);
  }

}